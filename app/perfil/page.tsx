// app/perfil/page.tsx
import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PerfilContent } from "@/components/perfil/perfil-content"

export default function PerfilPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header title="Meu Perfil" description="Gerencie suas informações e senha de acesso." />
        <div className="mt-6">
          <PerfilContent />
        </div>
      </main>
    </div>
  )
}
