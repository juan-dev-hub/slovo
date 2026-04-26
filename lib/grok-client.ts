import OpenAI from 'openai'

export interface ScriptSections {
  apertura: string
  presentacion: string
  manejoObjeciones: string
  cierre: string
  loopObjeciones: string
  tonality: string
  full: string
}

const HEADER_RE = /^[#*>\s_]*(?:\d+[.):\-]\s*)?[*_]*(APERTURA|PRESENTACI[OÓ]N|MANEJO\s+DE\s+OBJECIONES|CIERRE|LOOP\s+DE\s+OBJECIONES|RECOMENDACI[OÓ]N\s+DE\s+TONALITY|TONALITY)[*_\s]*:?$/i

function keyFromLine(line: string): string | null {
  const m = line.match(HEADER_RE)
  if (!m) return null
  const word = m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (word.startsWith('manejo')) return 'manejoObjeciones'
  if (word.startsWith('loop')) return 'loopObjeciones'
  if (word.startsWith('recomendac') || word === 'tonality') return 'tonality'
  if (word === 'apertura') return 'apertura'
  if (word.startsWith('presentac')) return 'presentacion'
  if (word === 'cierre') return 'cierre'
  return null
}

function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, '').replace(/^[#>*_\-=→]+\s*/, '').trim()
}

function parseScriptSections(text: string): ScriptSections {
  console.log('[Grok raw output]\n', text.slice(0, 500))

  const sections: Record<string, string[]> = {}
  let currentKey = ''

  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    const key = keyFromLine(trimmed)
    if (key) {
      currentKey = key
      if (!sections[key]) sections[key] = []
      continue
    }

    if (currentKey) {
      const cleaned = stripMarkdown(trimmed)
      if (cleaned) sections[currentKey].push(cleaned)
    }
  }

  return {
    apertura:        sections['apertura']?.join('\n') || '',
    presentacion:    sections['presentacion']?.join('\n') || '',
    manejoObjeciones: sections['manejoObjeciones']?.join('\n') || '',
    cierre:          sections['cierre']?.join('\n') || '',
    loopObjeciones:  sections['loopObjeciones']?.join('\n') || '',
    tonality:        sections['tonality']?.join('\n') || '',
    full: text,
  }
}

export async function generateSalesScript(inputs: {
  producto: string
  nicho: string
  problema: string
  puntosDolor: string
  resultado: string
  granMentira: string
  precio: string
  bonusAccion: string
  canal: string
  objeciones: string[]
  prueba: string
  garantia: string
  urgencia: string
  tipoScript: string
  tono: string
  tipoCliente: string
  nivelPresion: number
}): Promise<ScriptSections> {
  const objecionesFormateadas = inputs.objeciones.map((o, i) => `${i + 1}. ${o}`).join('\n')

  const prompt = `Eres un experto en Straight Line Persuasion de Jordan Belfort (el sistema real de Stratton Oakmont). Tu trabajo es generar un script de ventas **auténtico estilo Wolf of Wall Street**, manteniendo siempre el control de la conversación (la línea recta).

El cliente te va a dar los siguientes datos. Usa **todos** sin excepción para crear un script de alto impacto:

**DATOS DEL CLIENTE:**
- Producto o servicio: ${inputs.producto}
- Nicho de mercado: ${inputs.nicho}
- Problema principal que resuelve: ${inputs.problema}
- Puntos de Dolor Extremos: ${inputs.puntosDolor}
- Resultado concreto que obtiene el cliente: ${inputs.resultado}
- La Gran Mentira de la Competencia: ${inputs.granMentira}
- Precio de la oferta: ${inputs.precio}
- Bonus por Acción Inmediata: ${inputs.bonusAccion}
- Prueba social o dato real: ${inputs.prueba || 'No proporcionada'}
- Garantía: ${inputs.garantia || 'No especificada'}
- Urgencia o escasez: ${inputs.urgencia || 'No especificada'}
- Objeciones del cliente:
${objecionesFormateadas}
- Tipo de script: ${inputs.tipoScript}
- Tono del vendedor: ${inputs.tono}
- Tipo de cliente: ${inputs.tipoCliente}
- Nivel de presión de cierre: ${inputs.nivelPresion}/10 (1 = consultivo, 10 = Lobo de Wall Street agresivo)
- Canal de venta: ${inputs.canal}

**Instrucciones estrictas de Straight Line Persuasion:**

1. **Estructura general del script**:
   - Apertura fuerte con rapport + certidumbre.
   - Construir las Three Tens: Tú (vendedor), Producto, Empresa.
   - Presentar el caso lógico → emocional → dolor.
   - Usar tonality correcta según el nivel de presión.
   - Siempre volver a la línea recta después de cada respuesta.
   - Cierre fuerte y directo.

2. **Loop de Objeciones**:
   - Crear un loop potente para cada objeción importante.
   - Estructura del loop:
     - Deflectar la objeción con empatía + certidumbre.
     - Re-presentar el caso (lógico + emocional + dolor).
     - Volver a preguntar por el cierre o siguiente paso.
   - Incluir al menos 2-3 loops por objeción principal.

3. **Entrega final**:
   - Script completo dividido en secciones claras (Apertura, Presentación, Manejo de Objeciones, Cierre).
   - Loop de Objeciones separado y detallado.
   - Recomendación de Tonality específica (certainty, urgency, reasonable man, etc.).
   - Sugerencias de lenguaje corporal o pausas si aplica (para llamada o video).
   - Versión corta/adaptada según el canal.

Genera todo en español neutro latinoamericano, con lenguaje natural pero poderoso. Sé agresivo en el cierre según el nivel de presión solicitado. No uses lenguaje suave si el nivel es 7+.

REGLAS ABSOLUTAS — SIN EXCEPCIONES:
- Certeza absoluta en cada línea. CERO palabras de duda: nunca "podría", "quizás", "tal vez", "puede que".
- El vendedor es el experto más confiable del mercado. Siempre.
- PROHIBIDO validar que un competidor es estafa o fraude. Siempre reencuadra hacia lo que el producto SÍ hace.
- NUNCA empieces una respuesta de objeción diciendo que algo externo es malo o ilegal.

GENERA EL SCRIPT EXACTAMENTE CON ESTOS ENCABEZADOS Y EN ESTE ORDEN:

APERTURA
[Apertura fuerte con rapport + certidumbre. Three Tens: vendedor, producto, empresa. Incluye las preguntas de rapport diagnóstico adaptadas al tipo de script: ${inputs.tipoScript}.]

PRESENTACIÓN
[Presentación en línea recta: caso lógico → emocional → dolor. Usa los Puntos de Dolor Extremos. Expón La Gran Mentira de la Competencia con reencuadre positivo. Presenta el Bonus por Acción Inmediata como parte del cierre lógico.]

MANEJO DE OBJECIONES
[Para cada objeción listada: deflectar con empatía + certidumbre → re-presentar el caso → volver a la línea recta.]

CIERRE
[Cierre duro asumiendo la venta. Instrucciones del siguiente paso como si la decisión ya estuviera tomada. Incluye escasez si existe. Nivel ${inputs.nivelPresion}/10 de presión.]

LOOP DE OBJECIONES
[Loop completo y detallado para cada objeción. Mínimo 2-3 loops por objeción. Incluye el diálogo exacto con el prospecto: cómo deflectar, cómo re-presentar el caso completo y cómo volver a cerrar en cada vuelta.]

RECOMENDACIÓN DE TONALITY
[Recomendación específica de tonality: certainty, urgency, reasonable man, etc. Sugerencias de lenguaje corporal o pausas para ${inputs.canal}. Adaptaciones específicas para el tipo de script: ${inputs.tipoScript}.]`

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
  return parseScriptSections(text)
}
