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

    // Wompi El Salvador — crear enlace de pago via API REST
    const wompiResponse = await fetch('https://api.wompi.sv/EnlacePago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${appId}:${apiSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        NombreProducto: `${pkg.credits} Créditos — SLOVO AI`,
        Descripcion: `Paquete de ${pkg.credits} créditos para generar scripts de ventas`,
        Cantidad: 1,
        Monto: pkg.price,
        Referencia: reference,
        UrlRetorno: `${appUrl}/dashboard?payment=success`,
        UrlWebhook: `${appUrl}/api/wompi-webhook`,
        EsMontoEditable: false,
        EsCantidadEditable: false,
        MetaData: JSON.stringify({ userId, credits: pkg.credits }),
      }),
    })

    if (!wompiResponse.ok) {
      const errText = await wompiResponse.text()
      console.error('[Wompi] API error:', wompiResponse.status, errText)
      return NextResponse.json(
        { error: `Wompi rechazó la solicitud (${wompiResponse.status}): ${errText}` },
        { status: 502 }
      )
    }

    const data = await wompiResponse.json()
    console.log('[Wompi] API response:', JSON.stringify(data))

    const checkoutUrl =
      data?.Data?.Url ||
      data?.Data?.url ||
      data?.Data?.UrlCheckout ||
      data?.url ||
      data?.checkout_url ||
      null

    if (!checkoutUrl) {
      console.error('[Wompi] No checkout URL found in response:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Wompi no retornó una URL de pago. Revisa los logs del servidor.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ checkoutUrl, reference })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}
