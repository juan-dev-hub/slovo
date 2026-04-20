import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKAGES } from '@/lib/utils'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`pay:${userId}`, RATE_LIMITS.payments)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  try {
    const { credits } = await req.json()
    const pkg = CREDIT_PACKAGES.find(p => p.credits === credits)
    if (!pkg) return NextResponse.json({ error: 'Paquete inválido' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const orderId = `${userId}|${pkg.credits}|${Date.now()}`

    const invoiceRes = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      },
      body: JSON.stringify({
        price_amount: pkg.price,
        price_currency: 'usd',
        order_id: orderId,
        order_description: `${pkg.credits} Créditos — SLOVO AI`,
        ipn_callback_url: `${appUrl}/api/nowpayments-webhook`,
        success_url: `${appUrl}/dashboard?payment=success`,
        cancel_url: `${appUrl}/dashboard?payment=cancelled`,
        is_fixed_rate: false,
        is_fee_paid_by_user: false,
      }),
    })

    const invoice = await invoiceRes.json()

    if (!invoiceRes.ok) {
      console.error('[NowPayments] Invoice error:', JSON.stringify(invoice))
      return NextResponse.json({ error: 'Error al crear el pago' }, { status: 502 })
    }

    const checkoutUrl = invoice.invoice_url
    if (!checkoutUrl) {
      console.error('[NowPayments] No invoice_url in response:', JSON.stringify(invoice))
      return NextResponse.json({ error: 'No se recibió URL de pago' }, { status: 502 })
    }

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('[NowPayments]', err)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}
