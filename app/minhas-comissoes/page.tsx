import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { MinhasComissoesContent } from "@/components/minhas-comissoes/minhas-comissoes-content"

export default function MinhasComissoesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer overflow-x-hidden">
        <Header
          title="Minhas Comissões"
          description="Acompanhe suas comissões aprovadas e reprovadas por mês."
        />
        <div className="mt-4 sm:mt-5">
          <MinhasComissoesContent />
        </div>
      </main>
    </div>
  )
}
