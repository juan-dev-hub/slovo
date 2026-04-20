import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { addCredits, savePago, pagoYaProcesado, isFirstPurchase, activateReferralLink, getUser } from '@/lib/db'

const COMPLETED_STATUSES = new Set(['confirmed', 'finished'])
const USER_ID_PATTERN = /^user_[a-zA-Z0-9]+$/

function verifySignature(payload: object, signature: string, secret: string): boolean {
  const sorted = Object.keys(payload).sort().reduce((acc: Record<string, unknown>, key) => {
    acc[key] = (payload as Record<string, unknown>)[key]
    return acc
  }, {})
  const computed = crypto.createHmac('sha512', secret).update(JSON.stringify(sorted)).digest('hex')
  return computed === signature.toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!rawBody) return NextResponse.json({ error: 'Empty body' }, { status: 400 })

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const secret = process.env.NOWPAYMENTS_IPN_SECRET
    const signature = req.headers.get('x-nowpayments-sig') || ''

    if (secret) {
      if (!signature || !verifySignature(payload, signature, secret)) {
        console.warn('[NowPayments] Invalid or missing signature')
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
      }
    }

    const status = String(payload.payment_status || '')
    if (!COMPLETED_STATUSES.has(status)) {
      return NextResponse.json({ received: true, processed: false, reason: status })
    }

    const paymentId = String(payload.payment_id || '')
    if (!paymentId) return NextResponse.json({ error: 'payment_id requerido' }, { status: 400 })

    // order_id format: "userId|credits|timestamp"
    const orderId = String(payload.order_id || '')
    const [userId, creditsStr] = orderId.split('|')
    const credits = Number(creditsStr)
    const amount = Number(payload.price_amount || 0)

    if (!userId || !USER_ID_PATTERN.test(userId)) {
      console.warn('[NowPayments] Invalid userId:', userId)
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
    }

    if (!credits || credits < 1 || credits > 1000) {
      return NextResponse.json({ error: 'Créditos inválidos' }, { status: 400 })
    }

    if (await pagoYaProcesado(paymentId)) {
      return NextResponse.json({ received: true, processed: false, reason: 'duplicate' })
    }

    const firstPurchase = await isFirstPurchase(userId)

    await savePago({ usuarioId: userId, wompiIdTransaccion: paymentId, creditosComprados: credits, monto: amount })
    await addCredits(userId, credits)

    if (firstPurchase) await activateReferralLink(userId)

    const user = await getUser(userId)
    if (user?.referido_por) {
      await addCredits(user.referido_por, Math.ceil(credits * 0.2))
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (err) {
    console.error('[NowPayments] Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
