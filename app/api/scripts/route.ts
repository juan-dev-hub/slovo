import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserScripts } from '@/lib/db'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const scripts = await getUserScripts(userId)
    return NextResponse.json(scripts)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error obteniendo scripts' }, { status: 500 })
  }
}
