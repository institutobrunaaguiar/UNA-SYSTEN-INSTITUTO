// components/admin/admin-guard.tsx
"use client"

import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const hasAccess = user?.role === "admin" || user?.modulos?.includes("admin")

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Acesso restrito.</p>
      </div>
    )
  }

  return <>{children}</>
}
