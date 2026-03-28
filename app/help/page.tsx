import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { HelpContent } from "@/components/help/help-content"

export default function HelpPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header title="Ajuda e Suporte" description="Obtenha ajuda usando a UNA e encontre respostas para perguntas comuns." />

        <div className="mt-6">
          <HelpContent />
        </div>
      </main>
    </div>
  )
}
