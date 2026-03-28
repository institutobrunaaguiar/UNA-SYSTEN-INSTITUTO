// app/page.tsx
import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PainelContent } from "@/components/painel/painel-content"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-[68px] dock-spacer">
        <Header title="Painel" description="Métricas de propostas e receita." />
        <div className="mt-4 md:mt-5">
          <PainelContent />
        </div>
      </main>
    </div>
  )
}
