"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/context/user-context"
import { Card } from "@/components/ui/card"
import {
  CheckCircle2,
  XCircle,
  Wallet,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
} from "lucide-react"
import type { Proposta } from "@/components/propostas/types"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function getMesKey(dateStr: string | null): string {
  if (!dateStr) return "sem_data"
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getMesLabel(key: string): string {
  if (key === "sem_data") return "Sem data"
  const [ano, mes] = key.split("-")
  return `${MESES[parseInt(mes) - 1]} ${ano}`
}

interface MesPeriodo {
  key: string
  label: string
  aprovadas: Proposta[]
  reprovadas: Proposta[]
  totalAprovado: number
  totalReprovado: number
}

function PropostaCard({ proposta, tipo }: { proposta: Proposta; tipo: "aprovada" | "reprovada" }) {
  const isReprovada = tipo === "reprovada"
  const procedimentos = proposta.itens.map((i) => i.procedimentoNome).join(", ")

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isReprovada ? "bg-destructive/10" : "bg-green-500/10"
      }`}>
        {isReprovada
          ? <XCircle className="w-4 h-4 text-destructive" />
          : <CheckCircle2 className="w-4 h-4 text-green-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{proposta.nome_cliente}</p>
        {proposta.cpf_cliente && (
          <p className="text-[10px] text-muted-foreground">{proposta.cpf_cliente}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{procedimentos || "—"}</p>

        {isReprovada && proposta.validacao_motivo && (
          <div className="flex items-start gap-1.5 mt-2 bg-destructive/5 border border-destructive/20 rounded-lg px-2.5 py-2">
            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-0.5">
                Motivo da reprovação
              </p>
              <p className="text-xs text-destructive/80 leading-snug">{proposta.validacao_motivo}</p>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-1.5">
          {isReprovada ? "Reprovada" : "Aprovada"} em {formatDate(proposta.validado_em)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${isReprovada ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {formatBRL(proposta.valor_total)}
        </p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          isReprovada
            ? "bg-destructive/10 text-destructive"
            : "bg-green-500/10 text-green-600"
        }`}>
          {isReprovada ? "Reprovada" : "Aprovada"}
        </span>
      </div>
    </div>
  )
}

function MesCard({ mes }: { mes: MesPeriodo }) {
  const [expanded, setExpanded] = useState(true)
  const total = mes.aprovadas.length + mes.reprovadas.length

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left active:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{mes.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total} {total === 1 ? "proposta" : "propostas"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold text-foreground">{formatBRL(mes.totalAprovado)}</p>
            <p className="text-[10px] text-muted-foreground">aprovado</p>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Chips de resumo */}
      <div className="flex gap-2 px-4 pb-3 flex-wrap">
        {mes.aprovadas.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-700 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            {mes.aprovadas.length} aprovada{mes.aprovadas.length > 1 ? "s" : ""}
            {" · "}{formatBRL(mes.totalAprovado)}
          </span>
        )}
        {mes.reprovadas.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="w-3 h-3" />
            {mes.reprovadas.length} reprovada{mes.reprovadas.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {expanded && (
        <div className="px-4 border-t border-border">
          {mes.aprovadas.map((p) => (
            <PropostaCard key={`a-${p.id}`} proposta={p} tipo="aprovada" />
          ))}
          {mes.reprovadas.map((p) => (
            <PropostaCard key={`r-${p.id}`} proposta={p} tipo="reprovada" />
          ))}
        </div>
      )}
    </Card>
  )
}

export function MinhasComissoesContent() {
  useUser() // mantém contexto de autenticação ativo
  const [aprovadas, setAprovadas] = useState<Proposta[]>([])
  const [reprovadas, setReprovadas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = getSupabase()
      const [aprovadasRes, reprovadasRes] = await Promise.all([
        supabase
          .from("propostas")
          .select("id, valor_total, status, created_at, nome_cliente, cpf_cliente, itens, data_proposta, validacao_status, validacao_motivo, validado_em")
          .eq("validacao_status", "aprovada")
          .order("validado_em", { ascending: false }),
        supabase
          .from("propostas")
          .select("id, valor_total, status, created_at, nome_cliente, cpf_cliente, itens, data_proposta, validacao_status, validacao_motivo, validado_em")
          .eq("validacao_status", "reprovada")
          .order("validado_em", { ascending: false }),
      ])

      setAprovadas((aprovadasRes.data ?? []) as Proposta[])
      setReprovadas((reprovadasRes.data ?? []) as Proposta[])
    } catch (e) {
      console.error("[minhas-comissoes] erro:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Agrupa por mês baseado em validado_em
  const periodos = useMemo((): MesPeriodo[] => {
    const map = new Map<string, { aprovadas: Proposta[]; reprovadas: Proposta[] }>()

    const ensureMes = (key: string) => {
      if (!map.has(key)) map.set(key, { aprovadas: [], reprovadas: [] })
    }

    aprovadas.forEach((p) => {
      const key = getMesKey(p.data_proposta)
      ensureMes(key)
      map.get(key)!.aprovadas.push(p)
    })

    reprovadas.forEach((p) => {
      const key = getMesKey(p.data_proposta)
      ensureMes(key)
      map.get(key)!.reprovadas.push(p)
    })

    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a)) // mais recente primeiro
      .map(([key, data]) => ({
        key,
        label: getMesLabel(key),
        aprovadas: data.aprovadas,
        reprovadas: data.reprovadas,
        totalAprovado: data.aprovadas.reduce((s, p) => s + p.valor_total, 0),
        totalReprovado: data.reprovadas.reduce((s, p) => s + p.valor_total, 0),
      }))
  }, [aprovadas, reprovadas])

  const totalAprovado = useMemo(() => aprovadas.reduce((s, p) => s + p.valor_total, 0), [aprovadas])
  const totalReprovado = useMemo(() => reprovadas.reduce((s, p) => s + p.valor_total, 0), [reprovadas])

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
        <p className="text-sm font-medium text-muted-foreground">Nenhuma proposta validada</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
          Suas propostas aprovadas e reprovadas pelo administrador aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase text-muted-foreground tracking-wider leading-tight">
            Total Aprovado
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight">{formatBRL(totalAprovado)}</p>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <p className="text-[10px] text-green-600 font-medium">{aprovadas.length} propost{aprovadas.length === 1 ? "a" : "as"}</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase text-muted-foreground tracking-wider leading-tight">
            Reprovado
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight">{formatBRL(totalReprovado)}</p>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-destructive" />
            <p className="text-[10px] text-destructive font-medium">{reprovadas.length} propost{reprovadas.length === 1 ? "a" : "as"}</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase text-muted-foreground tracking-wider leading-tight">
            Total Geral
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight">
            {aprovadas.length + reprovadas.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">validações</p>
        </Card>
      </div>

      {/* Períodos */}
      <div className="space-y-3">
        {periodos.map((mes) => (
          <MesCard key={mes.key} mes={mes} />
        ))}
      </div>
    </div>
  )
}
