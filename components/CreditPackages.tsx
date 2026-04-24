'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { CREDIT_PACKAGES } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface CreditPackagesProps {
  onSuccess?: (newCredits: number) => void
  onToast?: (msg: string) => void
}

export function CreditPackages({ onSuccess, onToast }: CreditPackagesProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')
  const popupRef = useRef<Window | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const baseCreditsRef = useRef<number | null>(null)

  // Listen for payment_complete message from popup
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data === 'payment_complete') stopPolling()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
    setLoading(null)
  }

  function startPolling(baseCredits: number) {
    baseCreditsRef.current = baseCredits
    pollRef.current = setInterval(async () => {
      // Stop if popup was closed manually
      if (popupRef.current?.closed) { stopPolling(); return }
      try {
        const res = await fetch('/api/credits')
        if (!res.ok) return
        const { credits } = await res.json()
        if (credits > (baseCreditsRef.current ?? credits)) {
          stopPolling()
          onToast?.(t.thankYouPurchase)
          onSuccess?.(credits)
        }
      } catch { /* ignore */ }
    }, 3000)
  }

  async function handlePurchase(credits: number) {
    setLoading(credits)
    setError('')
    try {
      // Snapshot current credits before payment
      const creditRes = await fetch('/api/credits')
      const { credits: currentCredits } = creditRes.ok ? await creditRes.json() : { credits: 0 }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits, provider: 'nowpayments' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.paymentError)

      const popup = window.open(
        data.checkoutUrl,
        'nowpayments_checkout',
        'width=820,height=700,left=200,top=100,resizable=yes,scrollbars=yes'
      )
      if (!popup) {
        // Popup blocked — fall back to redirect
        window.location.href = data.checkoutUrl
        return
      }
      popupRef.current = popup
      startPolling(currentCredits)
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Only crypto — NowPayments */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl w-fit">
        <span className="text-lg">🪙</span>
        <div>
          <span className="text-white text-sm font-semibold">{t.cryptoPayment}</span>
          <span className="text-white/50 text-xs ml-2">{t.cryptoDesc}</span>
        </div>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CREDIT_PACKAGES.map((pkg, idx) => (
          <motion.div
            key={pkg.credits}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative"
          >
            <Card
              className={`p-6 flex flex-col items-center gap-4 ${'popular' in pkg && pkg.popular ? 'border-electric/60 bg-electric/10' : ''}`}
              hover
              glow={'popular' in pkg && pkg.popular}
            >
              {'popular' in pkg && pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-electric to-deep text-white text-xs font-bold rounded-full">
                    {t.mostPopular}
                  </span>
                </div>
              )}

              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-electric to-aqua bg-clip-text text-transparent">
                  {pkg.credits}
                </div>
                <div className="text-white/70 text-sm font-medium">{t.credits}</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">{pkg.priceLabel}</div>
                <div className="text-white/50 text-xs mt-1">
                  ${(pkg.price / pkg.credits).toFixed(2)} {t.perCredit}
                </div>
              </div>

              <Button
                onClick={() => handlePurchase(pkg.credits)}
                loading={loading === pkg.credits}
                disabled={loading !== null && loading !== pkg.credits}
                className="w-full"
                variant={'popular' in pkg && pkg.popular ? 'primary' : 'secondary'}
              >
                {t.buy}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm text-center p-3 bg-red-500/10 border border-red-400/20 rounded-xl"
        >
          {error}
        </motion.p>
      )}

      <p className="text-white/40 text-xs text-center">{t.securePayments}</p>
    </div>
  )
}
