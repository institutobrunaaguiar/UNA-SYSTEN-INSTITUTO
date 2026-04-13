import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ComissaoContent } from "@/components/comissao/comissao-content"

export default function ComissaoPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header title="Comissão" description="Auditoria, validação e aprovação de comissões da equipe." />
        <div className="mt-6">
          <ComissaoContent />
        </div>
      </main>
    </div>
  )
}
