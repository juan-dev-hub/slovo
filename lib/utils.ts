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
  { credits: 10, price: 15, label: '10 créditos', priceLabel: '$15.00', dodoProductId: 'pdt_0NdYwwcBdl53BrLeb9Kx3' },
  { credits: 25, price: 25, label: '25 créditos', priceLabel: '$25.00', popular: true, dodoProductId: 'pdt_0NdYxCGKisX80sQu8uYD4' },
  { credits: 50, price: 35, label: '50 créditos', priceLabel: '$35.00', dodoProductId: 'pdt_0NdYxLmnKoFGDWHDP5umZ' },
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
