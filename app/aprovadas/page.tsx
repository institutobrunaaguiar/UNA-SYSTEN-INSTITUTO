import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AprovadasContent } from "@/components/aprovadas/aprovadas-content"

export default function AprovadasPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-[68px] dock-spacer">
        <Header title="Validações" description="Propostas aprovadas e reprovadas." />
        <div className="mt-4 md:mt-5">
          <AprovadasContent />
        </div>
      </main>
    </div>
  )
}
