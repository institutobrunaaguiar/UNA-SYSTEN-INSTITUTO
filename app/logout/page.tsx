"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export default function LogoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await getSupabase().auth.signOut()
    router.replace("/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header />

        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Card className="p-8 max-w-md w-full text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <LogOut className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Sair</h1>
              <p className="text-muted-foreground">Tem certeza de que deseja sair?</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={loading} onClick={handleLogout}>
                {loading ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
