"use client"

import { Card } from "@/components/ui/card"
import { CalendarDayCard } from "./calendar-day-card"
import { CalendarPopover } from "./calendar-popover"
import type { Agendamento, ColorMode } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarMonthViewProps {
  year: number
  month: number
  agendamentos: Agendamento[]
  selectedDay: string | null
  colorMode: ColorMode
  onSelectDay: (dayKey: string) => void
  onVerDetalhes: (agendamento: Agendamento) => void
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export function CalendarMonthView({
  year,
  month,
  agendamentos,
  selectedDay,
  colorMode,
  onSelectDay,
  onVerDetalhes,
}: CalendarMonthViewProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startPad; i++) calendarDays.push(null)
  for (let d = 1; d <= totalDays; d++) calendarDays.push(d)

  function getDayKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
  })()

  const porDia: Record<string, Agendamento[]> = {}
  agendamentos.forEach((a) => {
    const key = a.data
    if (!porDia[key]) porDia[key] = []
    porDia[key].push(a)
  })

  Object.values(porDia).forEach((arr) => arr.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)))

  const agendamentosDoDia = selectedDay ? (porDia[selectedDay] || []) : []

  function formatSelectedDate(): string {
    if (!selectedDay) return ""
    const [y, m, d] = selectedDay.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DIAS_SEMANA.map((dia) => (
            <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-1">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="h-10" />
            const dayKey = getDayKey(day)
            const dayAgendamentos = porDia[dayKey] || []
            const count = dayAgendamentos.length
            const isToday = dayKey === todayStr
            const isSelected = dayKey === selectedDay

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onSelectDay(dayKey)}
                className={`h-10 rounded-lg text-sm relative transition-all duration-200 flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday
                      ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                      : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="text-xs">{day}</span>
                {count > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {count <= 3 ? (
                      dayAgendamentos.slice(0, 3).map((a, idx) => {
                        const dotColor = colorMode === "rotulo" && a.cor_rotulo
                          ? undefined
                          : (STATUS_CONFIG[a.status]?.dotColor || "bg-gray-400")
                        const dotStyle = colorMode === "rotulo" && a.cor_rotulo
                          ? { backgroundColor: a.cor_rotulo }
                          : undefined
                        return (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : (dotColor || "")}`}
                            style={isSelected ? undefined : dotStyle}
                          />
                        )
                      })
                    ) : (
                      <span className={`text-[9px] font-bold ${isSelected ? "text-primary-foreground" : "text-primary"}`}>
                        {count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground capitalize">{formatSelectedDate()}</h3>
          <p className="text-xs text-muted-foreground">
            {agendamentosDoDia.length} {agendamentosDoDia.length === 1 ? "agendamento" : "agendamentos"}
          </p>
        </div>

        {agendamentosDoDia.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {agendamentosDoDia.map((agendamento) => (
              <CalendarPopover
                key={agendamento.id}
                agendamento={agendamento}
                onVerDetalhes={onVerDetalhes}
              >
                <div>
                  <CalendarDayCard
                    agendamento={agendamento}
                    colorMode={colorMode}
                    onClick={() => {}}
                  />
                </div>
              </CalendarPopover>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
