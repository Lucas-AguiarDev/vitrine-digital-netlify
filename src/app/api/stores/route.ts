import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { storeSchema } from '@/lib/validation/schemas'
import { sanitizeText, sanitizeSlug, sanitizeColor, sanitizePhone } from '@/lib/security/sanitize'

// GET /api/stores — loja do usuário logado
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
    }

    // RLS garante que só retorna a loja do dono — sem filtro manual necessário
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: { message: 'Erro ao buscar loja' } }, { status: 500 })
    }

    return NextResponse.json({ data: data || null })
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno' } }, { status: 500 })
  }
}

// POST /api/stores — criar loja
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: { message: 'Requisição inválida' } }, { status: 400 })
    }

    // Validar schema
    const parsed = storeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Dados inválidos', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    // Sanitizar todos os campos antes de salvar
    const slug = sanitizeSlug(parsed.data.slug)
    const name = sanitizeText(parsed.data.name)
    const whatsapp = sanitizePhone(parsed.data.whatsapp)
    const accent_color = sanitizeColor(parsed.data.accent_color)

    if (!whatsapp) {
      return NextResponse.json({ error: { message: 'WhatsApp inválido' } }, { status: 400 })
    }

    // Verificar se slug já existe (service client para contornar RLS)
    const service = createServiceClient()
    const { data: existing } = await service.from('stores').select('id').eq('slug', slug).single()
    if (existing) {
      return NextResponse.json({ error: { message: 'Endereço já em uso' } }, { status: 409 })
    }

    const { data, error } = await supabase.from('stores').insert({
      slug,
      name,
      description: sanitizeText(parsed.data.description || ''),
      whatsapp,
      accent_color,
      banner_message: sanitizeText(parsed.data.banner_message || ''),
      owner_id: user.id,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: { message: 'Erro ao criar loja' } }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno' } }, { status: 500 })
  }
}

// PUT /api/stores — atualizar loja
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: { message: 'Requisição inválida' } }, { status: 400 })
    }

    const parsed = storeSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Dados inválidos' } },
        { status: 400 }
      )
    }

    // Sanitizar campos presentes
    const update: Record<string, unknown> = {}
    if (parsed.data.name) update.name = sanitizeText(parsed.data.name)
    if (parsed.data.description !== undefined) update.description = sanitizeText(parsed.data.description || '')
    if (parsed.data.whatsapp) {
      const phone = sanitizePhone(parsed.data.whatsapp)
      if (!phone) return NextResponse.json({ error: { message: 'WhatsApp inválido' } }, { status: 400 })
      update.whatsapp = phone
    }
    if (parsed.data.accent_color) update.accent_color = sanitizeColor(parsed.data.accent_color)
    if (parsed.data.banner_message !== undefined) update.banner_message = sanitizeText(parsed.data.banner_message || '')

    // RLS garante que só atualiza a loja do dono
    const { data, error } = await supabase
      .from('stores')
      .update(update)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: { message: 'Erro ao atualizar loja' } }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno' } }, { status: 500 })
  }
}
