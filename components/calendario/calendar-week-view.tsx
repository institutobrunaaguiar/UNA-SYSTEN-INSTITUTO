"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { CalendarPopover } from "./calendar-popover"
import type { Agendamento, ColorMode } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarWeekViewProps {
  weekStart: Date
  agendamentos: Agendamento[]
  colorMode: ColorMode
  onVerDetalhes: (agendamento: Agendamento) => void
}

const HOURS_START = 7
const HOURS_END = 21
const HOUR_HEIGHT = 60
const DIAS_SEMANA_FULL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export function CalendarWeekView({ weekStart, agendamentos, colorMode, onVerDetalhes }: CalendarWeekViewProps) {
  const hours = Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i)

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  function getDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const todayStr = getDayKey(new Date())
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const porDia: Record<string, Agendamento[]> = {}
  agendamentos.forEach((a) => {
    if (!porDia[a.data]) porDia[a.data] = []
    porDia[a.data].push(a)
  })

  function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number)
    return h * 60 + m
  }

  function getBlockStyle(agendamento: Agendamento): React.CSSProperties {
    const startMin = timeToMinutes(agendamento.hora_inicio)
    const endMin = timeToMinutes(agendamento.hora_fim)
    const top = ((startMin - HOURS_START * 60) / 60) * HOUR_HEIGHT
    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 36)
    return { top: `${top}px`, height: `${height}px` }
  }

  function getBlockColor(agendamento: Agendamento): { className: string; style?: React.CSSProperties } {
    if (colorMode === "rotulo" && agendamento.cor_rotulo) {
      return {
        className: "text-white",
        style: { backgroundColor: agendamento.cor_rotulo },
      }
    }
    const cfg = STATUS_CONFIG[agendamento.status]
    return { className: cfg?.color || "bg-gray-100 text-gray-800" }
  }

  const nowLineTop = ((nowMinutes - HOURS_START * 60) / 60) * HOUR_HEIGHT

  return (
    <Card className="p-4">
      <div className="overflow-x-auto -mx-3 sm:mx-0">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
          <div />
          {weekDays.map((date) => {
            const key = getDayKey(date)
            const isToday = key === todayStr
            return (
              <div
                key={key}
                className={`text-center py-2 rounded-lg ${isToday ? "bg-primary/10" : ""}`}
              >
                <p className="text-xs text-muted-foreground">{DIAS_SEMANA_FULL[date.getDay()]}</p>
                <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                  {date.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 relative" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground"
                style={{ top: `${(hour - HOURS_START) * HOUR_HEIGHT}px` }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {weekDays.map((date) => {
            const key = getDayKey(date)
            const dayAgendamentos = porDia[key] || []
            const isToday = key === todayStr

            return (
              <div key={key} className="relative border-l border-border">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/50"
                    style={{ top: `${(hour - HOURS_START) * HOUR_HEIGHT}px` }}
                  />
                ))}

                {isToday && nowMinutes >= HOURS_START * 60 && nowMinutes <= HOURS_END * 60 && (
                  <div
                    className="absolute w-full h-0.5 bg-red-500 z-10"
                    style={{ top: `${nowLineTop}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-[3px]" />
                  </div>
                )}

                {dayAgendamentos.map((agendamento) => {
                  const blockStyle = getBlockStyle(agendamento)
                  const blockColor = getBlockColor(agendamento)
                  return (
                    <CalendarPopover
                      key={agendamento.id}
                      agendamento={agendamento}
                      onVerDetalhes={onVerDetalhes}
                    >
                      <div
                        className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-[5] ${blockColor.className}`}
                        style={{ ...blockStyle, ...blockColor.style }}
                      >
                        <p className="text-[11px] font-medium truncate leading-tight">
                          {agendamento.hora_inicio.slice(0, 5)}
                        </p>
                        <p className="text-[11px] truncate leading-tight">
                          {agendamento.nome_paciente || `#${agendamento.id_paciente}`}
                        </p>
                      </div>
                    </CalendarPopover>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </Card>
  )
}
