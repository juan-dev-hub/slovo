'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { ScriptForm } from '@/components/ScriptForm'
import { ScriptDisplay } from '@/components/ScriptDisplay'
import { ScriptHistory } from '@/components/ScriptHistory'
import { CreditPackages } from '@/components/CreditPackages'
import { Toast, ToastItem } from '@/components/Toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'

type Tab = 'generator' | 'history' | 'credits'

interface GeneratedScript {
  scriptId: string
  apertura: string
  presentacion: string
  manejoObjeciones: string
  cierre: string
  loopObjeciones: string
  tonality: string
  full: string
}

interface UserData {
  creditos: number
  link_referido_activo: boolean
}

export default function DashboardPage() {
  const { userId } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState<Tab>('generator')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [scripts, setScripts] = useState<any[]>([])
  const [currentScript, setCurrentScript] = useState<GeneratedScript | null>(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const notifPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function addToast(message: string) {
    setToasts(prev => [...prev, { id: crypto.randomUUID(), message }])
  }

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const pollNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const { notifications } = await res.json()
      for (const n of notifications) addToast(n.mensaje)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    async function init() {
      if (!userId) return
      try {
        const refCode = typeof window !== 'undefined' ? localStorage.getItem('referral_code') : null
        const [userRes, scriptsRes] = await Promise.all([
          fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referidoPor: refCode || undefined }),
          }),
          fetch('/api/scripts'),
        ])

        if (userRes.ok) {
          const u = await userRes.json()
          setUserData({ creditos: u.creditos, link_referido_activo: u.link_referido_activo })
          if (refCode) localStorage.removeItem('referral_code')
        }
        if (scriptsRes.ok) setScripts(await scriptsRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [userId])

  // Poll for referral notifications every 10 s
  useEffect(() => {
    pollNotifications()
    notifPollRef.current = setInterval(pollNotifications, 10000)
    return () => { if (notifPollRef.current) clearInterval(notifPollRef.current) }
  }, [pollNotifications])

  async function refreshUser() {
    const res = await fetch('/api/user')
    if (res.ok) {
      const u = await res.json()
      setUserData({ creditos: u.creditos, link_referido_activo: u.link_referido_activo })
    }
  }

  async function refreshScripts() {
    const res = await fetch('/api/scripts')
    if (res.ok) setScripts(await res.json())
  }

  function handleScriptGenerated(data: GeneratedScript) {
    setCurrentScript(data)
    refreshScripts()
  }

  function handleUnlocked(newCredits: number) {
    setUserData(prev => prev ? { ...prev, creditos: newCredits } : null)
    refreshScripts()
  }

  function handlePaymentSuccess(newCredits: number) {
    setUserData(prev => prev ? { ...prev, creditos: newCredits } : null)
  }

  const tabs = [
    { id: 'generator' as Tab, label: t.tabGenerator },
    { id: 'history' as Tab, label: t.tabHistory },
    { id: 'credits' as Tab, label: t.tabCredits },
  ]

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

      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-black text-white">{t.dashboardTitle}</h1>
            <p className="text-white/50 mt-1">
              {userData?.creditos === 0
                ? t.noCredits
                : t.creditsAvailable(userData?.creditos ?? 0)}
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit"
          >
            {tabs.map(tab_ => (
              <button
                key={tab_.id}
                onClick={() => setTab(tab_.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  tab === tab_.id
                    ? 'bg-gradient-to-r from-electric to-deep text-white shadow-lg shadow-electric/20'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab_.label}
              </button>
            ))}
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {tab === 'generator' && (
              <motion.div key="generator" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                {!currentScript ? (
                  <ScriptForm onScriptGenerated={handleScriptGenerated} />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">{t.yourScript}</h2>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentScript(null)}>
                        ← {t.newScript}
                      </Button>
                    </div>
                    <ScriptDisplay script={currentScript} credits={userData?.creditos ?? 0} onUnlocked={handleUnlocked} />
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">{t.historyTitle}</h2>
                  <p className="text-white/50 text-sm mt-1">{t.historyDesc}</p>
                </div>
                <ScriptHistory
                  scripts={scripts}
                  credits={userData?.creditos ?? 0}
                  onCreditUsed={newCredits => setUserData(prev => prev ? { ...prev, creditos: newCredits } : null)}
                />
              </motion.div>
            )}

            {tab === 'credits' && (
              <motion.div key="credits" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">{t.buyCredits}</h2>
                  <p className="text-white/50 text-sm mt-1">
                    {t.currentCreditsLabel} <span className="text-electric font-bold">{userData?.creditos}</span>
                  </p>
                </div>
                <Card className="p-6" glow>
                  <CreditPackages
                    onSuccess={handlePaymentSuccess}
                    onToast={addToast}
                  />
                </Card>

                {!userData?.link_referido_activo && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
                    <Card className="p-6 border-aqua/20">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">🔗</span>
                        <div>
                          <h3 className="text-white font-semibold mb-1">{t.activateReferral}</h3>
                          <p className="text-white/55 text-sm">{t.activateReferralDesc}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
