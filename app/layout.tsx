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
        <body className={`${inter.className} bg-bg min-h-screen flex flex-col`}>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 py-4 px-6">
            <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-white/30">
              <a href="/conditions" className="hover:text-white/60 transition-colors">Términos de servicio</a>
              <a href="/privacy" className="hover:text-white/60 transition-colors">Política de privacidad</a>
              <a href="/refunds" className="hover:text-white/60 transition-colors">Política de reembolso</a>
              <span>© {new Date().getFullYear()} SLOVO AI</span>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
