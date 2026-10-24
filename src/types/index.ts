// ─── Tenant / Loja ────────────────────────────────────────────────────────────
export interface Store {
  id: string
  slug: string
  name: string
  description: string | null
  whatsapp: string
  accent_color: string
  banner_message: string | null
  banner_image_url: string | null
  logo_url: string | null
  owner_id: string
  active: boolean
  plan: 'trial' | 'basic' | 'pro'
  created_at: string
  updated_at: string
}

// ─── Produto ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  store_id: string
  name: string
  description: string | null
  price: number
  category: string
  sizes: string[]
  colors: string[]
  image_url: string | null
  active: boolean
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ─── Usuário/Owner ────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'owner' | 'admin' | 'superadmin'
  created_at: string
}

// ─── Pedido (log) ─────────────────────────────────────────────────────────────
export interface Order {
  id: string
  store_id: string
  customer_name: string
  customer_phone: string
  customer_address: string | null
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  price: number
  qty: number
  size: string | null
  color: string | null
}

// ─── LGPD ─────────────────────────────────────────────────────────────────────
export interface ConsentLog {
  id: string
  store_id: string | null
  user_id: string | null
  ip_hash: string
  consent_type: 'cookies_analytics' | 'cookies_marketing' | 'data_processing'
  granted: boolean
  created_at: string
}

// ─── API responses ────────────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: { message: string; code?: string }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
