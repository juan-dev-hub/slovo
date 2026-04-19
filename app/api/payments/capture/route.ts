import { NextRequest, NextResponse } from 'next/server'
import { addCredits, savePago, pagoYaProcesado, isFirstPurchase, activateReferralLink, getUser } from '@/lib/db'

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

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') // PayPal order ID

  if (!token) {
    return NextResponse.redirect(`${appUrl}/dashboard?payment=error`)
  }

  try {
    const accessToken = await getAccessToken()

    const captureRes = await fetch(`${paypalBase()}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    const capture = await captureRes.json()

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('[PayPal] Capture error:', JSON.stringify(capture))
      return NextResponse.redirect(`${appUrl}/dashboard?payment=error`)
    }

    const captureUnit = capture.purchase_units?.[0]
    const captureId = captureUnit?.payments?.captures?.[0]?.id
    const amount = Number(captureUnit?.payments?.captures?.[0]?.amount?.value || 0)
    const customId = captureUnit?.custom_id // "userId|credits"

    if (!captureId || !customId) {
      console.error('[PayPal] Missing captureId or customId')
      return NextResponse.redirect(`${appUrl}/dashboard?payment=error`)
    }

    const [userId, creditsStr] = customId.split('|')
    const credits = Number(creditsStr)

    if (!userId || !credits || credits < 1) {
      console.error('[PayPal] Invalid customId:', customId)
      return NextResponse.redirect(`${appUrl}/dashboard?payment=error`)
    }

    if (await pagoYaProcesado(captureId)) {
      return NextResponse.redirect(`${appUrl}/dashboard?payment=success`)
    }

    const firstPurchase = await isFirstPurchase(userId)

    await savePago({ usuarioId: userId, wompiIdTransaccion: captureId, creditosComprados: credits, monto: amount })
    await addCredits(userId, credits)

    if (firstPurchase) {
      await activateReferralLink(userId)
    }

    const user = await getUser(userId)
    if (user?.referido_por) {
      const bonusCredits = Math.ceil(credits * 0.2)
      await addCredits(user.referido_por, bonusCredits)
    }

    return NextResponse.redirect(`${appUrl}/dashboard?payment=success`)
  } catch (err) {
    console.error('[PayPal] Capture exception:', err)
    return NextResponse.redirect(`${appUrl}/dashboard?payment=error`)
  }
}
