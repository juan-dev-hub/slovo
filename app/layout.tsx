import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SLOVO AI — Genera Scripts de Ventas Estilo Hormozi',
  description: 'Genera scripts de ventas de alto impacto con IA. Método Alex Hormozi. Llena 7 campos y obtén tu script personalizado.',
  keywords: 'scripts de ventas, Alex Hormozi, IA, ventas, copywriting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className="dark">
        <body className={`${inter.className} bg-bg min-h-screen`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
