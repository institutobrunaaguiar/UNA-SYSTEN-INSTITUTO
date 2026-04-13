"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

export interface UserProfile {
  id: string
  nome: string
  email: string
  role: "admin" | "operador" | "visualizador"
  ativo: boolean
  modulos: string[]
}

interface UserContextValue {
  user: UserProfile | null
  loading: boolean
  reload: () => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  reload: () => {},
})

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const supabase = getSupabase()

      // getUser() validates against the server — more reliable than getSession()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      setUser(data ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()

    // Re-fetch when auth state changes (login/logout/token refresh)
    const supabase = getSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
        router.push("/login")
        return
      }
      fetchUser()
    })

    // Refresh session when app regains focus (critical for mobile)
    // Mobile browsers suspend tabs — tokens may expire while suspended
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        supabase.auth.getUser().then(({ error }) => {
          if (error) {
            // Token expired and couldn't refresh — redirect to login
            setUser(null)
            router.push("/login")
          }
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchUser, router])

  return (
    <UserContext.Provider value={{ user, loading, reload: fetchUser }}>
      {children}
    </UserContext.Provider>
  )
}
