import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PropostasContent } from "@/components/propostas/propostas-content"

export default function PropostaPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header
          title="Propostas"
          description="Crie e gerencie propostas comerciais para seus pacientes."
        />

        <div className="mt-6">
          <PropostasContent />
        </div>
      </main>
    </div>
  )
}
