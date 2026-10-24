import { z } from 'zod'

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').max(254),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
})

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido').max(254),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Precisa ter uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa ter um número'),
  fullName: z.string().min(2, 'Nome muito curto').max(100),
})

// ─── Loja ──────────────────────────────────────────────────────────────────────
export const storeSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  description: z.string().max(300).optional(),
  whatsapp: z
    .string()
    .regex(/^\d{10,15}$/, 'WhatsApp inválido — apenas números com DDD e DDI'),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')
    .default('#C9376E'),
  banner_message: z.string().max(200).optional(),
})

// ─── Produto ───────────────────────────────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Preço deve ser positivo').max(99999.99),
  category: z.string().min(1, 'Categoria obrigatória').max(100),
  sizes: z.array(z.string().max(20)).max(20).default([]),
  colors: z.array(z.string().max(50)).max(20).default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
})

// ─── Pedido ────────────────────────────────────────────────────────────────────
export const orderSchema = z.object({
  store_id: z.string().uuid(),
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().regex(/^\d{10,15}$/, 'Telefone inválido'),
  customer_address: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        qty: z.number().int().positive().max(99),
        size: z.string().max(20).optional(),
        color: z.string().max(50).optional(),
      })
    )
    .min(1, 'Pedido vazio')
    .max(50),
})

// ─── LGPD / Consentimento ──────────────────────────────────────────────────────
export const consentSchema = z.object({
  store_id: z.string().uuid().optional(),
  consent_type: z.enum(['cookies_analytics', 'cookies_marketing', 'data_processing']),
  granted: z.boolean(),
})

// ─── Upload ────────────────────────────────────────────────────────────────────
export const uploadSchema = z.object({
  store_id: z.string().uuid(),
  type: z.enum(['product', 'banner', 'logo']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type StoreInput = z.infer<typeof storeSchema>
export type ProductInput = z.infer<typeof productSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type ConsentInput = z.infer<typeof consentSchema>
export type UploadInput = z.infer<typeof uploadSchema>
