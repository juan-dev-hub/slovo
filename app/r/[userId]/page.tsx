'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ReferralRedirect() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const userId = params.userId as string
    if (userId) {
      localStorage.setItem('referral_code', userId)
    }
    router.replace(`/?ref=${userId}`)
  }, [params, router])

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00c6ff] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
