import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/admin/password — troca senha do lojista autenticado
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
  }
  const token = auth.slice(7)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: { message: 'Token inválido' } }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.new_password || body.new_password.length < 8) {
    return NextResponse.json({ error: { message: 'Senha deve ter no mínimo 8 caracteres' } }, { status: 400 })
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: body.new_password,
  })

  if (error) {
    return NextResponse.json({ error: { message: 'Erro ao atualizar senha' } }, { status: 500 })
  }

  return NextResponse.json({ data: { updated: true } })
}
