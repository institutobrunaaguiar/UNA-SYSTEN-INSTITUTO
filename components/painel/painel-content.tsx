// components/painel/painel-content.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { PainelKpis, type PainelKpisData } from "./painel-kpis"
import { PainelChart, type MesData } from "./painel-chart"
import { PainelPipeline, type PainelPipelineData } from "./painel-pipeline"
import { PainelRankings } from "./painel-rankings"
import { PainelRecentes } from "./painel-recentes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PropostaItem {
  procedimentoNome: string
  profissionalNome: string
  valor_final: number
}

interface PropostaRaw {
  id: number
  valor_total: number
  status: string
  created_at: string
  updated_at: string
  nome_cliente: string
  itens: PropostaItem[]
  data_proposta: string
}

const MESES_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function startOfYear() {
  const d = new Date()
  return new Date(d.getFullYear(), 0, 1).toISOString()
}

function endOfYear() {
  const d = new Date()
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59).toISOString()
}

function computeKpis(propostas: PropostaRaw[]): PainelKpisData {
  const now = new Date()
  const mesAtual = now.getMonth()
  const anoAtual = now.getFullYear()
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1
  const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual

  const pagas = propostas.filter((p) => p.status === "pago")
  const pagasMes = pagas.filter((p) => {
    const d = new Date(p.updated_at)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
  })
  const pagasMesAnterior = pagas.filter((p) => {
    const d = new Date(p.updated_at)
    return d.getMonth() === mesAnterior && d.getFullYear() === anoMesAnterior
  })
  const aReceber = propostas.filter((p) => p.status === "aguardando_pagamento")
  const totalNaoPerdidas = propostas.filter((p) => p.status !== "recusada")

  const recebidoMes = pagasMes.reduce((s, p) => s + p.valor_total, 0)
  const recebidoMesAnterior = pagasMesAnterior.reduce((s, p) => s + p.valor_total, 0)
  const aReceberValor = aReceber.reduce((s, p) => s + p.valor_total, 0)
  const ticketMedio = pagasMes.length > 0 ? recebidoMes / pagasMes.length : 0
  const conversao = totalNaoPerdidas.length > 0 ? (pagas.length / totalNaoPerdidas.length) * 100 : 0

  const propostasMes = propostas.filter((p) => {
    const d = new Date(p.created_at)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
  }).length

  return {
    recebidoMes,
    recebidoMesAnterior,
    aReceber: aReceberValor,
    aReceberCount: aReceber.length,
    ticketMedio,
    totalPropostasPagas: pagasMes.length,
    conversao,
    propostasMes,
  }
}

function computeChart(propostas: PropostaRaw[]): MesData[] {
  const now = new Date()
  const mesAtual = now.getMonth()

  return MESES_LABELS.map((mes, idx) => {
    if (idx < mesAtual) {
      const valor = propostas
        .filter((p) => {
          const d = new Date(p.updated_at)
          return p.status === "pago" && d.getMonth() === idx
        })
        .reduce((s, p) => s + p.valor_total, 0)
      return { mes, recebido: valor, previsao: null }
    }
    if (idx === mesAtual) {
      const realizado = propostas
        .filter((p) => {
          const d = new Date(p.updated_at)
          return p.status === "pago" && d.getMonth() === idx
        })
        .reduce((s, p) => s + p.valor_total, 0)
      const previsao = propostas
        .filter((p) => {
          const d = new Date(p.created_at)
          return ["em_negociacao", "aguardando_pagamento"].includes(p.status) && d.getMonth() === idx
        })
        .reduce((s, p) => s + p.valor_total, 0)
      return { mes, recebido: realizado, previsao: realizado + previsao }
    }
    const previsao = propostas
      .filter((p) => {
        const d = new Date(p.created_at)
        return ["em_negociacao", "aguardando_pagamento"].includes(p.status) && d.getMonth() === idx
      })
      .reduce((s, p) => s + p.valor_total, 0)
    return { mes, recebido: null, previsao: previsao > 0 ? previsao : null }
  })
}

function computePipeline(propostas: PropostaRaw[]): PainelPipelineData {
  const ganhas = propostas.filter((p) => p.status === "pago")
  const emAberto = propostas.filter((p) => ["em_negociacao", "aguardando_pagamento"].includes(p.status))
  const perdidas = propostas.filter((p) => p.status === "recusada")

  return {
    ganhas: { count: ganhas.length, valor: ganhas.reduce((s, p) => s + p.valor_total, 0) },
    emAberto: { count: emAberto.length, valor: emAberto.reduce((s, p) => s + p.valor_total, 0) },
    perdidas: { count: perdidas.length, valor: perdidas.reduce((s, p) => s + p.valor_total, 0) },
  }
}

export interface RankingProfissional {
  nome: string
  iniciais: string
  valor: number
}

export interface RankingProcedimento {
  nome: string
  count: number
  valor: number
}

export interface PropostaRecente {
  id: number
  nomeCliente: string
  procedimentos: string
  valorTotal: number
  status: string
}

function computeRankingProfissionais(propostas: PropostaRaw[]): RankingProfissional[] {
  const pagas = propostas.filter((p) => p.status === "pago")
  const map = new Map<string, number>()
  pagas.forEach((p) => {
    p.itens.forEach((item) => {
      if (!item.profissionalNome) return
      map.set(item.profissionalNome, (map.get(item.profissionalNome) || 0) + item.valor_final)
    })
  })
  return Array.from(map.entries())
    .map(([nome, valor]) => ({
      nome,
      iniciais: nome.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      valor,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3)
}

function computeRankingProcedimentos(propostas: PropostaRaw[]): RankingProcedimento[] {
  const pagas = propostas.filter((p) => p.status === "pago")
  const mapValor = new Map<string, number>()
  const mapCount = new Map<string, number>()
  pagas.forEach((p) => {
    p.itens.forEach((item) => {
      if (!item.procedimentoNome) return
      mapValor.set(item.procedimentoNome, (mapValor.get(item.procedimentoNome) || 0) + item.valor_final)
      mapCount.set(item.procedimentoNome, (mapCount.get(item.procedimentoNome) || 0) + 1)
    })
  })
  return Array.from(mapValor.entries())
    .map(([nome, valor]) => ({ nome, count: mapCount.get(nome) || 0, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3)
}

function getPropostasRecentes(propostas: PropostaRaw[]): PropostaRecente[] {
  return [...propostas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      nomeCliente: p.nome_cliente,
      procedimentos: p.itens.map((i) => i.procedimentoNome).join(", "),
      valorTotal: p.valor_total,
      status: p.status,
    }))
}

type Periodo = "este_mes" | "mes_passado" | "trimestre" | "ano"

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "este_mes", label: "Este mês" },
  { value: "mes_passado", label: "Mês passado" },
  { value: "trimestre", label: "Último trimestre" },
  { value: "ano", label: "Este ano" },
]

function getDateRange(periodo: Periodo): { start: Date; end: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (periodo) {
    case "este_mes":
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) }
    case "mes_passado":
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
    case "trimestre":
      return { start: new Date(y, m - 2, 1), end: new Date(y, m + 1, 0, 23, 59, 59) }
    case "ano":
    default:
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) }
  }
}

function filterByPeriodo(propostas: PropostaRaw[], periodo: Periodo): PropostaRaw[] {
  if (periodo === "ano") return propostas
  const { start, end } = getDateRange(periodo)
  return propostas.filter((p) => {
    const d = new Date(p.created_at)
    return d >= start && d <= end
  })
}

export function PainelContent() {
  const [propostas, setPropostas] = useState<PropostaRaw[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>("ano")

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase()
        const { data } = await supabase
          .from("propostas")
          .select("id, valor_total, status, created_at, updated_at, nome_cliente, itens, data_proposta")
          .gte("created_at", startOfYear())
          .lte("created_at", endOfYear())
        if (data) setPropostas(data as PropostaRaw[])
      } catch (e) {
        console.error("[painel] erro ao buscar propostas:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const filtered = filterByPeriodo(propostas, periodo)
  const kpisData = computeKpis(filtered)
  const chartData = computeChart(filtered)
  const pipelineData = computePipeline(filtered)
  const rankingProfissionais = computeRankingProfissionais(filtered)
  const rankingProcedimentos = computeRankingProcedimentos(filtered)
  const propostasRecentes = getPropostasRecentes(filtered)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-[180px] bg-white border border-border rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <PainelKpis data={kpisData} />
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <PainelChart dados={chartData} />
        <PainelRankings profissionais={rankingProfissionais} procedimentos={rankingProcedimentos} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PainelPipeline data={pipelineData} />
        <PainelRecentes propostas={propostasRecentes} />
      </div>
    </div>
  )
}
