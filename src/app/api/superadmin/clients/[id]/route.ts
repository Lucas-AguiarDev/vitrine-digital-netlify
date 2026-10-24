import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

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

const updateSchema = z.object({
  active: z.boolean().optional(),
  plan: z.enum(['starter', 'pro', 'premium']).optional(),
})

// PATCH /api/superadmin/clients/[id] — toggle active, change plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifySuperadmin(req)
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('stores')
    .update(parsed.data)
    .eq('owner_id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }

  return NextResponse.json({ success: true, store: data })
}

// DELETE /api/superadmin/clients/[id] — delete user + store (IRREVERSIBLE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifySuperadmin(req)
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  // Require explicit confirmation header
  const confirm = req.headers.get('X-Confirm-Delete')
  if (confirm !== 'yes') {
    return NextResponse.json({ error: 'Envie X-Confirm-Delete: yes para confirmar' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // RLS + cascade will remove store + products + orders via FK
  const { error: deleteError } = await supabase.auth.admin.deleteUser(params.id)
  if (deleteError) {
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
