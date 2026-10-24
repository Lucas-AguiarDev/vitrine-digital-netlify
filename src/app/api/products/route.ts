import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { productSchema } from '@/lib/validation/schemas'
import { sanitizeText, sanitizePrice } from '@/lib/security/sanitize'

// GET /api/products?store_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const store_id = searchParams.get('store_id')

    if (!store_id || !/^[0-9a-f-]{36}$/.test(store_id)) {
      return NextResponse.json({ error: { message: 'store_id inválido' } }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Dono vê todos; público vê apenas ativos (RLS cuida disso)
    const query = supabase
      .from('products')
      .select('*')
      .eq('store_id', store_id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (!user) {
      query.eq('active', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: { message: 'Erro ao buscar produtos' } }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno' } }, { status: 500 })
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: { message: 'Requisição inválida' } }, { status: 400 })

    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Dados inválidos', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    // Verificar que store_id pertence ao usuário
    const store_id = body.store_id
    if (!store_id || !/^[0-9a-f-]{36}$/.test(store_id)) {
      return NextResponse.json({ error: { message: 'store_id inválido' } }, { status: 400 })
    }

    const { data: store } = await supabase
      .from('stores').select('id').eq('id', store_id).eq('owner_id', user.id).single()
    if (!store) return NextResponse.json({ error: { message: 'Loja não encontrada' } }, { status: 404 })

    const { data, error } = await supabase.from('products').insert({
      store_id,
      name: sanitizeText(parsed.data.name),
      description: sanitizeText(parsed.data.description || ''),
      price: sanitizePrice(parsed.data.price),
      category: sanitizeText(parsed.data.category),
      sizes: parsed.data.sizes.map(s => sanitizeText(s)),
      colors: parsed.data.colors.map(c => sanitizeText(c)),
      active: parsed.data.active,
      featured: parsed.data.featured,
      sort_order: parsed.data.sort_order,
    }).select().single()

    if (error) return NextResponse.json({ error: { message: 'Erro ao criar produto' } }, { status: 500 })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno' } }, { status: 500 })
  }
}
