'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ReferralData {
  linkActivo: boolean
  referralUrl: string | null
  totalReferidos: number
  creditosGanados: number
}

interface UserData {
  creditos: number
}

export default function ReferidosPage() {
  const { userId } = useAuth()
  const [data, setData] = useState<ReferralData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!userId) return
      try {
        const [refRes, userRes] = await Promise.all([
          fetch('/api/referidos'),
          fetch('/api/user'),
        ])
        if (refRes.ok) setData(await refRes.json())
        if (userRes.ok) {
          const u = await userRes.json()
          setUserData({ creditos: u.creditos })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  function copyLink() {
    if (!data?.referralUrl) return
    navigator.clipboard.writeText(data.referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <ParticleBackground />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-electric border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg relative">
      <ParticleBackground />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <Navbar credits={userData?.creditos} />

      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl font-black text-white mb-2">Programa de Referidos</h1>
            <p className="text-white/50">Comparte tu link y gana créditos gratis cada vez que alguien compra.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Referidos totales', value: data?.totalReferidos ?? 0, icon: '👥' },
              { label: 'Créditos ganados', value: data?.creditosGanados ?? 0, icon: '💰' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 text-center" glow>
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-4xl font-black text-gradient">{stat.value}</div>
                  <div className="text-white/55 text-sm mt-1">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Referral link or locked state */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {data?.linkActivo ? (
              <Card className="p-8" glow>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-aqua/20 flex items-center justify-center">
                    <span className="text-xl">🔗</span>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Tu link de referidos</h2>
                    <p className="text-white/50 text-sm">Activo — ganas 20% en créditos por cada compra</p>
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-sm text-electric truncate">
                    {data.referralUrl}
                  </div>
                  <Button onClick={copyLink} variant={copied ? 'secondary' : 'primary'}>
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Comparten el link', step: '1', desc: 'Tu referido visita el sitio con tu link único' },
                    { label: 'Se registran', step: '2', desc: 'Crean su cuenta y el sistema los vincula a ti' },
                    { label: 'Compran créditos', step: '3', desc: 'Tú recibes 20% en créditos redondeado arriba' },
                  ].map(item => (
                    <div key={item.step} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-electric font-black text-xl mb-1">{item.step}</div>
                      <div className="text-white text-sm font-semibold mb-1">{item.label}</div>
                      <div className="text-white/45 text-xs">{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-electric/10 border border-electric/20 rounded-xl">
                  <p className="text-electric text-sm font-medium">💡 Ejemplo</p>
                  <p className="text-white/70 text-sm mt-1">
                    Si tu referido compra el paquete de 25 créditos ($15),
                    tú recibes <span className="text-white font-bold">5 créditos</span> automáticamente (20% de 25 = 5).
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center" glow>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-6"
                >
                  🔒
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-3">Link de referidos bloqueado</h2>
                <p className="text-white/55 text-base mb-8 max-w-md mx-auto">
                  Compra tu primer paquete de créditos para activar tu link único de referidos
                  y empezar a ganar créditos gratis.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  {[
                    { credits: 10, price: '$7', bonus: '2 créditos de bono al primer referido' },
                    { credits: 25, price: '$15', bonus: '5 créditos de bono al primer referido', popular: true },
                    { credits: 50, price: '$25', bonus: '10 créditos de bono al primer referido' },
                  ].map(pkg => (
                    <Card
                      key={pkg.credits}
                      className={`p-5 flex-1 text-center ${pkg.popular ? 'border-electric/50' : ''}`}
                      hover
                      glow={pkg.popular}
                    >
                      {pkg.popular && (
                        <div className="text-xs text-electric font-bold mb-2">MÁS POPULAR</div>
                      )}
                      <div className="text-3xl font-black text-gradient">{pkg.credits}</div>
                      <div className="text-white/60 text-xs mb-2">créditos</div>
                      <div className="text-white font-bold">{pkg.price}</div>
                    </Card>
                  ))}
                </div>

                <Button size="lg" onClick={() => window.location.href = '/dashboard?tab=credits'}>
                  💳 Comprar créditos y activar link
                </Button>
              </Card>
            )}
          </motion.div>

          {/* How it works when locked */}
          {!data?.linkActivo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <Card className="p-6">
                <h3 className="text-white font-bold mb-4">¿Cómo funciona el programa?</h3>
                <ul className="space-y-3">
                  {[
                    'Compra cualquier paquete de créditos para activar tu link único',
                    'Comparte tu link en redes, email, WhatsApp o donde quieras',
                    'Cuando alguien compra usando tu link, recibes 20% de sus créditos automáticamente',
                    'Los créditos de referidos se acreditan al instante, sin límite',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/65 text-sm">
                      <span className="text-electric font-bold mt-0.5">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
