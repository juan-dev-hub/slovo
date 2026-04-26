import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { addCredits, savePago, pagoYaProcesado, isFirstPurchase, activateReferralLink, getUser, pushNotification } from '@/lib/db'

const USER_ID_PATTERN = /^user_[a-zA-Z0-9]+$/

// Dodo signature format: "t=TIMESTAMP,v1=HEX_SIGNATURE"
function verifyDodoSignature(rawBody: string, header: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(header.split(',').map(p => p.split('=')))
    const timestamp = parts['t']
    const signature = parts['v1']
    if (!timestamp || !signature) return false

    const computed = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    const sigBuf = Buffer.from(signature.toLowerCase(), 'hex')
    const computedBuf = Buffer.from(computed, 'hex')
    if (sigBuf.length !== computedBuf.length) return false
    return crypto.timingSafeEqual(computedBuf, sigBuf)
  } catch {
    return false
  }
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

    const secret = process.env.DODO_WEBHOOK_SECRET
    const sigHeader = req.headers.get('webhook-signature') || ''

    if (secret) {
      if (!sigHeader || !verifyDodoSignature(rawBody, sigHeader, secret)) {
        console.warn('[Dodo] Invalid or missing signature')
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
      }
    }

    // Only process payment.succeeded events
    const eventType = String(payload.type || '')
    if (eventType !== 'payment.succeeded') {
      return NextResponse.json({ received: true, processed: false, reason: eventType })
    }

    const data = (payload.data ?? payload) as Record<string, unknown>
    const paymentId = String(data.payment_id || '')
    if (!paymentId) return NextResponse.json({ error: 'payment_id requerido' }, { status: 400 })

    const metadata = (data.metadata ?? {}) as Record<string, string>
    const userId = String(metadata.userId || '')
    const credits = Number(metadata.credits || 0)
    const amount = Number(data.total_amount || data.amount || 0) / 100

    if (!userId || !USER_ID_PATTERN.test(userId)) {
      console.warn('[Dodo] Invalid userId:', userId)
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
      const bonus = Math.ceil(credits * 0.2)
      await addCredits(user.referido_por, bonus)
      await pushNotification(
        user.referido_por,
        `🎉 Un referido tuyo acaba de comprar un paquete de ${credits} créditos. ¡Recibiste ${bonus} créditos de bono (20%)!`
      )
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (err) {
    console.error('[Dodo] Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
