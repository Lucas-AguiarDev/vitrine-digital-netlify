// Rate limiting em memória (para produção use Upstash Redis)
// Limita tentativas de login para prevenir brute force

interface RateLimitEntry {
  count: number
  resetAt: number
  blocked: boolean
}

const store = new Map<string, RateLimitEntry>()

const MAX_ATTEMPTS = Number(process.env.RATE_LIMIT_LOGIN_MAX) || 5
const WINDOW_MS = Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000 // 15 min
const BLOCK_MS = 30 * 60 * 1000 // 30 min após exceder

export function checkRateLimit(key: string): {
  allowed: boolean
  remaining: number
  retryAfter?: number
} {
  const now = Date.now()
  const entry = store.get(key)

  // Sem entrada ou janela expirada — resetar
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS, blocked: false })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  // Bloqueado temporariamente
  if (entry.blocked) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  // Incrementar contador
  entry.count++
  store.set(key, entry)

  if (entry.count > MAX_ATTEMPTS) {
    entry.blocked = true
    entry.resetAt = now + BLOCK_MS
    store.set(key, entry)
    return { allowed: false, remaining: 0, retryAfter: BLOCK_MS / 1000 }
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count }
}

export function resetRateLimit(key: string) {
  store.delete(key)
}

// Limpar entradas expiradas periodicamente
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (now > entry.resetAt && !entry.blocked) store.delete(key)
    })
  }, 5 * 60 * 1000)
}
