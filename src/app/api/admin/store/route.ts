import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserFromToken(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const token = auth.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/admin/store — retorna loja do lojista autenticado
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
  }

  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (error || !store) {
    return NextResponse.json({ error: { message: 'Loja não encontrada' } }, { status: 404 })
  }

  return NextResponse.json({ data: store })
}

// PATCH /api/admin/store — atualiza dados da loja
export async function PATCH(request: NextRequest) {
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: { message: 'Body inválido' } }, { status: 400 })
  }

  // Campos permitidos para o lojista editar
  const allowed = ['name', 'description', 'whatsapp', 'accent_color', 'banner_message']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data: store, error } = await supabase
    .from('stores')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: { message: 'Erro ao atualizar' } }, { status: 500 })
  }

  return NextResponse.json({ data: store })
}
