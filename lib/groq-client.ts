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

function parseScriptSections(text: string): ScriptSections {
  const sectionPatterns = [
    { key: 'gancho', patterns: ['1. GANCHO', 'GANCHO'] },
    { key: 'problema', patterns: ['2. PROBLEMA', 'PROBLEMA'] },
    { key: 'solucion', patterns: ['3. SOLUCIÓN', '3. SOLUCION', 'SOLUCIÓN', 'SOLUCION'] },
    { key: 'prueba', patterns: ['4. PRUEBA', 'PRUEBA'] },
    { key: 'oferta', patterns: ['5. OFERTA', 'OFERTA'] },
    { key: 'cierre', patterns: ['6. CIERRE', 'CIERRE'] },
    { key: 'manejoObjecion', patterns: ['7. MANEJO DE OBJECIÓN', '7. MANEJO DE OBJECION', 'MANEJO DE OBJECIÓN', 'MANEJO DE OBJECION'] },
  ]

  const lines = text.split('\n')
  const sections: Record<string, string[]> = {}
  let currentSection = ''

  for (const line of lines) {
    const trimmed = line.trim()
    let matched = false

    for (const { key, patterns } of sectionPatterns) {
      if (patterns.some(p => trimmed.toUpperCase().includes(p))) {
        currentSection = key
        sections[key] = []
        matched = true
        break
      }
    }

    if (!matched && currentSection && trimmed) {
      sections[currentSection] = [...(sections[currentSection] || []), trimmed]
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
  const prompt = `Eres un experto en copywriting de ventas de alto nivel. Tu trabajo es generar scripts de ventas EXTREMADAMENTE persuasivos usando la estructura de 7 pasos estilo Alex Hormozi, pero INFUNDIDA con la psicología Straight Line Persuasion de Jordan Belfort.

Información del producto:
- Producto/servicio: ${inputs.producto}
- Cliente ideal: ${inputs.nicho}
- Problema principal que resuelve: ${inputs.problema}
- Resultado concreto que obtiene el cliente: ${inputs.resultado}
- Precio de la oferta: ${inputs.precio}
- Canal de venta: ${inputs.canal}
- Objeción principal del cliente: ${inputs.objecion}

Reglas obligatorias para cada sección:

1. GANCHO (máximo 1-2 frases)
   - Debe ser una pregunta o afirmación que golpee directo el dolor más grande del cliente.
   - Haz que duela emocional y financieramente.

2. PROBLEMA (agitación fuerte)
   - Agita el dolor al máximo: describe consecuencias reales, emocionales y de dinero.
   - Usa lenguaje conversacional, directo y crudo (como si hablaras con un amigo).
   - Haz que el prospecto piense "¡exacto, eso me pasa a mí!".

3. SOLUCIÓN
   - Presenta la solución con certeza absoluta.
   - Usa frases de futuro pacing: "Imagina…", "Ahora vas a poder…", "De repente…".
   - Enfócate en el resultado que el cliente va a VIVIR, no en características.

4. PRUEBA
   - Historia específica con números reales (dinero ahorrado, tiempo, resultados).
   - Hazla creíble y relatable.

5. OFERTA
   - Apila valor (Hormozi style): precio + lo que realmente obtiene + beneficios extras.
   - Enfatiza que es una inversión inteligente y que está pagando poco por mucho.

6. CIERRE (Straight Line)
   - Cierre directo y en línea recta: lleva al "sí" sin dar opción a pensar.
   - Pregunta de control o pregunta de cierre claro.

7. MANEJO DE OBJECIÓN
   - Anticipa la objeción más común y la destroza con una contra-pregunta poderosa que vuelva a llevar al sí.

Estilo general:
- Lenguaje natural, conversacional y de alto impacto (nada robótico).
- Crea urgencia y certeza en todo momento.
- El prospecto debe sentir que "esto es exactamente lo que necesito" y "tengo que actuar ya".
- Mantén el formato numerado exacto: 1. GANCHO, 2. PROBLEMA, etc.

Genera el script completo siguiendo esta estructura y reglas.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 3000,
  })

  const text = completion.choices[0]?.message?.content || ''
  return parseScriptSections(text)
}
