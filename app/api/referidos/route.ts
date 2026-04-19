import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUser, getReferralStats } from '@/lib/db'
import { getReferralUrl } from '@/lib/utils'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getUser(userId)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const stats = await getReferralStats(userId)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      linkActivo: user.link_referido_activo,
      referralUrl: user.link_referido_activo ? getReferralUrl(userId, appUrl) : null,
      ...stats,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error obteniendo referidos' }, { status: 500 })
  }
}
