import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PropostasContent } from "@/components/propostas/propostas-content"

export default function PropostaPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer overflow-x-hidden">
        <Header
          title="Propostas"
          description="Crie e gerencie propostas comerciais para seus pacientes."
        />
        <div className="mt-4 sm:mt-5">
          <PropostasContent />
        </div>
      </main>
    </div>
  )
}
