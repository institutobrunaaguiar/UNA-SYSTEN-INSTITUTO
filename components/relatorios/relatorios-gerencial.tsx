"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  CheckCircle,
  Receipt,
  Users,
  Stethoscope,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
} from "lucide-react"
import type { RelatorioFilters } from "./relatorios-filters"
import type { Proposta, PropostaItem } from "@/components/propostas/types"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

const MESES_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

interface RelatoriosGerencialProps {
  filters: RelatorioFilters
}

export function RelatoriosGerencial({ filters }: RelatoriosGerencialProps) {
  const [propostasPagas, setPropostasPagas] = useState<Proposta[]>([])
  const [totalPropostas, setTotalPropostas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = getSupabase()

      // Fetch all propostas for conversion rate
      let allQuery = supabase.from("propostas").select("id, status", { count: "exact" })

      if (filters.dataInicial) {
        allQuery = allQuery.gte("created_at", `${filters.dataInicial}T00:00:00`)
      }
      if (filters.dataFinal) {
        allQuery = allQuery.lte("created_at", `${filters.dataFinal}T23:59:59`)
      }

      const allRes = await allQuery
      setTotalPropostas(allRes.count ?? 0)

      // Fetch paid propostas with full data
      let pagasQuery = supabase
        .from("propostas")
        .select("*")
        .eq("status", "pago")
        .order("created_at", { ascending: false })

      if (filters.dataInicial) {
        pagasQuery = pagasQuery.gte("created_at", `${filters.dataInicial}T00:00:00`)
      }
      if (filters.dataFinal) {
        pagasQuery = pagasQuery.lte("created_at", `${filters.dataFinal}T23:59:59`)
      }

      const pagasRes = await pagasQuery
      setPropostasPagas((pagasRes.data as Proposta[]) ?? [])
      setLoading(false)
    }

    fetchData()
  }, [filters.dataInicial, filters.dataFinal])

  // Apply profissional/procedimento filters client-side on itens
  const filteredPropostas = useMemo(() => {
    let result = propostasPagas

    if (filters.profissional) {
      result = result.filter((p) => {
        const itens: PropostaItem[] = Array.isArray(p.itens) ? p.itens : []
        return itens.some((item) => item.profissionalNome === filters.profissional)
      })
    }

    if (filters.procedimento) {
      result = result.filter((p) => {
        const itens: PropostaItem[] = Array.isArray(p.itens) ? p.itens : []
        return itens.some((item) => item.procedimentoNome === filters.procedimento)
      })
    }

    return result
  }, [propostasPagas, filters.profissional, filters.procedimento])

  // KPIs
  const kpis = useMemo(() => {
    const receitaTotal = filteredPropostas.reduce((sum, p) => sum + (p.valor_total ?? 0), 0)
    const fechamentos = filteredPropostas.length
    const ticketMedio = fechamentos > 0 ? receitaTotal / fechamentos : 0
    const pacientesUnicos = new Set(filteredPropostas.map((p) => p.paciente_id)).size

    const totalProcedimentos = filteredPropostas.reduce((sum, p) => {
      const itens: PropostaItem[] = Array.isArray(p.itens) ? p.itens : []
      return sum + itens.length
    }, 0)

    const taxaConversao = totalPropostas > 0 ? (propostasPagas.length / totalPropostas) * 100 : 0

    return [
      {
        title: "Receita Total",
        value: formatCurrency(receitaTotal),
        icon: DollarSign,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
      },
      {
        title: "Fechamentos",
        value: fechamentos.toString(),
        icon: CheckCircle,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
      },
      {
        title: "Ticket Medio",
        value: formatCurrency(ticketMedio),
        icon: Receipt,
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-500/10",
      },
      {
        title: "Pacientes Unicos",
        value: pacientesUnicos.toString(),
        icon: Users,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
      },
      {
        title: "Procedimentos",
        value: totalProcedimentos.toString(),
        icon: Stethoscope,
        color: "text-pink-600 dark:text-pink-400",
        bgColor: "bg-pink-500/10",
      },
      {
        title: "Taxa de Conversao",
        value: `${taxaConversao.toFixed(1)}%`,
        icon: TrendingUp,
        color: "text-teal-600 dark:text-teal-400",
        bgColor: "bg-teal-500/10",
      },
    ]
  }, [filteredPropostas, totalPropostas, propostasPagas.length])

  // Monthly revenue data for chart
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>()

    filteredPropostas.forEach((p) => {
      const date = new Date(p.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`
      monthMap.set(key, (monthMap.get(key) ?? 0) + (p.valor_total ?? 0))
    })

    const entries = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    // Show last 12 months or available data
    const last12 = entries.slice(-12)

    return last12.map(([key, value]) => {
      const [year, monthIdx] = key.split("-")
      return {
        label: `${MESES_LABELS[parseInt(monthIdx)]}/${year.slice(2)}`,
        value,
      }
    })
  }, [filteredPropostas])

  const maxMonthly = Math.max(...monthlyData.map((d) => d.value), 1)

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((kpi, index) => (
          <Card
            key={kpi.title}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ animationDelay: `${index * 80}ms` }}
            className={`bg-card text-foreground p-4 transition-all duration-500 ease-out animate-slide-in-up cursor-default ${
              hoveredCard === index ? "scale-[1.02] shadow-2xl" : "shadow-lg"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <h3 className="text-xs font-medium text-muted-foreground">{kpi.title}</h3>
              </div>
              <div
                className={`w-6 h-6 rounded-full bg-primary flex items-center justify-center transition-transform duration-300 ${
                  hoveredCard === index ? "rotate-45" : ""
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-primary/10 rounded-full">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Receita Mensal</h3>
        </div>

        {monthlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum dado disponivel para o periodo selecionado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthlyData.map((data, index) => (
              <div
                key={data.label}
                className="space-y-1.5 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-16">{data.label}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatCurrency(data.value)}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(data.value / maxMonthly) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
