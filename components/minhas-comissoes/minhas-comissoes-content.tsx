"use client"

import { useEffect, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { useUser } from "@/context/user-context"
import { Card } from "@/components/ui/card"
import {
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Wallet,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react"

interface ComissaoRaw {
  id: number
  procedimento_nome: string
  valor_base: number
  percentual: number
  valor_comissao: number
  status: "pendente" | "em_validacao" | "aprovado" | "pago"
  periodo_referencia: string
  created_at: string
  proposta_id: number | null
  propostas: {
    nome_cliente: string
    validacao_status: "pendente" | "aprovada" | "reprovada" | null
    validacao_motivo: string | null
  } | null
}

interface ComissaoPeriodo {
  periodo: string          // "2025-04"
  label: string            // "Abril 2025"
  items: ComissaoRaw[]
  totalAprovado: number
  totalPendente: number
  totalReprovado: number
  countAprovado: number
  countPendente: number
  countReprovado: number
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

function periodoLabel(periodo: string) {
  const [ano, mes] = periodo.split("-")
  return `${MESES[parseInt(mes) - 1]} ${ano}`
}

function getStatusEfetivo(item: ComissaoRaw): "aprovado" | "pendente" | "reprovado" {
  if (item.propostas?.validacao_status === "reprovada") return "reprovado"
  if (item.status === "aprovado" || item.status === "pago") return "aprovado"
  return "pendente"
}

const STATUS_UI = {
  aprovado: {
    label: "Aprovada",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    iconClass: "text-green-500",
  },
  pendente: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    iconClass: "text-yellow-500",
  },
  reprovado: {
    label: "Reprovada",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
    iconClass: "text-destructive",
  },
}

function ComissaoCard({ item }: { item: ComissaoRaw }) {
  const status = getStatusEfetivo(item)
  const ui = STATUS_UI[status]
  const Icon = ui.icon

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ui.className} border`}>
        <Icon className={`w-4 h-4 ${ui.iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight truncate">
          {item.procedimento_nome || "Procedimento"}
        </p>
        {item.propostas?.nome_cliente && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.propostas.nome_cliente}
          </p>
        )}
        {status === "reprovado" && item.propostas?.validacao_motivo && (
          <div className="flex items-start gap-1.5 mt-1.5 bg-destructive/5 rounded-md px-2 py-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-[11px] text-destructive leading-snug">
              {item.propostas.validacao_motivo}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ui.className}`}>
            {ui.label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {item.percentual}% sobre {formatBRL(item.valor_base)}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${status === "reprovado" ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {formatBRL(item.valor_comissao)}
        </p>
        {status === "pago" && (
          <p className="text-[10px] text-green-600 font-medium">Pago</p>
        )}
      </div>
    </div>
  )
}

function PeriodoCard({ periodo }: { periodo: ComissaoPeriodo }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left active:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{periodo.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {periodo.items.length} {periodo.items.length === 1 ? "comissão" : "comissões"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold text-foreground">{formatBRL(periodo.totalAprovado)}</p>
            <p className="text-[10px] text-muted-foreground">aprovado</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Summary chips */}
      <div className="flex gap-2 px-4 pb-3 flex-wrap">
        {periodo.countAprovado > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-700 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            {periodo.countAprovado} aprovada{periodo.countAprovado > 1 ? "s" : ""}
            {" · "}
            {formatBRL(periodo.totalAprovado)}
          </span>
        )}
        {periodo.countPendente > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
            <Clock className="w-3 h-3" />
            {periodo.countPendente} pendente{periodo.countPendente > 1 ? "s" : ""}
            {" · "}
            {formatBRL(periodo.totalPendente)}
          </span>
        )}
        {periodo.countReprovado > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="w-3 h-3" />
            {periodo.countReprovado} reprovada{periodo.countReprovado > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Items */}
      {expanded && (
        <div className="px-4 border-t border-border">
          {periodo.items.map((item) => (
            <ComissaoCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  )
}

export function MinhasComissoesContent() {
  const { user } = useUser()
  const [periodos, setPeriodos] = useState<ComissaoPeriodo[]>([])
  const [loading, setLoading] = useState(true)
  const [totalGeral, setTotalGeral] = useState(0)
  const [totalPendente, setTotalPendente] = useState(0)
  const [totalReprovado, setTotalReprovado] = useState(0)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("comissoes")
        .select(`
          id, procedimento_nome, valor_base, percentual, valor_comissao,
          status, periodo_referencia, created_at, proposta_id,
          propostas!proposta_id(nome_cliente, validacao_status, validacao_motivo)
        `)
        .eq("profissional_id", user.id)
        .order("periodo_referencia", { ascending: false })

      if (error) throw error

      const items = (data ?? []) as ComissaoRaw[]

      // Group by periodo_referencia
      const map = new Map<string, ComissaoRaw[]>()
      items.forEach((item) => {
        const p = item.periodo_referencia ?? "sem_periodo"
        if (!map.has(p)) map.set(p, [])
        map.get(p)!.push(item)
      })

      let sumAprovado = 0
      let sumPendente = 0
      let sumReprovado = 0

      const result: ComissaoPeriodo[] = Array.from(map.entries()).map(([periodo, list]) => {
        const aprovados = list.filter((i) => getStatusEfetivo(i) === "aprovado")
        const pendentes = list.filter((i) => getStatusEfetivo(i) === "pendente")
        const reprovados = list.filter((i) => getStatusEfetivo(i) === "reprovado")

        const tA = aprovados.reduce((s, i) => s + i.valor_comissao, 0)
        const tP = pendentes.reduce((s, i) => s + i.valor_comissao, 0)
        const tR = reprovados.reduce((s, i) => s + i.valor_comissao, 0)

        sumAprovado += tA
        sumPendente += tP
        sumReprovado += tR

        return {
          periodo,
          label: periodoLabel(periodo),
          items: list,
          totalAprovado: tA,
          totalPendente: tP,
          totalReprovado: tR,
          countAprovado: aprovados.length,
          countPendente: pendentes.length,
          countReprovado: reprovados.length,
        }
      })

      setPeriodos(result)
      setTotalGeral(sumAprovado)
      setTotalPendente(sumPendente)
      setTotalReprovado(sumReprovado)
    } catch (e) {
      console.error("[minhas-comissoes] erro:", e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (periodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Wallet className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Nenhuma comissão registrada</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Suas comissões aparecerão aqui quando forem calculadas pelo administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase text-muted-foreground tracking-wider leading-tight">
            Total Aprovado
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight">{formatBRL(totalGeral)}</p>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <p className="text-[10px] text-green-600 font-medium">aprovadas</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase text-muted-foreground tracking-wider leading-tight">
            Pendente
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight">{formatBRL(totalPendente)}</p>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-500" />
            <p className="text-[10px] text-yellow-600 font-medium">em análise</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase text-muted-foreground tracking-wider leading-tight">
            Reprovado
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight">{formatBRL(totalReprovado)}</p>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-destructive" />
            <p className="text-[10px] text-destructive font-medium">reprovadas</p>
          </div>
        </Card>
      </div>

      {/* Period cards */}
      <div className="space-y-3">
        {periodos.map((periodo) => (
          <PeriodoCard key={periodo.periodo} periodo={periodo} />
        ))}
      </div>
    </div>
  )
}
