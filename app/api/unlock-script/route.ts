import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getScriptById, atomicDeductCredit, unlockScript } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const scriptId = typeof body.scriptId === 'string' ? body.scriptId.trim() : null
    if (!scriptId) return NextResponse.json({ error: 'scriptId requerido' }, { status: 400 })

    // Validate UUID format to prevent enumeration attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(scriptId)) {
      return NextResponse.json({ error: 'scriptId inválido' }, { status: 400 })
    }

    // Always verify ownership — userId from Clerk, not from client
    const existing = await getScriptById(scriptId, userId)
    if (!existing) return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 })

    if (existing.desbloqueado) {
      return NextResponse.json({ success: true, alreadyUnlocked: true, script: existing })
    }

    // Atomic check-and-deduct — no race condition
    const deducted = await atomicDeductCredit(userId)
    if (!deducted) {
      return NextResponse.json({ error: 'Sin créditos suficientes', code: 'NO_CREDITS' }, { status: 402 })
    }

    // Content comes from DB — client sends nothing trusted
    const updated = await unlockScript(scriptId, userId)

    return NextResponse.json({ success: true, script: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error al desbloquear' }, { status: 500 })
  }
}
