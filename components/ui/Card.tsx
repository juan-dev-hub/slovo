'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
}

export function Card({ children, className = '', hover = false, glow = false }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl
        ${glow ? 'shadow-lg shadow-electric/10' : ''}
        ${className}
      `}
    >
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-electric/5 to-deep/5 pointer-events-none" />
      )}
      {children}
    </motion.div>
  )
}
