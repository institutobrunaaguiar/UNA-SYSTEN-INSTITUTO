import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CashbackContent } from "@/components/cashback/cashback-content"

export default function CashbackPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-[68px] dock-spacer">
        <Header title="Cashback" description="Gerencie campanhas de cashback e saldos de clientes." />
        <div className="mt-4 md:mt-5">
          <CashbackContent />
        </div>
      </main>
    </div>
  )
}
