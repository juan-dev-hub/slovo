import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCredits } from '@/lib/db'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const credits = await getCredits(userId)
  return NextResponse.json({ credits })
}
