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

    const appId = process.env.WOMPI_APP_ID!
    const apiSecret = process.env.WOMPI_API_SECRET!
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const reference = `${userId}-${credits}-${Date.now()}`

    const wompiResponse = await fetch('https://api.wompi.sv/Transaccion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Buffer.from(`${appId}:${apiSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        NombreProducto: `${credits} Créditos - SLOVO AI`,
        Cantidad: 1,
        Monto: pkg.price,
        Referencia: reference,
        UrlRetorno: `${appUrl}/dashboard?payment=success&ref=${reference}`,
        UrlWebhook: `${appUrl}/api/wompi-webhook`,
        MetaData: JSON.stringify({ userId, credits: pkg.credits }),
      }),
    })

    if (!wompiResponse.ok) {
      const err = await wompiResponse.text()
      console.error('Wompi error:', err)
      return NextResponse.json({ error: 'Error creando pago en Wompi' }, { status: 500 })
    }

    const data = await wompiResponse.json()
    return NextResponse.json({
      checkoutUrl: data.Data?.Url || data.url || data.checkout_url,
      reference,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}
