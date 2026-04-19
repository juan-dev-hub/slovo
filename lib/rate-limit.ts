// In-memory rate limiter — adequate for single-instance deployments.
// For multi-instance production, replace with Upstash Redis.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key)
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number
  max: number
}

export function checkRateLimit(identifier: string, config: RateLimitConfig): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const key = identifier
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

export const RATE_LIMITS = {
  generate: { windowMs: 60 * 1000, max: 5 },   // 5 generations per minute per user
  user:     { windowMs: 60 * 1000, max: 30 },   // 30 user reads per minute
  payments: { windowMs: 60 * 1000, max: 10 },   // 10 payment attempts per minute
}
