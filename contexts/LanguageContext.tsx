'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'es' | 'en'

const translations = {
  es: {
    // Navbar
    dashboard: 'Dashboard',
    referrals: 'Referidos',
    terms: 'Términos',
    privacy: 'Privacidad',
    refunds: 'Reembolsos',
    signIn: 'Iniciar sesión',
    // Dashboard
    dashboardTitle: 'Dashboard',
    noCredits: 'Sin créditos — compra un paquete para continuar',
    creditsAvailable: (n: number) => `Tienes ${n} crédito${n !== 1 ? 's' : ''} disponible${n !== 1 ? 's' : ''}`,
    tabGenerator: '⚡ Generador',
    tabMentor: '🎙️ Slovo Mentor',
    tabHistory: '📋 Historial',
    tabCredits: '💳 Créditos',
    yourScript: 'Tu Script de Ventas',
    newScript: 'Nuevo script',
    historyTitle: 'Historial de Scripts',
    historyDesc: 'Tus scripts generados. Los desbloqueados puedes redescargarlos gratis.',
    buyCredits: 'Comprar Créditos',
    currentCreditsLabel: 'Créditos actuales:',
    activateReferral: 'Activa tu programa de referidos',
    activateReferralDesc: 'Compra tu primer paquete de créditos y activa tu link único de referidos. Gana 20% en créditos por cada persona que compre usando tu link.',
    // CreditPackages
    cryptoPayment: 'Crypto',
    cryptoDesc: '+300 criptos',
    credits: 'créditos',
    perCredit: 'por crédito',
    buy: 'Comprar',
    mostPopular: 'MÁS POPULAR',
    securePayments: 'Pagos seguros. Los créditos se acreditan inmediatamente tras confirmación.',
    paymentError: 'Error al crear el pago',
    // Toast
    thankYouPurchase: '¡Gracias por tu compra! Tus créditos han sido acreditados.',
    // ScriptDisplay
    unlockScript: '🔓 Desbloquear Script (-1 crédito)',
    unlocking: 'Desbloqueando...',
    scriptUnlocked: '¡Script desbloqueado!',
    downloadPDF: '📥 Descargar PDF',
    generatingPDF: 'Generando PDF...',
    scriptLocked: '🔒 Script completo bloqueado',
    noCreditsMsg: 'No tienes créditos. Compra un paquete para continuar.',
    creditsMsg: (n: number) => `Tienes ${n} crédito${n !== 1 ? 's' : ''}. Cuesta 1 crédito desbloquear.`,
  },
  en: {
    // Navbar
    dashboard: 'Dashboard',
    referrals: 'Referrals',
    terms: 'Terms',
    privacy: 'Privacy',
    refunds: 'Refunds',
    signIn: 'Sign in',
    // Dashboard
    dashboardTitle: 'Dashboard',
    noCredits: 'No credits — buy a package to continue',
    creditsAvailable: (n: number) => `You have ${n} credit${n !== 1 ? 's' : ''} available`,
    tabGenerator: '⚡ Generator',
    tabMentor: '🎙️ Slovo Mentor',
    tabHistory: '📋 History',
    tabCredits: '💳 Credits',
    yourScript: 'Your Sales Script',
    newScript: 'New script',
    historyTitle: 'Script History',
    historyDesc: 'Your generated scripts. Unlocked ones can be re-downloaded for free.',
    buyCredits: 'Buy Credits',
    currentCreditsLabel: 'Current credits:',
    activateReferral: 'Activate your referral program',
    activateReferralDesc: 'Buy your first credit package and activate your unique referral link. Earn 20% in credits for every person who buys using your link.',
    // CreditPackages
    cryptoPayment: 'Crypto',
    cryptoDesc: '+300 cryptos',
    credits: 'credits',
    perCredit: 'per credit',
    buy: 'Buy',
    mostPopular: 'MOST POPULAR',
    securePayments: 'Secure payments. Credits are added immediately after confirmation.',
    paymentError: 'Error creating payment',
    // Toast
    thankYouPurchase: 'Thank you for your purchase! Your credits have been added.',
    // ScriptDisplay
    unlockScript: '🔓 Unlock Script (-1 credit)',
    unlocking: 'Unlocking...',
    scriptUnlocked: 'Script unlocked!',
    downloadPDF: '📥 Download PDF',
    generatingPDF: 'Generating PDF...',
    scriptLocked: '🔒 Full script locked',
    noCreditsMsg: 'You have no credits. Buy a package to continue.',
    creditsMsg: (n: number) => `You have ${n} credit${n !== 1 ? 's' : ''}. Costs 1 credit to unlock.`,
  },
}

type Translations = typeof translations['es']

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const LangContext = createContext<LangContextType>({
  lang: 'es',
  setLang: () => {},
  t: translations.es,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const stored = localStorage.getItem('slovo_lang') as Lang | null
    if (stored === 'en' || stored === 'es') setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('slovo_lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LangContext)
}
