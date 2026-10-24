import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sanitizeText, sanitizePhone } from '@/lib/security/sanitize'
import { z } from 'zod'

// Only Lucas (superadmin) can access these routes
// Verified by SUPERADMIN_EMAIL env var + Supabase Auth
async function verifySuperadmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const supabase = createServiceClient()

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (!superadminEmail || user.email !== superadminEmail) return null

  return user
}

const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  store_name: z.string().min(2).max(100),
  store_slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  whatsapp: z.string().min(10).max(20),
  plan: z.enum(['starter', 'pro', 'premium']),
  setup_fee_paid: z.boolean().default(false),
})

// GET /api/superadmin/clients — list all clients with their stores
export async function GET(req: NextRequest) {
  const admin = await verifySuperadmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const supabase = createServiceClient()

  const { data: stores, error } = await supabase
    .from('stores')
    .select(`
      id,
      name,
      slug,
      whatsapp,
      plan,
      active,
      created_at,
      profiles!inner(
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[superadmin/clients GET]', error.message)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }

  return NextResponse.json({ clients: stores })
}

// POST /api/superadmin/clients — create new client + store in one step
export async function POST(req: NextRequest) {
  const admin = await verifySuperadmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = createClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { name, email, store_name, store_slug, whatsapp, plan } = parsed.data
  const supabase = createServiceClient()

  // 1. Check slug uniqueness
  const { data: existing } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', store_slug)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Slug já em uso. Escolha outro.' }, { status: 409 })
  }

  // 2. Create auth user (sends invite email automatically)
  const tempPassword = crypto.randomUUID() + crypto.randomUUID() // random, user will reset
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // skip email confirmation — we send invite separately
    user_metadata: { full_name: sanitizeText(name) },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return NextResponse.json({ error: 'E-mail já cadastrado no sistema.' }, { status: 409 })
    }
    console.error('[superadmin/clients POST] auth error', authError.message)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }

  const userId = authData.user.id

  // 3. Upsert profile (trigger should have created it, but ensure)
  await supabase.from('profiles').upsert({
    id: userId,
    full_name: sanitizeText(name),
  })

  // 4. Create store
  const { data: store, error: storeError } = await supabase.from('stores').insert({
    owner_id: userId,
    name: sanitizeText(store_name),
    slug: store_slug,
    whatsapp: sanitizePhone(whatsapp),
    plan,
    active: true,
  }).select().single()

  if (storeError) {
    // Rollback: delete the auth user
    await supabase.auth.admin.deleteUser(userId)
    console.error('[superadmin/clients POST] store error', storeError.message)
    return NextResponse.json({ error: 'Erro ao criar loja' }, { status: 500 })
  }

  // 5. Send password reset so client sets their own password
  await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
    },
  })

  return NextResponse.json({
    success: true,
    client: {
      id: userId,
      name,
      email,
      store_slug,
      store_id: store.id,
      store_url: `${process.env.NEXT_PUBLIC_APP_URL}/loja/${store_slug}`,
      admin_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
    },
  }, { status: 201 })
}
