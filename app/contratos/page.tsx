// app/contratos/page.tsx
import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ContratosPageContent } from "@/components/contratos/contratos-page-content"

export default function ContratosPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header title="Contratos" description="Assinatura digital de contratos e termos." />
        <div className="mt-6">
          <ContratosPageContent />
        </div>
      </main>
    </div>
  )
}
