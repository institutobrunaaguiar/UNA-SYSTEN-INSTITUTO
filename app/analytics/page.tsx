import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { RelatoriosContent } from "@/components/relatorios/relatorios-content"

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header title="Relatorios" description="Analise operacional e financeira do negocio." />
        <div className="mt-6">
          <RelatoriosContent />
        </div>
      </main>
    </div>
  )
}
