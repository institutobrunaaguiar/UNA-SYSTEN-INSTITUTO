import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PacientesContent } from "@/components/pacientes/pacientes-content"
import { Button } from "@/components/ui/button"

export default function PacientesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header
          title="Pacientes"
          description="Gerencie e visualize todos os pacientes do sistema."
          actions={
            <Button className="w-full sm:w-auto h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
              + Adicionar Paciente
            </Button>
          }
        />

        <div className="mt-6">
          <PacientesContent />
        </div>
      </main>
    </div>
  )
}
