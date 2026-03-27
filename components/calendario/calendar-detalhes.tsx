"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Clock, MapPin, Stethoscope, FileText, Tag, Calendar } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { Agendamento, AgendaStatus } from "./types"
import { STATUS_CONFIG, ALL_STATUSES } from "./types"

interface CalendarDetalhesProps {
  agendamento: Agendamento | null
  open: boolean
  onClose: () => void
  onStatusChanged: () => void
}

export function CalendarDetalhes({ agendamento, open, onClose, onStatusChanged }: CalendarDetalhesProps) {
  if (!agendamento) return null

  const statusCfg = STATUS_CONFIG[agendamento.status] || STATUS_CONFIG.AGENDADO

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  async function handleStatusChange(newStatus: AgendaStatus) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from("agendas")
        .update({ status: newStatus })
        .eq("id", agendamento!.id)
      if (error) {
        console.error("[calendario] Erro ao alterar status:", error.message)
        return
      }
      onStatusChanged()
    } catch (error) {
      console.error("[calendario] Erro:", error)
    }
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            Agendamento #{agendamento.id}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="w-4 h-4 text-primary" />
              Paciente
            </div>
            <div className="pl-6 text-sm space-y-1">
              <p className="font-medium">{agendamento.nome_paciente || `#${agendamento.id_paciente}`}</p>
              {agendamento.email_paciente && (
                <p className="text-muted-foreground">{agendamento.email_paciente}</p>
              )}
              {agendamento.telefone_celular_paciente && (
                <p className="text-muted-foreground">{agendamento.telefone_celular_paciente}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              Horario
            </div>
            <div className="pl-6 text-sm space-y-1">
              <p className="font-medium capitalize">{formatDate(agendamento.data)}</p>
              <p className="text-muted-foreground">{agendamento.hora_inicio.slice(0, 5)} - {agendamento.hora_fim.slice(0, 5)}</p>
            </div>
          </div>

          {agendamento.nome_profissional && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Stethoscope className="w-4 h-4 text-primary" />
                Profissional
              </div>
              <p className="pl-6 text-sm font-medium">{agendamento.nome_profissional}</p>
            </div>
          )}

          {agendamento.nome_local && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Local
              </div>
              <p className="pl-6 text-sm font-medium">{agendamento.nome_local}</p>
            </div>
          )}

          {agendamento.nome_tipo_consulta && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                Tipo de Consulta
              </div>
              <p className="pl-6 text-sm font-medium">{agendamento.nome_tipo_consulta}</p>
            </div>
          )}

          {agendamento.nome_rotulo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Tag className="w-4 h-4 text-primary" />
                Rotulo
              </div>
              <div className="pl-6 flex items-center gap-2">
                {agendamento.cor_rotulo && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agendamento.cor_rotulo }} />
                )}
                <span className="text-sm font-medium">{agendamento.nome_rotulo}</span>
              </div>
            </div>
          )}

          {agendamento.procedimentos && agendamento.procedimentos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                Procedimentos ({agendamento.procedimentos.length})
              </div>
              <div className="pl-6 space-y-1">
                {agendamento.procedimentos.map((proc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                    <span className="font-medium">{proc.nome}</span>
                    <span className="text-muted-foreground">x{proc.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {agendamento.observacoes && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Observacoes</p>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{agendamento.observacoes}</p>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t border-border">
            <p className="text-sm font-semibold text-foreground">Alterar Status</p>
            <Select
              value={agendamento.status}
              onValueChange={(value) => handleStatusChange(value as AgendaStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
