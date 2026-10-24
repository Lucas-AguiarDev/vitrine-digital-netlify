import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadSchema } from '@/lib/validation/schemas'
import { v4 as uuidv4 } from 'uuid'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
    }

    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: { message: 'FormData inválido' } }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const store_id = formData.get('store_id') as string | null
    const type = formData.get('type') as string | null

    // Validar parâmetros
    const parsed = uploadSchema.safeParse({ store_id, type })
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'Parâmetros inválidos' } }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: { message: 'Arquivo obrigatório' } }, { status: 400 })
    }

    // Validar tipo MIME — verificar pelo conteúdo, não só pelo nome
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: { message: 'Tipo inválido. Use JPG, PNG ou WEBP.' } },
        { status: 400 }
      )
    }

    // Verificar tamanho
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: { message: 'Arquivo muito grande. Máximo 5MB.' } },
        { status: 400 }
      )
    }

    // Verificar magic bytes (primeiros bytes do arquivo)
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (!isValidImageMagicBytes(bytes)) {
      return NextResponse.json(
        { error: { message: 'Arquivo corrompido ou inválido.' } },
        { status: 400 }
      )
    }

    // Verificar que a loja pertence ao usuário (RLS, mas verificação explícita)
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id')
      .eq('id', parsed.data.store_id)
      .eq('owner_id', user.id)
      .single()

    if (storeErr || !store) {
      return NextResponse.json({ error: { message: 'Loja não encontrada' } }, { status: 404 })
    }

    // Gerar nome seguro (sem nome original do usuário)
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${uuidv4()}.${ext}`
    const path = `${parsed.data.store_id}/${parsed.data.type}s/${filename}`

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'vitrine-uploads')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: { message: 'Erro ao fazer upload' } }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'vitrine-uploads')
      .getPublicUrl(path)

    return NextResponse.json({ data: { url: urlData.publicUrl, path } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno' } }, { status: 500 })
  }
}

// Verifica magic bytes de imagem (proteção contra extensão falsa)
function isValidImageMagicBytes(bytes: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true
  return false
}
