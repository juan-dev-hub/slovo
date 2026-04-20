import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface ScriptSections {
  gancho: string
  problema: string
  solucion: string
  prueba: string
  oferta: string
  cierre: string
  manejoObjecion: string
  full: string
}

// Maps section number to its key
const SECTION_HEADER_RE = /^[#>*_\s]*(\d+)\s*[.):\-]\s*[*_]*(GANCHO|PROBLEMA|SOLUCIÓN|SOLUCION|PRUEBA|OFERTA|CIERRE|MANEJO\s+DE\s+OBJECIÓN|MANEJO\s+DE\s+OBJECION)[*_\s]*:?\s*$/i

const NUMBER_TO_KEY: Record<string, string> = {
  '1': 'gancho',
  '2': 'problema',
  '3': 'solucion',
  '4': 'prueba',
  '5': 'oferta',
  '6': 'cierre',
  '7': 'manejoObjecion',
}

function cleanLine(line: string): string {
  return line.replace(/^[#>]+\s*/, '').replace(/\*\*/g, '').replace(/^\*/, '').replace(/\*$/, '').trim()
}

function parseScriptSections(text: string): ScriptSections {
  const lines = text.split('\n')
  const sections: Record<string, string[]> = {}
  let currentKey = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const match = trimmed.match(SECTION_HEADER_RE)
    if (match) {
      const key = NUMBER_TO_KEY[match[1]]
      if (key) {
        currentKey = key
        sections[key] = []
        continue
      }
    }

    if (currentKey) {
      const cleaned = cleanLine(trimmed)
      if (cleaned) sections[currentKey].push(cleaned)
    }
  }

  return {
    gancho: sections['gancho']?.join('\n') || '',
    problema: sections['problema']?.join('\n') || '',
    solucion: sections['solucion']?.join('\n') || '',
    prueba: sections['prueba']?.join('\n') || '',
    oferta: sections['oferta']?.join('\n') || '',
    cierre: sections['cierre']?.join('\n') || '',
    manejoObjecion: sections['manejoObjecion']?.join('\n') || '',
    full: text,
  }
}

export async function generateSalesScript(inputs: {
  producto: string
  nicho: string
  problema: string
  resultado: string
  precio: string
  canal: string
  objecion: string
}): Promise<ScriptSections> {
  const prompt = `Eres un experto mundial en copywriting de ventas estilo Alex Hormozi.
Tu trabajo es crear scripts de ventas extremadamente persuasivos, directos, naturales y agresivos para vendedores hispanohablantes en El Salvador y LATAM.

Reglas estrictas:
- Habla como un vendedor callejero inteligente, no como un profesor o un comercial de TV.
- Usa lenguaje directo, crudo y emocional. Evita palabras vacías como "significativa", "de repente", "manera sustancial".
- Sé muy específico con números, ejemplos reales y dolores.
- Estructura obligatoria: 1. GANCHO fuerte, 2. PROBLEMA profundo, 3. SOLUCIÓN, 4. PRUEBA social creíble, 5. OFERTA clara, 6. CIERRE fuerte con pregunta, 7. MANEJO DE OBJECIÓN en bucle (genera al menos tres respuestas para objeciones que podrían aparecer, generando una línea recta estilo Jordan Belfort).
- Haz que suene como si un vendedor top lo estuviera diciendo por WhatsApp o llamada.
- El tono debe ser de autoridad, confianza y urgencia, nunca suave ni educado.
- Usa contracciones (estás, tienes, vas a, etc.) y lenguaje latino natural.

Información del producto:
- Producto/servicio: ${inputs.producto}
- Cliente ideal: ${inputs.nicho}
- Problema principal que resuelve: ${inputs.problema}
- Resultado concreto que obtiene el cliente: ${inputs.resultado}
- Precio de la oferta: ${inputs.precio}
- Canal de venta: ${inputs.canal}
- Objeción principal del cliente: ${inputs.objecion}

Genera el script completo con los 7 puntos numerados y títulos en mayúsculas. Formato obligatorio: 1. GANCHO, 2. PROBLEMA, 3. SOLUCIÓN, 4. PRUEBA, 5. OFERTA, 6. CIERRE, 7. MANEJO DE OBJECIÓN`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 3000,
  })

  const text = completion.choices[0]?.message?.content || ''
  return parseScriptSections(text)
}
