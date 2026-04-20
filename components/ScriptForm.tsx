'use client'
import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Input, Textarea, Select } from './ui/Input'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface FormData {
  producto: string
  nicho: string
  problema: string
  resultado: string
  precio: string
  canal: string
  objecion: string
}

interface ScriptFormProps {
  onScriptGenerated: (data: {
    scriptId: string
    gancho: string
    problema: string
    solucion: string
    prueba: string
    oferta: string
    cierre: string
    manejoObjecion: string
    full: string
  }) => void
}

const canalOptions = [
  { value: 'llamada telefónica', label: '📞 Llamada telefónica' },
  { value: 'videollamada', label: '🎥 Videollamada' },
  { value: 'email', label: '📧 Email' },
  { value: 'mensaje directo (DM)', label: '💬 Mensaje Directo (DM)' },
  { value: 'cara a cara', label: '🤝 Cara a cara / Presencial' },
]

export function ScriptForm({ onScriptGenerated }: ScriptFormProps) {
  const [form, setForm] = useState<FormData>({
    producto: '',
    nicho: '',
    problema: '',
    resultado: '',
    precio: '',
    canal: '',
    objecion: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filledCount = Object.values(form).filter(v => v.trim() !== '').length
  const totalFields = Object.keys(form).length
  const isComplete = filledCount === totalFields

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    for (const [key, value] of Object.entries(form)) {
      if (!value.trim()) {
        setError(`El campo "${key}" es requerido`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando script')

      onScriptGenerated(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <Card className="p-8" glow>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Genera tu script de ventas</h2>
          <p className="text-white/60 text-sm">Llena los 7 campos y la IA generará un script estilo Hormozi personalizado para ti.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div variants={itemVariants}>
            <Input
              label="Producto o servicio"
              placeholder="Ej: Consultoría de marketing digital"
              value={form.producto}
              onChange={set('producto')}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="Nicho de mercado"
              placeholder="Ej: Dueños de restaurantes en El Salvador"
              value={form.nicho}
              onChange={set('nicho')}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2">
            <Textarea
              label="Problema principal que resuelve"
              placeholder="Ej: No consiguen clientes nuevos y dependen del boca a boca"
              value={form.problema}
              onChange={set('problema')}
              rows={3}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2">
            <Textarea
              label="Resultado concreto que obtiene el cliente"
              placeholder="Ej: 30 clientes nuevos en 60 días garantizado"
              value={form.resultado}
              onChange={set('resultado')}
              rows={3}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="Precio de la oferta"
              placeholder="Ej: $997 o $197/mes"
              value={form.precio}
              onChange={set('precio')}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Select
              label="Canal de venta"
              options={canalOptions}
              value={form.canal}
              onChange={set('canal')}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2">
            <Textarea
              label="Objeción principal del cliente"
              placeholder="Ej: No tengo tiempo para implementar estrategias de marketing"
              value={form.objecion}
              onChange={set('objecion')}
              rows={3}
            />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="md:col-span-2 space-y-3">
            {!isComplete && (
              <div className="flex items-center justify-between text-xs text-white/50 px-1">
                <span>Completa todos los campos para generar</span>
                <span className="font-bold text-white/70">{filledCount}/{totalFields}</span>
              </div>
            )}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(filledCount / totalFields) * 100}%`,
                  background: isComplete ? '#22d3ee' : '#6366f1',
                }}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!isComplete}
              className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Generando script...' : '⚡ Generar Script de Ventas'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </Card>
  )
}
