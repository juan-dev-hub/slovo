import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateSalesScript } from '@/lib/groq-client'
import { getUser, saveScript } from '@/lib/db'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const ALLOWED_CANALES = [
  'llamada telefónica',
  'videollamada',
  'email',
  'mensaje directo (DM)',
  'cara a cara',
]

const MAX_FIELD_LENGTH = 500

function sanitizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_FIELD_LENGTH) return null
  // Strip null bytes and control characters
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`gen:${userId}`, RATE_LIMITS.generate)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const user = await getUser(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()

    const producto  = sanitizeText(body.producto)
    const nicho     = sanitizeText(body.nicho)
    const problema  = sanitizeText(body.problema)
    const resultado = sanitizeText(body.resultado)
    const precio    = sanitizeText(body.precio)
    const objecion  = sanitizeText(body.objecion)
    const canal     = typeof body.canal === 'string' && ALLOWED_CANALES.includes(body.canal.trim())
      ? body.canal.trim()
      : null

    if (!producto || !nicho || !problema || !resultado || !precio || !canal || !objecion) {
      return NextResponse.json({ error: 'Campos inválidos o faltantes' }, { status: 400 })
    }

    const sections = await generateSalesScript({ producto, nicho, problema, resultado, precio, canal, objecion })

    // Save full script server-side — client never sends content back
    const script = await saveScript({
      usuarioId: userId,
      producto,
      nicho,
      problema,
      resultado,
      precio,
      canal,
      objecion,
      scriptCompleto: sections.full,
      desbloqueado: false,
    })

    return NextResponse.json({
      scriptId: script.id,
      gancho: sections.gancho,
      problema: sections.problema,
      solucion: sections.solucion,
      prueba: sections.prueba,
      oferta: sections.oferta,
      cierre: sections.cierre,
      manejoObjecion: sections.manejoObjecion,
      full: sections.full,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error generando script' }, { status: 500 })
  }
}
