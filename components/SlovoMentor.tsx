'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface MentorResult {
  apertura: string
  punto1: string
  punto2: string
  punto3: string
  cierre: string
  full: string
  modoHook: boolean
}

const SECTIONS = [
  { key: 'apertura', label: 'APERTURA DE IMPACTO',      emoji: '🔥' },
  { key: 'punto1',   label: 'PUNTO 1',                   emoji: '📖' },
  { key: 'punto2',   label: 'PUNTO 2',                   emoji: '⚡' },
  { key: 'punto3',   label: 'PUNTO 3',                   emoji: '💡' },
  { key: 'cierre',   label: 'CIERRE DE ALTA INFLUENCIA', emoji: '🎯' },
]

function AnnotatedText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g)
  return (
    <>
      {parts.map((part, i) =>
        /^\[.+\]$/.test(part) ? (
          <span key={i} className="text-amber-400 italic font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function SlovoMentor() {
  const [tema, setTema] = useState('')
  const [nivelAudiencia, setNivelAudiencia] = useState('Liderazgo (Avanzado)')
  const [objetivo, setObjetivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MentorResult | null>(null)
  const [error, setError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tema.trim() || !objetivo.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/generate-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, nivelAudiencia, objetivo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar la clase')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = useCallback(async () => {
    if (!result) return
    setPdfLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      let y = 22

      const newPage = () => {
        doc.addPage()
        doc.setFillColor(10, 15, 30)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        y = 22
      }

      const checkY = (needed = 20) => {
        if (y > pageHeight - needed) newPage()
      }

      doc.setFillColor(10, 15, 30)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      doc.setFontSize(24)
      doc.setTextColor(255, 180, 50)
      doc.text('SLOVO MENTOR', pageWidth / 2, y, { align: 'center' })
      y += 9

      doc.setFontSize(13)
      doc.setTextColor(200, 200, 200)
      doc.text('Clase Magistral de Liderazgo', pageWidth / 2, y, { align: 'center' })
      y += 7

      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      const metaLines = doc.splitTextToSize(`Tema: ${tema}  ·  ${nivelAudiencia}`, maxWidth)
      metaLines.forEach((l: string) => { doc.text(l, pageWidth / 2, y, { align: 'center' }); y += 5 })
      const objLines = doc.splitTextToSize(`Objetivo: ${objetivo}`, maxWidth)
      objLines.forEach((l: string) => { doc.text(l, pageWidth / 2, y, { align: 'center' }); y += 5 })
      y += 4

      doc.setTextColor(70, 70, 70)
      doc.text(`Generado por SLOVO AI — ${new Date().toLocaleDateString('es-SV')}`, pageWidth / 2, y, { align: 'center' })
      y += 12

      const pdfSections = [
        { title: 'APERTURA DE IMPACTO',       content: result.apertura },
        { title: 'PUNTO 1',                    content: result.punto1   },
        { title: 'PUNTO 2',                    content: result.punto2   },
        { title: 'PUNTO 3',                    content: result.punto3   },
        { title: 'CIERRE DE ALTA INFLUENCIA',  content: result.cierre   },
      ]

      for (const section of pdfSections) {
        checkY(40)
        doc.setFontSize(13)
        doc.setTextColor(255, 180, 50)
        doc.text(section.title, margin, y)
        y += 8

        doc.setFontSize(10)
        for (const rawLine of (section.content || '').split('\n')) {
          if (!rawLine.trim()) { y += 3; continue }
          const isAction = /^\[.+\]$/.test(rawLine.trim())
          doc.setTextColor(isAction ? 255 : 220, isAction ? 180 : 220, isAction ? 50 : 220)
          const wrapped = doc.splitTextToSize(rawLine, maxWidth)
          for (const wl of wrapped) {
            checkY(10)
            doc.text(wl, margin, y)
            y += 6
          }
        }
        y += 10
      }

      doc.save(`slovo-mentor-${tema.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}.pdf`)
    } catch (err) {
      console.error(err)
    } finally {
      setPdfLoading(false)
    }
  }, [result, tema, nivelAudiencia, objetivo])

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-8" glow>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🎙️</span>
                  <h2 className="text-2xl font-black text-white">Slovo Mentor</h2>
                </div>
                <p className="text-white/55 text-sm leading-relaxed">
                  Genera una clase magistral de liderazgo con guion palabra por palabra e instrucciones de actuación. Lista para dictar sin improvisar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Tema <span className="text-electric">*</span>
                  </label>
                  <input
                    type="text"
                    value={tema}
                    onChange={e => setTema(e.target.value)}
                    placeholder="Ej: La multiplicación de talentos en el equipo"
                    maxLength={300}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-electric/60 focus:bg-white/8 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Nivel de Audiencia <span className="text-electric">*</span>
                  </label>
                  <select
                    value={nivelAudiencia}
                    onChange={e => setNivelAudiencia(e.target.value)}
                    className="w-full bg-bg border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-electric/60 transition-colors"
                  >
                    <option value="Atrios (Principiante)">Atrios — Principiante</option>
                    <option value="Célula (Intermedio)">Célula — Intermedio</option>
                    <option value="Liderazgo (Avanzado)">Liderazgo — Avanzado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Objetivo <span className="text-electric">*</span>
                  </label>
                  <input
                    type="text"
                    value={objetivo}
                    onChange={e => setObjetivo(e.target.value)}
                    placeholder="Ej: Cierre de ventas, Consolidación, Visión"
                    maxLength={300}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-electric/60 focus:bg-white/8 transition-colors"
                    required
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-xl p-3"
                  >
                    {error}
                  </motion.p>
                )}

                <Button type="submit" size="lg" loading={loading} className="w-full">
                  {loading ? 'Generando clase magistral...' : '🎙️ Generar Clase Magistral'}
                </Button>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Preview header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">
                    Vista Previa — {result.modoHook ? 'Hook de Empoderamiento' : 'Clase Magistral'}
                  </h2>
                  {result.modoHook && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 tracking-wide">
                      🎣 MODO HOOK
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-sm">{tema} · {nivelAudiencia}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                ← Nueva clase
              </Button>
            </div>

            {/* Sections */}
            {SECTIONS.map((section, idx) => {
              const content = result[section.key as keyof MentorResult] as string
              const isHighlight = idx === 0 || idx === 4
              return (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.45 }}
                >
                  <Card className={`p-6 ${isHighlight ? 'border-amber-400/20' : ''}`} glow={isHighlight}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{section.emoji}</span>
                      <h3 className="font-bold tracking-wider text-sm text-amber-400">
                        {section.label}
                      </h3>
                    </div>
                    <div className="text-white/85 leading-relaxed text-sm space-y-2">
                      {content.split('\n').map((line, i) => (
                        <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
                          {line.trim() && <AnnotatedText text={line} />}
                        </p>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )
            })}

            {/* Acting instructions legend */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-amber-400 text-xs italic font-medium">[instrucciones de actuación]</span>
              <span className="text-white/35 text-xs">= gestos y entonación que debes ejecutar exactamente</span>
            </div>

            {/* Download CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            >
              <Card className="p-6 border-amber-400/25" glow>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold">Clase magistral lista para dictar</p>
                    <p className="text-white/55 text-sm mt-0.5">
                      Descarga el PDF y tenla siempre a mano.
                    </p>
                  </div>
                  <Button onClick={downloadPDF} loading={pdfLoading} size="lg" variant="secondary">
                    {pdfLoading ? 'Generando PDF...' : '📥 Descargar PDF'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
