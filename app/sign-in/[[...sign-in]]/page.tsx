import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  )
}
