import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation/schemas'
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rl = checkRateLimit(`login:${ip}`)

    if (!rl.allowed) {
      return NextResponse.json(
        { error: { message: 'Muitas tentativas. Tente novamente mais tarde.' } },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter || 900),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // Validar body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: { message: 'Requisição inválida' } },
        { status: 400 }
      )
    }

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Dados inválidos', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Mensagem genérica — não revelar se email existe ou não
      return NextResponse.json(
        { error: { message: 'Credenciais inválidas' } },
        { status: 401 }
      )
    }

    // Login bem-sucedido — resetar rate limit
    resetRateLimit(`login:${ip}`)

    return NextResponse.json({ data: { user: data.user?.id } })
  } catch {
    // NUNCA retornar stack trace em produção
    return NextResponse.json(
      { error: { message: 'Erro interno' } },
      { status: 500 }
    )
  }
}
