// components/painel/painel-agenda.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Calendar } from "lucide-react"

interface AgendaCompleta {
  id: number
  data_agenda: string
  hora_inicio: string
  hora_fim: string
  profissional: string
  local_agenda: string | null
  rotulo: string | null
  tipo_consulta: string | null
  status_agenda: string
  observacoes: string | null
}

interface AgendaMes {
  id: number
  data: string
  status: string
}

interface AgendaKpis {
  hoje: number
  confirmados: number
  canceladosMes: number
  comparecimento: string
}

function getToday(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const start = new Date(y, m, 1).toISOString().split("T")[0]
  const end = new Date(y, m + 1, 0).toISOString().split("T")[0]
  return { start, end }
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  AGENDADO: { label: "Agendado", className: "bg-blue-100 text-blue-700" },
  CONFIRMADO: { label: "Confirmado", className: "bg-green-100 text-green-700" },
  CONFIRMADO_PACIENTE: { label: "Conf. Paciente", className: "bg-green-100 text-green-700" },
  CANCELADO: { label: "Cancelado", className: "bg-red-100 text-red-700" },
  CANCELADO_PACIENTE: { label: "Canc. Paciente", className: "bg-red-100 text-red-700" },
  EM_ESPERA: { label: "Em Espera", className: "bg-yellow-100 text-yellow-700" },
  EM_ANDAMENTO: { label: "Em Andamento", className: "bg-orange-100 text-orange-700" },
  PRE_ATENDIMENTO: { label: "Pré-Atend.", className: "bg-muted text-muted-foreground" },
  PAGAMENTO: { label: "Pagamento", className: "bg-muted text-muted-foreground" },
  FINALIZADO: { label: "Finalizado", className: "bg-teal-100 text-teal-700" },
  FALTOU: { label: "Faltou", className: "bg-gray-100 text-gray-700" },
  REMARCOU: { label: "Remarcou", className: "bg-sky-100 text-sky-700" },
}

function formatHora(hora: string): string {
  if (!hora) return ""
  return hora.slice(0, 5)
}

function computeKpis(agendaHoje: AgendaCompleta[], agendaMes: AgendaMes[]): AgendaKpis {
  const hoje = agendaHoje.length

  const confirmados = agendaHoje.filter((a) =>
    ["CONFIRMADO", "CONFIRMADO_PACIENTE"].includes(a.status_agenda)
  ).length

  const canceladosMes = agendaMes.filter((a) =>
    ["CANCELADO", "CANCELADO_PACIENTE"].includes(a.status)
  ).length

  const finalizados = agendaMes.filter((a) => a.status === "FINALIZADO").length
  const faltou = agendaMes.filter((a) => a.status === "FALTOU").length
  const total = finalizados + faltou
  const comparecimento = total > 0 ? `${Math.round((finalizados / total) * 100)}%` : "—"

  return { hoje, confirmados, canceladosMes, comparecimento }
}

export function PainelAgenda() {
  const [agendaHoje, setAgendaHoje] = useState<AgendaCompleta[]>([])
  const [kpis, setKpis] = useState<AgendaKpis>({ hoje: 0, confirmados: 0, canceladosMes: 0, comparecimento: "—" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase()
        const today = getToday()
        const { start, end } = getMonthRange()

        const [{ data: hojeData, error: erroHoje }, { data: mesData, error: erroMes }] = await Promise.all([
          supabase
            .from("agenda_completa")
            .select("id, data_agenda, hora_inicio, hora_fim, profissional, local_agenda, rotulo, tipo_consulta, status_agenda, observacoes")
            .eq("data_agenda", today)
            .order("hora_inicio", { ascending: true }),
          supabase
            .from("agendas")
            .select("id, data, status")
            .gte("data", start)
            .lte("data", end),
        ])

        if (erroHoje || erroMes) {
          console.error("[painel-agenda] erro Supabase:", erroHoje ?? erroMes)
          setError(true)
          return
        }

        const agenda: AgendaCompleta[] = (hojeData as AgendaCompleta[]) || []
        const mes: AgendaMes[] = (mesData as AgendaMes[]) || []

        setAgendaHoje(agenda)
        setKpis(computeKpis(agenda, mes))
      } catch (e) {
        console.error("[painel-agenda] erro ao buscar agenda:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <p className="text-xs text-destructive text-center py-6">
        Erro ao carregar agenda. Tente recarregar a página.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const agendaVisiveis = agendaHoje.slice(0, 8)
  const temMais = agendaHoje.length > 8

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-border rounded-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hoje</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{kpis.hoje}</p>
          <p className="text-[11px] text-muted-foreground mt-1">agendamentos</p>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Confirmados</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{kpis.confirmados}</p>
          <p className="text-[11px] text-muted-foreground mt-1">hoje</p>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Cancelados</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{kpis.canceladosMes}</p>
          <p className="text-[11px] text-muted-foreground mt-1">este mês</p>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Comparecimento</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{kpis.comparecimento}</p>
          <p className="text-[11px] text-muted-foreground mt-1">finalizados / total</p>
        </Card>
      </div>

      <Card className="p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Agenda de Hoje</p>
          </div>
        </div>

        {agendaVisiveis.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhum agendamento para hoje.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {agendaVisiveis.map((a) => {
              const badge = STATUS_BADGE[a.status_agenda] || { label: a.status_agenda, className: "bg-muted text-muted-foreground" }
              return (
                <div key={a.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-mono font-medium text-foreground shrink-0 w-10">
                      {formatHora(a.hora_inicio)}
                    </span>
                    <span className="text-xs text-foreground truncate">
                      {a.profissional || "—"}
                    </span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block shrink-0 ml-3 ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {temMais && (
          <div className="mt-3 pt-3 border-t border-border">
            <Link href="/calendario" className="text-[11px] text-blue-500 hover:underline">
              Ver todos no Calendário →
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
