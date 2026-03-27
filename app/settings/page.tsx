// app/settings/page.tsx
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminContent } from "@/components/admin/admin-content"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header title="Admin" description="Gestão de usuários e configurações." />
        <div className="mt-6">
          <AdminGuard>
            <AdminContent />
          </AdminGuard>
        </div>
      </main>
    </div>
  )
}
