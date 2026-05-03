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
  modoHook: boolean
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
    modoHook: false,
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

  const isModoHook = (tema.trim().length + objetivo.trim().length) < 80

  const filosofia = `FILOSOFÍA CENTRAL — "TÚ PUEDES HACERLO":
• Eres un mentor que ya recorrió el camino y extiende la mano. NO eres un orador en un pedestal. Tu identidad: "yo te acompaño a lograrlo tú mismo".
• El tono es "Esto es lo que tú vas a hacer" — NUNCA "Yo sé" ni ninguna variante de superioridad.
• Usa palabras sencillas y directas siempre. Si explicas algo técnico (ej. USDC o Stablecoins), no digas "instrumento financiero", di "dinero que no pierde valor y que tú controlas desde tu celular".
• Meta única de la clase: que el oyente diga "yo también quiero eso ahora mismo" — JAMÁS "qué increíble es él".
• Elimina todo rastro de superioridad jerárquica. Habla siempre de tú a tú, como si acompañaras al oyente paso a paso.
• Inspiración Activa: cada párrafo activa el deseo de actuar, no el deseo de admirar al orador.
• Cultura: integra analogías bíblicas de servicio y multiplicación de talentos para fortalecer la identidad del grupo.
• Tonalidad: John Maxwell adaptado al lenguaje del pueblo — autoridad moral sin pedestal.`

  const instruccionesActuacion = `INSTRUCCIONES DE ACTUACIÓN — TRES TIPOS OBLIGATORIOS (Olivia Fox):
Distribuye los tres tipos a lo largo de todo el guion donde refuercen la emoción del texto:
1. Calidez → [Sonríe y asiente mientras hablas, como validando que ellos están entendiendo]
2. Presencia → [Bájate del nivel del escenario o acércate a la persona para hablar de tú a tú]
3. Poder Compartido → [Pon el celular o la herramienta en manos de alguien más mientras explicas el paso]
Los corchetes son parte del guion escrito — van exactamente donde el usuario debe ejecutar ese gesto.`

  const reglaSalida = `REGLA ABSOLUTA DE SALIDA:
Genera el guion PALABRA POR PALABRA. Sin espacios para improvisar. Cada pausa, gesto y palabra diseñada para que el usuario, sin importar su perfil, proyecte la seguridad de un experto que enseña a otros a ser expertos. Si describes un proceso técnico, incluye los pasos exactos y numerados para que el oyente pueda seguirlos en tiempo real.`

  const bloqueHook = `MODO: HOOK DE EMPODERAMIENTO (entrada breve — contexto informal entre amigos o presentación rápida)

Genera exactamente con estos encabezados en este orden:

APERTURA DE IMPACTO
Lanza el beneficio principal del tema "${tema}" en una sola frase poderosa y simple que golpee el problema real del oyente. Conecta de inmediato. Instrucción de Presencia obligatoria aquí.

PUNTO 1
Demostración Rápida de 30 segundos: explica el paso más tangible y accionable del tema. Usa lenguaje cotidiano. Instrucción de Poder Compartido aquí — pon la herramienta o el celular en manos de alguien del grupo mientras explicas.

PUNTO 2
Valida la comprensión con calidez: termina este punto con "¿Ves qué fácil es? Inténtalo tú ahora." Refuerza con una analogía bíblica breve de multiplicación. Instrucción de Calidez aquí.

PUNTO 3
Siembra la curiosidad: "Y esto es solo el primer nivel. Hay mucho más que tú puedes hacer con esto." Breve, poderoso, sin detalles técnicos — solo abre el apetito.

CIERRE DE ALTA INFLUENCIA
Cierre Hook exacto: "Esto te va a cambiar ${objetivo}. Si quieres, nos sentamos y te enseño a hacerlo tú mismo." Instrucción de Presencia — acércate físicamente al oyente o míralo directamente.`

  const bloqueCompleto = `MODO: CLASE MAGISTRAL COMPLETA

Genera exactamente con estos encabezados en este orden:

APERTURA DE IMPACTO
Identifica un problema común y real para la audiencia nivel "${nivelAudiencia}" relacionado con "${tema}". Preséntalo como algo que el oyente puede dominar HOY MISMO — no en el futuro. Abre con una pregunta o afirmación que genere identificación inmediata ("¿Cuántos de ustedes han sentido que...?"). Incluye los tres tipos de instrucciones de actuación.

PUNTO 1
Primer punto: explica con pasos concretos y numerados. Usa lenguaje cotidiano sin tecnicismos innecesarios. Incluye analogía bíblica de servicio o multiplicación de talentos. Distribuye instrucciones de actuación. TERMINA OBLIGATORIAMENTE con: "¿Ves qué fácil es? Inténtalo tú." seguido de un paso de acción que puedan ejecutar en ese momento.

PUNTO 2
Segundo punto: profundiza el tema manteniendo el ritmo emocional ascendente. Mantén el foco en lo que el oyente puede hacer, no en lo que tú sabes. Incluye los tres tipos de instrucciones de actuación. TERMINA OBLIGATORIAMENTE con una validación y una invitación a practicar en el acto.

PUNTO 3
Tercer punto: el de mayor impacto. Integra Poder Compartido — pon algo concreto en manos de la audiencia. Lleva la energía al máximo. TERMINA OBLIGATORIAMENTE con: "¿Ves qué fácil es? Tú también puedes hacer esto hoy."

CIERRE DE ALTA INFLUENCIA
Llamado a la acción directo para el objetivo: "${objetivo}". Todo apunta a lo que ELLOS van a hacer — no a lo que tú hiciste. Sin frases de admiración al orador. Moviliza a actuar AHORA. Incluye instrucción de Presencia como cierre final.`

  const prompt = `${filosofia}

${instruccionesActuacion}

DATOS DE LA CLASE:
- Tema: ${tema}
- Nivel de Audiencia: ${nivelAudiencia}
- Objetivo: ${objetivo}

${isModoHook ? bloqueHook : bloqueCompleto}

${reglaSalida}`

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

  return NextResponse.json({ ...sections, modoHook: isModoHook })
}
