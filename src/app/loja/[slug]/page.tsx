import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import LojaClient from './LojaClient'

// Sempre busca dados frescos — nunca usa cache estático
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createServiceClient()
  const { data: store } = await supabase
    .from('stores')
    .select('name, description')
    .eq('slug', params.slug)
    .eq('active', true)
    .single()

  if (!store) return { title: 'Loja não encontrada' }

  return {
    title: store.name,
    description: store.description ?? `Bem-vindo à loja ${store.name}`,
  }
}

export default async function LojaPage({ params }: Props) {
  const supabase = createServiceClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug, description, whatsapp, accent_color, banner_message, banner_image_url, logo_url, plan')
    .eq('slug', params.slug)
    .eq('active', true)
    .single()

  if (!store) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, category, sizes, colors, image_url, featured, sort_order')
    .eq('store_id', store.id)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })

  return <LojaClient store={store} products={products ?? []} />
}
