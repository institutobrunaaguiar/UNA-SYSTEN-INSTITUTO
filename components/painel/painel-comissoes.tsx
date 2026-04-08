// components/painel/painel-comissoes.tsx
"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { TrendingUp, Target } from "lucide-react"

interface Comissao {
  id: number
  profissional_nome: string
  procedimento_nome: string
  valor_base: number
  percentual: number
  valor_comissao: number
  status: "pendente" | "em_validacao" | "aprovado" | "pago"
  periodo_referencia: string
  created_at: string
}

interface Meta {
  id: number
  nome: string
  tipo: "individual" | "coletiva"
  profissional_nome: string | null
  valor_meta: number
  valor_atingido: number
  periodo: string
  bonus_percentual: number | null
  ativo: boolean
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

const currentPeriod = (() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
})()

export function PainelComissoes() {
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase()

        const [{ data: comissoesData, error: erroComissoes }, { data: metasData, error: erroMetas }] =
          await Promise.all([
            supabase
              .from("comissoes")
              .select(
                "id, profissional_nome, procedimento_nome, valor_base, percentual, valor_comissao, status, periodo_referencia, created_at"
              )
              .eq("periodo_referencia", currentPeriod),
            supabase
              .from("metas")
              .select(
                "id, nome, tipo, profissional_nome, valor_meta, valor_atingido, periodo, bonus_percentual, ativo"
              )
              .eq("periodo", currentPeriod)
              .eq("ativo", true),
          ])

        if (erroComissoes || erroMetas) {
          console.error("[painel-comissoes] erro Supabase:", erroComissoes ?? erroMetas)
          setError(true)
          return
        }

        setComissoes((comissoesData as Comissao[]) || [])
        setMetas((metasData as Meta[]) || [])
      } catch (e) {
        console.error("[painel-comissoes] erro ao buscar dados:", e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <p className="text-xs text-destructive text-center py-6">
        Erro ao carregar comissões. Tente recarregar a página.
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

  // KPI calculations
  const totalComissoes = comissoes.reduce((s, c) => s + c.valor_comissao, 0)
  const countPendentes = comissoes.filter((c) => c.status === "pendente").length
  const countAprovadas = comissoes.filter((c) => c.status === "aprovado" || c.status === "pago").length
  const totalAPagar = comissoes
    .filter((c) => c.status === "aprovado")
    .reduce((s, c) => s + c.valor_comissao, 0)

  // Top comissões by profissional
  const rankingMap = new Map<string, number>()
  comissoes.forEach((c) => {
    rankingMap.set(c.profissional_nome, (rankingMap.get(c.profissional_nome) || 0) + c.valor_comissao)
  })
  const topProfissionais = Array.from(rankingMap.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)

  const maxValor = topProfissionais.length > 0 ? topProfissionais[0].valor : 1

  // Metas (up to 5)
  const metasVisiveis = metas.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-border rounded-xl bg-white p-4 space-y-1">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Total Comissões</p>
          <p className="text-2xl font-bold text-foreground">{formatBRL(totalComissoes)}</p>
          <p className="text-xs text-muted-foreground">no período</p>
        </div>

        <div className="border border-border rounded-xl bg-white p-4 space-y-1">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Pendentes</p>
          <p className="text-2xl font-bold text-foreground">{countPendentes}</p>
          <p className="text-xs text-muted-foreground">aguardando</p>
        </div>

        <div className="border border-border rounded-xl bg-white p-4 space-y-1">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Aprovadas</p>
          <p className="text-2xl font-bold text-foreground">{countAprovadas}</p>
          <p className="text-xs text-muted-foreground">este mês</p>
        </div>

        <div className="border border-border rounded-xl bg-white p-4 space-y-1">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">A Pagar</p>
          <p className="text-2xl font-bold text-foreground">{formatBRL(totalAPagar)}</p>
          <p className="text-xs text-muted-foreground">aprovadas</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left — Top Comissões */}
        <Card className="p-5 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Top Comissões</p>
          </div>

          {topProfissionais.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma comissão registrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProfissionais.map((prof) => {
                const pct = Math.round((prof.valor / maxValor) * 100)
                return (
                  <div key={prof.nome} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground truncate max-w-[60%]">{prof.nome}</span>
                      <span className="text-xs font-semibold text-foreground shrink-0 ml-2">
                        {formatBRL(prof.valor)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Right — Metas do Período */}
        <Card className="p-5 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Metas do Período</p>
          </div>

          {metasVisiveis.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma meta ativa.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {metasVisiveis.map((meta) => {
                const pct = Math.min(
                  meta.valor_meta > 0
                    ? Math.round((meta.valor_atingido / meta.valor_meta) * 100)
                    : 0,
                  100
                )
                const isComplete = pct >= 100
                return (
                  <div key={meta.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-foreground truncate">{meta.nome}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                          meta.tipo === "individual"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {meta.tipo === "individual" ? "Individual" : "Coletiva"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className={`h-1.5 rounded-full ${isComplete ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {formatBRL(meta.valor_atingido)} / {formatBRL(meta.valor_meta)}
                      </span>
                      {meta.bonus_percentual != null && (
                        <span className="text-[10px] text-muted-foreground">
                          Bônus: {meta.bonus_percentual}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
