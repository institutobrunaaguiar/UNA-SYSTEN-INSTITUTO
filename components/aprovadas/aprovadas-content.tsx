"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { AprovadasKpis } from "./aprovadas-kpis"
import { AprovadasFiltros } from "./aprovadas-filtros"
import { AprovadasLista } from "./aprovadas-lista"
import type { Proposta } from "@/components/propostas/types"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function getMesAnoAtual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export type TabValidacao = "aprovadas" | "reprovadas"

export interface FiltrosState {
  mesAno: string
  profissional: string
  procedimento: string
  faixaValor: string
  busca: string
}

export interface KpisData {
  totalAprovado: number
  quantidade: number
  ticketMedio: number
  topConsultora: { nome: string; valor: number } | null
  quantidadeReprovadas: number
}

export function AprovadasContent() {
  const [aprovadas, setAprovadas] = useState<Proposta[]>([])
  const [reprovadas, setReprovadas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabValidacao>("aprovadas")
  const [filtros, setFiltros] = useState<FiltrosState>({
    mesAno: getMesAnoAtual(),
    profissional: "todos",
    procedimento: "todos",
    faixaValor: "todas",
    busca: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase()
        const [aprovadasRes, reprovadasRes] = await Promise.all([
          supabase
            .from("propostas")
            .select("id, valor_total, status, created_at, updated_at, nome_cliente, cpf_cliente, itens, data_proposta, validacao_status, validacao_motivo, validado_em")
            .eq("validacao_status", "aprovada")
            .order("validado_em", { ascending: false }),
          supabase
            .from("propostas")
            .select("id, valor_total, status, created_at, updated_at, nome_cliente, cpf_cliente, itens, data_proposta, validacao_status, validacao_motivo, validado_em")
            .eq("validacao_status", "reprovada")
            .order("validado_em", { ascending: false }),
        ])
        if (aprovadasRes.data) setAprovadas(aprovadasRes.data as Proposta[])
        if (reprovadasRes.data) setReprovadas(reprovadasRes.data as Proposta[])
      } catch (e) {
        console.error("[aprovadas] erro ao buscar:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const propostas = tab === "aprovadas" ? aprovadas : reprovadas

  const profissionais = useMemo(() => {
    const set = new Set<string>()
    propostas.forEach((p) => p.itens.forEach((i) => { if (i.profissionalNome) set.add(i.profissionalNome) }))
    return Array.from(set).sort()
  }, [propostas])

  const procedimentos = useMemo(() => {
    const set = new Set<string>()
    propostas.forEach((p) => p.itens.forEach((i) => { if (i.procedimentoNome) set.add(i.procedimentoNome) }))
    return Array.from(set).sort()
  }, [propostas])

  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>()
    propostas.forEach((p) => {
      if (p.validado_em) {
        const d = new Date(p.validado_em)
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
      }
    })
    set.add(getMesAnoAtual())
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [ano, mes] = key.split("-")
        return { value: key, label: `${MESES[parseInt(mes) - 1]} ${ano}` }
      })
  }, [propostas])

  const filtered = useMemo(() => {
    return propostas.filter((p) => {
      if (filtros.mesAno && p.validado_em) {
        const d = new Date(p.validado_em)
        const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        if (mesAno !== filtros.mesAno) return false
      }
      if (filtros.profissional !== "todos") {
        const tem = p.itens.some((i) => i.profissionalNome === filtros.profissional)
        if (!tem) return false
      }
      if (filtros.procedimento !== "todos") {
        const tem = p.itens.some((i) => i.procedimentoNome === filtros.procedimento)
        if (!tem) return false
      }
      if (filtros.faixaValor !== "todas") {
        const v = p.valor_total
        switch (filtros.faixaValor) {
          case "ate_1000": if (v > 1000) return false; break
          case "1000_5000": if (v < 1000 || v > 5000) return false; break
          case "5000_10000": if (v < 5000 || v > 10000) return false; break
          case "acima_10000": if (v < 10000) return false; break
        }
      }
      if (filtros.busca) {
        if (!p.nome_cliente.toLowerCase().includes(filtros.busca.toLowerCase())) return false
      }
      return true
    })
  }, [propostas, filtros])

  const kpis = useMemo((): KpisData => {
    const aprovadasFiltradas = tab === "aprovadas" ? filtered : aprovadas
    const totalAprovado = aprovadasFiltradas.reduce((s, p) => s + p.valor_total, 0)
    const quantidade = aprovadasFiltradas.length
    const ticketMedio = quantidade > 0 ? totalAprovado / quantidade : 0
    const map = new Map<string, number>()
    aprovadasFiltradas.forEach((p) => {
      p.itens.forEach((i) => {
        if (!i.profissionalNome) return
        map.set(i.profissionalNome, (map.get(i.profissionalNome) || 0) + i.valor_final)
      })
    })
    let topConsultora: { nome: string; valor: number } | null = null
    map.forEach((valor, nome) => {
      if (!topConsultora || valor > topConsultora.valor) {
        topConsultora = { nome, valor }
      }
    })
    return { totalAprovado, quantidade, ticketMedio, topConsultora, quantidadeReprovadas: reprovadas.length }
  }, [filtered, aprovadas, reprovadas, tab])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AprovadasKpis data={kpis} />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("aprovadas")}
          className={[
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "aprovadas"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Aprovadas ({aprovadas.length})
        </button>
        <button
          onClick={() => setTab("reprovadas")}
          className={[
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "reprovadas"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Reprovadas ({reprovadas.length})
        </button>
      </div>

      <AprovadasFiltros
        filtros={filtros}
        onChange={setFiltros}
        meses={mesesDisponiveis}
        profissionais={profissionais}
        procedimentos={procedimentos}
      />
      <AprovadasLista propostas={filtered} tab={tab} />
    </div>
  )
}
