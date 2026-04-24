import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getPendingNotifications, markNotificationsRead } from '@/lib/db'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await getPendingNotifications(userId)
  if (rows.length > 0) await markNotificationsRead(userId)
  return NextResponse.json({ notifications: rows.map(r => ({ id: r.id, mensaje: r.mensaje })) })
}
