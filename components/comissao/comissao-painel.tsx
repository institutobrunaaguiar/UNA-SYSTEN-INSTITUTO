"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import {
  Banknote, Clock, CheckCircle2, TrendingUp, DollarSign, ShieldCheck,
} from "lucide-react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Comissao {
  id: number
  profissional_nome: string
  valor_comissao: number
  status: "pendente" | "em_validacao" | "aprovado" | "pago"
  periodo_referencia: string // "YYYY-MM"
}

interface MesResumo {
  key: string       // "YYYY-MM"
  label: string     // "Abr 2026"
  total: number
  pago: number
  aprovado: number
  pendente: number
  em_validacao: number
  count: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v)
}

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

function mesLabel(key: string) {
  if (!key) return ""
  const [ano, mes] = key.split("-")
  return `${MESES_ABREV[parseInt(mes) - 1]} ${ano}`
}

// Tooltip customizado para o gráfico
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ComissaoPainel() {
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()

      // Busca últimos 12 meses
      const cutoff = new Date()
      cutoff.setMonth(cutoff.getMonth() - 11)
      const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`

      const { data, error } = await supabase
        .from("comissoes")
        .select("id, profissional_nome, valor_comissao, status, periodo_referencia")
        .gte("periodo_referencia", cutoffKey)
        .order("periodo_referencia", { ascending: false })

      if (error) {
        console.error("[comissao-painel]", error.message)
        return
      }

      setComissoes((data as Comissao[]) || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Agrupa por mês
  const meses = useMemo((): MesResumo[] => {
    const map = new Map<string, MesResumo>()

    for (const c of comissoes) {
      const key = c.periodo_referencia
      if (!map.has(key)) {
        map.set(key, { key, label: mesLabel(key), total: 0, pago: 0, aprovado: 0, pendente: 0, em_validacao: 0, count: 0 })
      }
      const m = map.get(key)!
      m.total += c.valor_comissao
      m.count++
      if (c.status === "pago") m.pago += c.valor_comissao
      else if (c.status === "aprovado") m.aprovado += c.valor_comissao
      else if (c.status === "pendente") m.pendente += c.valor_comissao
      else if (c.status === "em_validacao") m.em_validacao += c.valor_comissao
    }

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
  }, [comissoes])

  // KPIs globais
  const kpis = useMemo(() => ({
    total: comissoes.reduce((s, c) => s + c.valor_comissao, 0),
    pago: comissoes.filter((c) => c.status === "pago").reduce((s, c) => s + c.valor_comissao, 0),
    aprovado: comissoes.filter((c) => c.status === "aprovado").reduce((s, c) => s + c.valor_comissao, 0),
    pendente: comissoes.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor_comissao, 0),
    count: comissoes.length,
  }), [comissoes])

  // Dados para gráfico (últimos 6 meses)
  const chartData = useMemo(() =>
    meses.slice(-6).map((m) => ({
      name: m.label,
      Pago: Math.round(m.pago),
      Aprovado: Math.round(m.aprovado),
      Pendente: Math.round(m.pendente),
    }))
  , [meses])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{formatBRL(kpis.total)}</p>
          <p className="text-[10px] text-muted-foreground">{kpis.count} lançamentos</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-purple-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pago</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{formatBRL(kpis.pago)}</p>
          <p className="text-[10px] text-purple-500 font-medium">
            {kpis.total > 0 ? `${((kpis.pago / kpis.total) * 100).toFixed(0)}% do total` : "—"}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aprovado</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{formatBRL(kpis.aprovado)}</p>
          <p className="text-[10px] text-green-600 font-medium">Aguardando pagamento</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pendente</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{formatBRL(kpis.pendente)}</p>
          <p className="text-[10px] text-yellow-600 font-medium">Em análise</p>
        </Card>
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Comissões por Mês</p>
            <span className="text-xs text-muted-foreground ml-auto">últimos 6 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={2} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Pago" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Aprovado" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pendente" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {/* Legenda */}
          <div className="flex items-center gap-4 mt-2 justify-center flex-wrap">
            {[
              { color: "#a855f7", label: "Pago" },
              { color: "#22c55e", label: "Aprovado" },
              { color: "#eab308", label: "Pendente" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabela por mês */}
      {meses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
            Histórico por Mês
          </p>
          <div className="space-y-2">
            {[...meses].reverse().map((m) => (
              <Card key={m.key} className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground">{m.count} lançamento{m.count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-foreground">{formatBRL(m.total)}</p>
                    <div className="flex items-center gap-2 justify-end mt-0.5 flex-wrap">
                      {m.pago > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                          Pago {formatBRL(m.pago)}
                        </span>
                      )}
                      {m.aprovado > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">
                          Aprov. {formatBRL(m.aprovado)}
                        </span>
                      )}
                      {m.pendente > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
                          Pend. {formatBRL(m.pendente)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <Banknote className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma comissão registrada</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Use "Calcular Comissões" ou "Nova Comissão" para registrar.
          </p>
        </Card>
      )}
    </div>
  )
}
