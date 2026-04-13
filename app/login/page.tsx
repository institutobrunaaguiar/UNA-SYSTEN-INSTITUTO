// app/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: authError } = await getSupabase().auth.signInWithPassword({ email, password })
    if (authError) {
      setError("E-mail ou senha incorretos.")
      setLoading(false)
    } else {
      router.replace("/painel")
    }
  }

  const emailActive = emailFocused || email.length > 0
  const passwordActive = passwordFocused || password.length > 0

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative"
      style={{
        background: "radial-gradient(ellipse at center, #FAF9F5 0%, #FAF9F5 35%, #c2d4c0 100%)",
      }}
    >
      {/* Dark mode overlay */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: "radial-gradient(ellipse at center, #1B1D24 0%, #1B1D24 35%, #2a3328 100%)",
        }}
      />

      {/* Ocean waves */}
      <div className="ocean">
        <div className="wave" />
        <div className="wave" />
      </div>

      <div className="relative z-10">
        {/* Shadow card behind */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-[98%] h-1/2 bg-white/50 dark:bg-white/5 rounded-[10px] -z-10" />

        {/* Login box */}
        <div className="w-full max-w-[400px] bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-[10px] shadow-[2px_4px_4px_#dcdcdc,-2px_4px_4px_#dcdcdc] dark:shadow-none dark:border dark:border-border px-[50px] py-5 relative">
          {/* Header with accent bar */}
          <div className="relative h-[50px] leading-[50px]">
            <div className="absolute -left-[50px] top-0 h-full w-2 bg-primary rounded-l-[10px]" />
            <h3 className="text-primary font-bold tracking-[0.15em] uppercase text-lg">
              LOGIN
            </h3>
          </div>

          {/* Logo */}
          <div className="flex justify-center py-6">
            <img
              src="https://institutobrunaaguiar.com.br/images/logo-1.png"
              alt="Instituto Bruna Aguiar"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-2.5">
            {/* Email field */}
            <div className="my-5 w-full relative inline-block">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                autoFocus
                className="w-full border-0 border-b border-[#ccc] dark:border-border h-10 leading-10 text-[0.9em] outline-none bg-transparent text-foreground"
              />
              <span
                className={`absolute left-0 text-[#ccc] dark:text-muted-foreground pointer-events-none transition-all duration-100 ${
                  emailActive ? "text-[0.8em] -top-2.5" : "top-2.5 text-[0.9em]"
                }`}
              >
                E-mail
              </span>
              <span
                className={`absolute left-0 bottom-0 h-px bg-primary transition-all duration-200 ${
                  emailActive ? "w-full" : "w-0"
                }`}
              />
            </div>

            {/* Password field */}
            <div className="my-5 w-full relative inline-block">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="w-full border-0 border-b border-[#ccc] dark:border-border h-10 leading-10 text-[0.9em] outline-none bg-transparent text-foreground"
              />
              <span
                className={`absolute left-0 text-[#ccc] dark:text-muted-foreground pointer-events-none transition-all duration-100 ${
                  passwordActive ? "text-[0.8em] -top-2.5" : "top-2.5 text-[0.9em]"
                }`}
              >
                Senha
              </span>
              <span
                className={`absolute left-0 bottom-0 h-px bg-primary transition-all duration-200 ${
                  passwordActive ? "w-full" : "w-0"
                }`}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive text-center mb-4">{error}</p>
            )}

            {/* Submit */}
            <div className="my-5 text-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-[70%] bg-transparent border border-[#ccc] dark:border-border px-4 py-3.5 text-[#ccc] dark:text-muted-foreground cursor-pointer uppercase tracking-[0.1em] text-sm font-medium transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
