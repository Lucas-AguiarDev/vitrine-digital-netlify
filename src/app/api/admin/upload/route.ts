import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function isValidImage(bytes: Uint8Array): boolean {
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true
  return false
}

export async function POST(request: NextRequest) {
  // Auth via Bearer token
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: { message: 'Não autorizado' } }, { status: 401 })
  }
  const token = auth.slice(7)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: { message: 'Token inválido' } }, { status: 401 })
  }

  // Busca store do usuário
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) {
    return NextResponse.json({ error: { message: 'Loja não encontrada' } }, { status: 404 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: { message: 'FormData inválido' } }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: { message: 'Arquivo obrigatório' } }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: { message: 'Use JPG, PNG ou WEBP.' } }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: { message: 'Máximo 5MB.' } }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (!isValidImage(bytes)) {
    return NextResponse.json({ error: { message: 'Arquivo inválido.' } }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const filename = `${uuidv4()}.${ext}`
  const path = `${store.id}/products/${filename}`
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'vitrine-uploads'

  // Garante que o bucket existe e é público
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === bucket)
  if (!bucketExists) {
    const { error: bucketErr } = await supabase.storage.createBucket(bucket, { public: true })
    if (bucketErr) {
      console.error('[admin/upload] criar bucket', bucketErr.message)
      return NextResponse.json({ error: { message: 'Erro ao configurar storage' } }, { status: 500 })
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[admin/upload]', uploadError.message)
    return NextResponse.json({ error: { message: `Erro ao fazer upload: ${uploadError.message}` } }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

  return NextResponse.json({ data: { url: urlData.publicUrl, path } }, { status: 201 })
}
