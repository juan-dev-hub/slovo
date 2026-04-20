import crypto from 'crypto'

export function validateWompiWebhook(payload: string, signature: string, secret: string): boolean {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  const sigBuf = Buffer.from(signature.toLowerCase(), 'hex')
  const computedBuf = Buffer.from(computed, 'hex')

  // Buffers must be same length for timingSafeEqual
  if (sigBuf.length !== computedBuf.length) return false

  return crypto.timingSafeEqual(computedBuf, sigBuf)
}

export const CREDIT_PACKAGES = [
  { credits: 10, price: 10, label: '10 créditos', priceLabel: '$10.00' },
  { credits: 25, price: 20, label: '25 créditos', priceLabel: '$20.00', popular: true },
  { credits: 50, price: 35, label: '50 créditos', priceLabel: '$35.00' },
] as const

export function getCreditPackageByAmount(monto: number) {
  return CREDIT_PACKAGES.find(p => p.price === monto) ?? null
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getReferralUrl(userId: string, baseUrl: string) {
  return `${baseUrl}/r/${userId}`
}
