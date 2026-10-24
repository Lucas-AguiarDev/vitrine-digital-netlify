import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sanitizeText } from '@/lib/security/sanitize'
import { checkRateLimit } from '@/lib/security/rate-limit'

const schema = z.object({
  email: z.string().email().max(254),
  reason: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rl = checkRateLimit(`deletion:${ip}`)
    if (!rl.allowed) {
      return NextResponse.json({ error: { message: 'Muitas tentativas.' } }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: { message: 'Inválido' } }, { status: 400 })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'E-mail inválido' } }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verificar se já existe pedido pendente para este email
    const { data: existing } = await supabase
      .from('deletion_requests')
      .select('id')
      .eq('email', parsed.data.email)
      .eq('status', 'pending')
      .single()

    if (existing) {
      // Resposta idêntica para não revelar existência
      return NextResponse.json({ data: { message: 'Solicitação recebida. Retorno em até 15 dias úteis.' } })
    }

    await supabase.from('deletion_requests').insert({
      email: parsed.data.email,
      reason: sanitizeText(parsed.data.reason || ''),
      status: 'pending',
    })

    // Em produção: disparar email de confirmação ao solicitante
    // e notificação interna para equipe MVA

    return NextResponse.json({
      data: { message: 'Solicitação recebida. Retorno em até 15 dias úteis conforme LGPD.' }
    })
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno' } }, { status: 500 })
  }
}
