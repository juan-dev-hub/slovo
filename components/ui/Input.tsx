'use client'
import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-white/80">{label}</label>}
      <input
        ref={ref}
        className={`
          w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40
          focus:outline-none focus:border-electric focus:ring-2 focus:ring-electric/30
          backdrop-blur-sm transition-all duration-200
          ${error ? 'border-red-400/60' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-white/80">{label}</label>}
      <textarea
        ref={ref}
        className={`
          w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40
          focus:outline-none focus:border-electric focus:ring-2 focus:ring-electric/30
          backdrop-blur-sm transition-all duration-200 resize-none
          ${error ? 'border-red-400/60' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-white/80">{label}</label>}
      <select
        className={`
          w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white
          focus:outline-none focus:border-electric focus:ring-2 focus:ring-electric/30
          backdrop-blur-sm transition-all duration-200 appearance-none cursor-pointer
          ${error ? 'border-red-400/60' : ''}
          ${className}
        `}
        style={{ background: 'rgba(255,255,255,0.08)' }}
        {...props}
      >
        <option value="" disabled style={{ background: '#0a0f1e' }}>Seleccionar...</option>
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#0a0f1e' }}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
