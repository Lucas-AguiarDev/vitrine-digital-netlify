// Sanitização e proteção contra XSS / SQL Injection

/**
 * Remove tags HTML e normaliza whitespace
 * Usado em qualquer string que venha do usuário antes de salvar
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')           // remove tags HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 10000)                    // limite de tamanho
}

/**
 * Sanitiza para exibição segura no HTML (escaping)
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Valida e normaliza número de WhatsApp
 */
export function sanitizePhone(input: unknown): string {
  if (typeof input !== 'string') return ''
  const digits = input.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return ''
  return digits
}

/**
 * Valida slug de loja (apenas alphanumerico e hífens)
 */
export function sanitizeSlug(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

/**
 * Valida cor hexadecimal
 */
export function sanitizeColor(input: unknown): string {
  if (typeof input !== 'string') return '#C9376E'
  const match = input.match(/^#([0-9A-Fa-f]{6})$/)
  return match ? input.toUpperCase() : '#C9376E'
}

/**
 * Valida preço (número positivo com até 2 casas decimais)
 */
export function sanitizePrice(input: unknown): number {
  const n = Number(input)
  if (isNaN(n) || n < 0 || n > 99999.99) return 0
  return Math.round(n * 100) / 100
}

/**
 * Hash de IP para logs LGPD (não armazena IP real)
 */
export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + (process.env.APP_SECRET || 'salt'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
