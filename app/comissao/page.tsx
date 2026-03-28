import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ComissaoContent } from "@/components/comissao/comissao-content"

export default function ComissaoPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6 lg:ml-64 dock-spacer">
        <Header title="Comissão" description="Auditoria, validação e aprovação de comissões da equipe." />
        <div className="mt-6">
          <ComissaoContent />
        </div>
      </main>
    </div>
  )
}
