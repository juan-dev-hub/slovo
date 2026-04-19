import { NextRequest, NextResponse } from 'next/server'
import {
  addCredits,
  activateReferralLink,
  savePago,
  pagoYaProcesado,
  getUser,
  isFirstPurchase,
} from '@/lib/db'
import { validateWompiWebhook, getCreditPackageByAmount } from '@/lib/utils'

const ALLOWED_USER_ID_PATTERN = /^user_[a-zA-Z0-9]+$/

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!rawBody) return NextResponse.json({ error: 'Empty body' }, { status: 400 })

    const secret = process.env.WOMPI_API_SECRET
    const signature = req.headers.get('wompi_hash') || req.headers.get('x-wompi-signature') || ''

    // Always validate signature when secret is configured
    if (secret && secret.length > 0) {
      if (!signature) {
        console.warn('[webhook] Request with no signature rejected')
        return NextResponse.json({ error: 'Firma requerida' }, { status: 401 })
      }
      try {
        if (!validateWompiWebhook(rawBody, signature, secret)) {
          console.warn('[webhook] Invalid signature rejected')
          return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
        }
      } catch {
        return NextResponse.json({ error: 'Firma mal formada' }, { status: 401 })
      }
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const transaccion = payload.Transaccion || payload.transaccion || payload.data || payload
    const esAprobada =
      transaccion?.esAprobada === true ||
      transaccion?.EsAprobada === true ||
      transaccion?.estado === 'APROBADA' ||
      transaccion?.Status === 'APPROVED'

    if (!esAprobada) {
      return NextResponse.json({ received: true, processed: false })
    }

    const wompiId =
      transaccion?.IdTransaccion ||
      transaccion?.idTransaccion ||
      transaccion?.id ||
      null

    if (!wompiId || typeof wompiId !== 'string') {
      return NextResponse.json({ error: 'ID de transacción inválido' }, { status: 400 })
    }

    const monto = Number(transaccion?.Monto || transaccion?.monto || transaccion?.amount || 0)
    if (monto <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const metaRaw = transaccion?.MetaData || transaccion?.metadata || transaccion?.Metadata || '{}'
    let meta: { userId?: string; credits?: number } = {}
    try {
      meta = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : metaRaw
    } catch {
      meta = {}
    }

    const userId = meta?.userId || transaccion?.referencia?.split('-')[0]

    // Validate userId format — must match Clerk's user ID format
    if (!userId || typeof userId !== 'string' || !ALLOWED_USER_ID_PATTERN.test(userId)) {
      console.warn('[webhook] Invalid or missing userId:', userId)
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
    }

    // Idempotency check — prevent replay attacks and double processing
    if (await pagoYaProcesado(wompiId)) {
      return NextResponse.json({ received: true, processed: false, reason: 'duplicate' })
    }

    const pkg = getCreditPackageByAmount(monto)
    const creditosComprados = Number(meta?.credits) || pkg?.credits || 0

    // Validate credits are within expected range
    if (!creditosComprados || creditosComprados < 1 || creditosComprados > 1000) {
      return NextResponse.json({ error: 'Créditos inválidos' }, { status: 400 })
    }

    const firstPurchase = await isFirstPurchase(userId)

    await savePago({ usuarioId: userId, wompiIdTransaccion: wompiId, creditosComprados, monto })
    await addCredits(userId, creditosComprados)

    if (firstPurchase) {
      await activateReferralLink(userId)
    }

    const user = await getUser(userId)
    if (user?.referido_por) {
      const bonusCredits = Math.ceil(creditosComprados * 0.2)
      await addCredits(user.referido_por, bonusCredits)
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
