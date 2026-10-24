import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserAndStore(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const token = auth.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return null
  return { user, storeId: store.id }
}

// GET /api/admin/products
export async function GET(request: NextRequest) {
  const ctx = await getUserAndStore(request)
  if (!ctx) return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', ctx.storeId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: { message: 'Erro ao buscar produtos' } }, { status: 500 })

  return NextResponse.json({ data: products })
}

// POST /api/admin/products
export async function POST(request: NextRequest) {
  const ctx = await getUserAndStore(request)
  if (!ctx) return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || !body.name || body.price == null) {
    return NextResponse.json({ error: { message: 'name e price são obrigatórios' } }, { status: 400 })
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      store_id: ctx.storeId,
      name: body.name,
      description: body.description || null,
      price: Number(body.price),
      category: body.category || 'Geral',
      sizes: body.sizes || [],
      colors: body.colors || [],
      image_url: body.image_url || null,
      active: body.active ?? true,
      featured: body.featured ?? false,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: { message: 'Erro ao criar produto' } }, { status: 500 })

  return NextResponse.json({ data: product }, { status: 201 })
}
