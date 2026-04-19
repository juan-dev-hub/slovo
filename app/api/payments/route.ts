import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKAGES } from '@/lib/utils'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

function paypalBase() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getAccessToken() {
  const base = paypalBase()
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PayPal auth error: ${JSON.stringify(data)}`)
  return data.access_token as string
}

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
    const accessToken = await getAccessToken()

    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: pkg.price.toFixed(2) },
          description: `${pkg.credits} Créditos — SLOVO AI`,
          custom_id: `${userId}|${pkg.credits}`,
        }],
        application_context: {
          brand_name: 'SLOVO AI',
          user_action: 'PAY_NOW',
          return_url: `${appUrl}/api/payments/capture`,
          cancel_url: `${appUrl}/dashboard?payment=cancelled`,
        },
      }),
    })

    const order = await orderRes.json()
    if (!orderRes.ok) {
      console.error('[PayPal] Create order error:', JSON.stringify(order))
      return NextResponse.json({ error: 'Error al crear el pago con PayPal' }, { status: 502 })
    }

    const approveUrl = order.links?.find((l: any) => l.rel === 'approve')?.href
    if (!approveUrl) {
      return NextResponse.json({ error: 'PayPal no retornó URL de aprobación' }, { status: 502 })
    }

    return NextResponse.json({ checkoutUrl: approveUrl })
  } catch (err) {
    console.error('[PayPal]', err)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}
