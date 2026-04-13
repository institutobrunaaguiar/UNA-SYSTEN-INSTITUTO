import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CampanhaContent } from "@/components/campanha/campanha-content"

export default function CampanhaPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header title="Campanha" description="Crie e gerencie campanhas comerciais vinculadas a procedimentos." />
        <div className="mt-6">
          <CampanhaContent />
        </div>
      </main>
    </div>
  )
}
