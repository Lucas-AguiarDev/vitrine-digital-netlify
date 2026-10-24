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
  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) return null
  return { user, storeId: store.id }
}

// PATCH /api/admin/products/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getUserAndStore(request)
  if (!ctx) return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: { message: 'Body inválido' } }, { status: 400 })

  const allowed = ['name', 'description', 'price', 'category', 'sizes', 'colors', 'image_url', 'active', 'featured', 'sort_order']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data: product, error } = await supabase
    .from('products')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('store_id', ctx.storeId) // garante que só edita produto da sua loja
    .select()
    .single()

  if (error) return NextResponse.json({ error: { message: 'Erro ao atualizar' } }, { status: 500 })

  return NextResponse.json({ data: product })
}

// DELETE /api/admin/products/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getUserAndStore(request)
  if (!ctx) return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', params.id)
    .eq('store_id', ctx.storeId)

  if (error) return NextResponse.json({ error: { message: 'Erro ao deletar' } }, { status: 500 })

  return NextResponse.json({ data: { deleted: true } })
}
