// components/painel/painel-content.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { PainelKpis, type PainelKpisData } from "./painel-kpis"
import { PainelChart, type MesData } from "./painel-chart"
import { PainelPipeline, type PainelPipelineData } from "./painel-pipeline"

interface PropostaRaw {
  valor_total: number
  status: string
  created_at: string
  updated_at: string
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
  const conversao = totalNaoPerdidas.length > 0 ? (pagasMes.length / totalNaoPerdidas.length) * 100 : 0

  return {
    recebidoMes,
    recebidoMesAnterior,
    aReceber: aReceberValor,
    aReceberCount: aReceber.length,
    ticketMedio,
    totalPropostas: pagasMes.length,
    conversao,
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

export function PainelContent() {
  const [propostas, setPropostas] = useState<PropostaRaw[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase()
        const { data } = await supabase
          .from("propostas")
          .select("valor_total, status, created_at, updated_at")
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

  const kpisData = computeKpis(propostas)
  const chartData = computeChart(propostas)
  const pipelineData = computePipeline(propostas)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <PainelKpis data={kpisData} />
        <PainelChart dados={chartData} />
      </div>
      <PainelPipeline data={pipelineData} />
    </div>
  )
}
