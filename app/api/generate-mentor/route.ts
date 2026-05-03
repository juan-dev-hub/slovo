import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export interface MentorSections {
  apertura: string
  punto1: string
  punto2: string
  punto3: string
  cierre: string
  full: string
}

function parseMentorSections(text: string): MentorSections {
  const sections: Record<string, string[]> = {}
  let currentKey = ''

  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    const clean = trimmed.replace(/^[#*>\s_-]+/, '').replace(/[*_]+$/, '').trim()
    if (/^APERTURA\s+DE\s+IMPACTO/i.test(clean)) { currentKey = 'apertura'; continue }
    if (/^PUNTO\s+1\b/i.test(clean))               { currentKey = 'punto1';   continue }
    if (/^PUNTO\s+2\b/i.test(clean))               { currentKey = 'punto2';   continue }
    if (/^PUNTO\s+3\b/i.test(clean))               { currentKey = 'punto3';   continue }
    if (/^CIERRE\s+DE\s+ALTA/i.test(clean))        { currentKey = 'cierre';   continue }

    if (currentKey) {
      const line = trimmed.replace(/\*\*/g, '').replace(/^[#>*_\-=→]+\s*/, '').trim()
      if (line) {
        if (!sections[currentKey]) sections[currentKey] = []
        sections[currentKey].push(line)
      }
    }
  }

  return {
    apertura: sections['apertura']?.join('\n') || '',
    punto1:   sections['punto1']?.join('\n')   || '',
    punto2:   sections['punto2']?.join('\n')   || '',
    punto3:   sections['punto3']?.join('\n')   || '',
    cierre:   sections['cierre']?.join('\n')   || '',
    full: text,
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { tema, nivelAudiencia, objetivo } = body

  if (!tema?.trim() || !nivelAudiencia?.trim() || !objetivo?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }
  if (tema.length > 300 || objetivo.length > 300) {
    return NextResponse.json({ error: 'Los campos no pueden superar 300 caracteres' }, { status: 400 })
  }

  const prompt = `Actúa como un estratega de subculturas y maestro de oratoria. Tu objetivo es redactar una clase magistral de liderazgo inspirada en el sistema celular de la Iglesia Elim, estructurada estrictamente en 3 puntos clave.

DATOS DE LA CLASE:
- Tema: ${tema}
- Nivel de Audiencia: ${nivelAudiencia}
- Objetivo: ${objetivo}

**Personalidad y Estilo:**
- Tonalidad: Liderazgo de John Maxwell pero adaptado al lenguaje del pueblo, usando palabras sencillas pero poderosas que generen autoridad moral.
- Carisma (Olivia Fox): Proyecta Presencia, Poder y Calidez en cada párrafo.
- Cultura: Integra conceptos cristianos y analogías bíblicas de servicio y multiplicación de talentos para fortalecer la identidad del grupo.

**Formato de Salida — Guion completo (NO improvises nada, escribe cada palabra):**
- Genera el guion palabra por palabra para que el usuario lo lea exactamente sin improvisar.
- Inserta instrucciones de actuación entre corchetes [ ] después de cada momento clave. Ejemplo: [Pausa de 3 segundos con mirada fija al salón], [Baja el tono de voz a un susurro serio], [Sonríe con calidez y extiende las manos hacia el grupo], [Camina lentamente hacia el centro del escenario].
- Los gestos deben reforzar la emoción del texto en ese momento exacto.

GENERA LA CLASE MAGISTRAL EXACTAMENTE CON ESTOS ENCABEZADOS Y EN ESTE ORDEN:

APERTURA DE IMPACTO
[Gancho emocional poderoso. Establece autoridad moral inmediata. Conecta con la realidad de la audiencia nivel ${nivelAudiencia}. Incluye instrucciones de actuación.]

PUNTO 1
[Primer punto clave. Incluye analogía bíblica de servicio o multiplicación. Desarrolla el argumento completo con instrucciones de actuación integradas en el guion.]

PUNTO 2
[Segundo punto clave. Profundiza el tema. Mantén el ritmo emocional ascendente. Incluye instrucciones de actuación.]

PUNTO 3
[Tercer punto clave. El punto de mayor impacto emocional. Prepara el terreno para el cierre. Incluye instrucciones de actuación.]

CIERRE DE ALTA INFLUENCIA
[Llamado a la acción directo y agresivo para el objetivo: ${objetivo}. Cierre memorable con instrucciones de actuación que movilicen a la audiencia a tomar acción inmediata.]`

  const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  })

  const response = await client.chat.completions.create({
    model: 'grok-4-1-fast-non-reasoning',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 6000,
  })

  const text = response.choices[0]?.message?.content ?? ''
  const sections = parseMentorSections(text)

  return NextResponse.json(sections)
}
