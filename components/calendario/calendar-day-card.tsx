"use client"

import { Card } from "@/components/ui/card"
import type { Agendamento, ColorMode } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarDayCardProps {
  agendamento: Agendamento
  colorMode: ColorMode
  onClick: (agendamento: Agendamento) => void
}

export function CalendarDayCard({ agendamento, colorMode, onClick }: CalendarDayCardProps) {
  const statusCfg = STATUS_CONFIG[agendamento.status] || STATUS_CONFIG.AGENDADO

  const barColor = colorMode === "rotulo" && agendamento.cor_rotulo
    ? agendamento.cor_rotulo
    : statusCfg.dotColor

  const barStyle = colorMode === "rotulo" && agendamento.cor_rotulo
    ? { backgroundColor: agendamento.cor_rotulo }
    : undefined

  return (
    <Card
      className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick(agendamento)}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-1 self-stretch rounded-full shrink-0 ${colorMode === "status" ? barColor : ""}`}
          style={barStyle}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {agendamento.hora_inicio.slice(0, 5)} - {agendamento.hora_fim.slice(0, 5)}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground truncate mt-0.5">
            {agendamento.nome_paciente || `Paciente #${agendamento.id_paciente}`}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {agendamento.nome_profissional || ""}
            {agendamento.nome_tipo_consulta ? ` • ${agendamento.nome_tipo_consulta}` : ""}
          </p>
          {agendamento.procedimentos && agendamento.procedimentos.length > 0 && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {agendamento.procedimentos.map((p) => p.nome).join(", ")}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
