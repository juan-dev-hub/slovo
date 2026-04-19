import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <SignUp afterSignUpUrl="/dashboard" />
    </div>
  )
}
