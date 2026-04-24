'use client'
import { useEffect } from 'react'

export default function PaymentDonePage() {
  useEffect(() => {
    // Let the parent window know payment is done, then close
    if (window.opener) {
      window.opener.postMessage('payment_complete', window.location.origin)
    }
    window.close()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold text-white">¡Pago completado!</h1>
        <p className="text-white/60">Puedes cerrar esta ventana.</p>
      </div>
    </div>
  )
}
