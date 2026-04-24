'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ToastItem {
  id: string
  message: string
}

interface ToastProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 6000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="pointer-events-auto bg-[#0d1f3c] border border-electric/40 rounded-2xl px-5 py-4 shadow-xl shadow-black/40 backdrop-blur-md flex items-start gap-3"
    >
      <span className="text-2xl mt-0.5 shrink-0">🎉</span>
      <p className="text-white text-sm leading-relaxed flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/40 hover:text-white transition-colors text-lg leading-none shrink-0 mt-0.5"
      >
        ✕
      </button>
    </motion.div>
  )
}
