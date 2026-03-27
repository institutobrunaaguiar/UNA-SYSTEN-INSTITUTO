import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CalendarContent } from "@/components/calendario/calendar-content"

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
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
