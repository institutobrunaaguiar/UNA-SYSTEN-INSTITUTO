"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Eye, Clock, User, Stethoscope } from "lucide-react"
import type { Agendamento } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarPopoverProps {
  agendamento: Agendamento
  children: React.ReactNode
  onVerDetalhes: (agendamento: Agendamento) => void
}

export function CalendarPopover({ agendamento, children, onVerDetalhes }: CalendarPopoverProps) {
  const statusCfg = STATUS_CONFIG[agendamento.status] || STATUS_CONFIG.AGENDADO

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className="text-xs text-muted-foreground">#{agendamento.id}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{agendamento.hora_inicio.slice(0, 5)} - {agendamento.hora_fim.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{agendamento.nome_paciente || `Paciente #${agendamento.id_paciente}`}</span>
            </div>
            {agendamento.nome_profissional && (
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{agendamento.nome_profissional}</span>
              </div>
            )}
            {agendamento.nome_tipo_consulta && (
              <p className="text-xs text-muted-foreground ml-5">{agendamento.nome_tipo_consulta}</p>
            )}
          </div>

          <Button
            size="sm"
            className="w-full gap-2"
            onClick={() => onVerDetalhes(agendamento)}
          >
            <Eye className="w-3.5 h-3.5" />
            Ver detalhes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
