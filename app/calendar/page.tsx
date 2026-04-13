import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CalendarContent } from "@/components/calendario/calendar-content"

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-[68px] dock-spacer">
        <Header
          title="Calendario"
          description="Visualize e gerencie os agendamentos da clinica."
        />

        <div className="mt-6">
          <CalendarContent />
        </div>
      </main>
    </div>
  )
}
