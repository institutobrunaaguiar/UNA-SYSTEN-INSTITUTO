# Painel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar o painel com visual clean/minimalista, gráfico de barras, e novas seções de rankings e propostas recentes.

**Architecture:** Reescrever os 4 componentes existentes do painel (content, kpis, chart, pipeline) e criar 2 novos (rankings, recentes). A query do Supabase é expandida para incluir `itens` e `nome_cliente`. Todas as computações acontecem no `painel-content.tsx` (orquestrador) que passa dados processados para os filhos.

**Tech Stack:** Next.js 14, TypeScript, Recharts (BarChart), Supabase JS, shadcn/ui Card, Tailwind CSS

---

### Task 1: Expandir query e adicionar interfaces no painel-content

**Files:**
- Modify: `components/painel/painel-content.tsx`

- [ ] **Step 1: Atualizar a interface PropostaRaw para incluir os novos campos**

No topo do arquivo, substituir a interface existente:

```ts
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
```

- [ ] **Step 2: Expandir a query do Supabase**

Substituir a query dentro de `fetchData`:

```ts
const { data } = await supabase
  .from("propostas")
  .select("id, valor_total, status, created_at, updated_at, nome_cliente, itens, data_proposta")
  .gte("created_at", startOfYear())
  .lte("created_at", endOfYear())
```

- [ ] **Step 3: Adicionar função computeKpis atualizada com novo KPI "propostas do mês"**

Substituir a função `computeKpis` inteira. A interface `PainelKpisData` será atualizada no Task 2, mas o dado `propostasMes` (contagem de todas as propostas do mês, qualquer status) já é computado aqui:

```ts
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
```

- [ ] **Step 4: Adicionar funções de computação para rankings**

Após `computePipeline`, adicionar:

```ts
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
```

- [ ] **Step 5: Adicionar função para propostas recentes**

```ts
export interface PropostaRecente {
  id: number
  nomeCliente: string
  procedimentos: string
  valorTotal: number
  status: string
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
```

- [ ] **Step 6: Atualizar o render do PainelContent**

Substituir o return inteiro da função `PainelContent`:

```tsx
import { PainelKpis, type PainelKpisData } from "./painel-kpis"
import { PainelChart, type MesData } from "./painel-chart"
import { PainelPipeline, type PainelPipelineData } from "./painel-pipeline"
import { PainelRankings } from "./painel-rankings"
import { PainelRecentes } from "./painel-recentes"

// ... (inside PainelContent, after loading check)

const kpisData = computeKpis(propostas)
const chartData = computeChart(propostas)
const pipelineData = computePipeline(propostas)
const rankingProfissionais = computeRankingProfissionais(propostas)
const rankingProcedimentos = computeRankingProcedimentos(propostas)
const propostasRecentes = getPropostasRecentes(propostas)

return (
  <div className="space-y-6">
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
```

- [ ] **Step 7: Commit**

```bash
git add components/painel/painel-content.tsx
git commit -m "feat: expand painel data model with rankings, recentes, and new KPI"
```

---

### Task 2: Reescrever KPIs — 5 cards horizontais

**Files:**
- Modify: `components/painel/painel-kpis.tsx`

- [ ] **Step 1: Reescrever o arquivo completo**

```tsx
// components/painel/painel-kpis.tsx
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface PainelKpisData {
  recebidoMes: number
  recebidoMesAnterior: number
  aReceber: number
  aReceberCount: number
  ticketMedio: number
  totalPropostasPagas: number
  conversao: number
  propostasMes: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  const abs = Math.abs(pct).toFixed(0)
  if (pct > 0)
    return (
      <span className="flex items-center gap-0.5 text-green-500 text-[11px]">
        <TrendingUp className="w-3 h-3" />+{abs}% vs mês ant.
      </span>
    )
  if (pct < 0)
    return (
      <span className="flex items-center gap-0.5 text-red-500 text-[11px]">
        <TrendingDown className="w-3 h-3" />-{abs}% vs mês ant.
      </span>
    )
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground text-[11px]">
      <Minus className="w-3 h-3" />estável
    </span>
  )
}

export function PainelKpis({ data }: { data: PainelKpisData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recebido (mês)</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.recebidoMes)}</p>
        <Trend current={data.recebidoMes} previous={data.recebidoMesAnterior} />
        <p className="text-[11px] text-muted-foreground mt-1">{data.totalPropostasPagas} propostas pagas</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">A Receber</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.aReceber)}</p>
        <p className="text-[11px] text-blue-500 mt-1">{data.aReceberCount} aguardando</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ticket Médio</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.ticketMedio)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">propostas pagas</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Conversão</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{data.conversao.toFixed(0)}%</p>
        <p className="text-[11px] text-muted-foreground mt-1">ganhas / total</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Propostas (mês)</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{data.propostasMes}</p>
        <p className="text-[11px] text-muted-foreground mt-1">criadas este mês</p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-kpis.tsx
git commit -m "feat: redesign KPIs to 5-card horizontal grid"
```

---

### Task 3: Trocar AreaChart por BarChart

**Files:**
- Modify: `components/painel/painel-chart.tsx`

- [ ] **Step 1: Reescrever o arquivo completo**

```tsx
// components/painel/painel-chart.tsx
"use client"

import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

export interface MesData {
  mes: string
  recebido: number | null
  previsao: number | null
}

function formatCurrencyAxis(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return `R$ ${value}`
}

function formatCurrencyTooltip(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function PainelChart({ dados }: { dados: MesData[] }) {
  const mesAtual = new Date().getMonth()
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

  // Transforma dados para o BarChart: cada mês tem um valor e um tipo
  const chartData = dados.map((d, idx) => ({
    mes: d.mes,
    valor: d.recebido ?? d.previsao ?? 0,
    tipo: idx < mesAtual ? "recebido" : idx === mesAtual ? "atual" : "previsao",
  }))

  return (
    <Card className="p-5 bg-white border border-border rounded-xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Receita Mensal</p>
          <p className="text-xs text-muted-foreground">Recebido vs Previsão — {new Date().getFullYear()}</p>
        </div>
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-foreground rounded-sm" />
            Recebido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-muted-foreground/20 rounded-sm" />
            Previsão
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={({ x, y, payload }) => {
              const idx = MESES.indexOf(payload.value)
              const isAtual = idx === mesAtual
              return (
                <text
                  x={x}
                  y={y + 12}
                  textAnchor="middle"
                  fontSize={11}
                  fill={isAtual ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  fontWeight={isAtual ? 600 : 400}
                >
                  {payload.value}
                </text>
              )
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrencyAxis}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrencyTooltip(value), "Valor"]}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  entry.tipo === "recebido"
                    ? "hsl(var(--foreground))"
                    : entry.tipo === "atual"
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground) / 0.2)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-chart.tsx
git commit -m "feat: replace AreaChart with BarChart in painel"
```

---

### Task 4: Criar componente PainelRankings

**Files:**
- Create: `components/painel/painel-rankings.tsx`

- [ ] **Step 1: Criar o arquivo completo**

```tsx
// components/painel/painel-rankings.tsx
import { Card } from "@/components/ui/card"
import type { RankingProfissional, RankingProcedimento } from "./painel-content"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

interface PainelRankingsProps {
  profissionais: RankingProfissional[]
  procedimentos: RankingProcedimento[]
}

export function PainelRankings({ profissionais, procedimentos }: PainelRankingsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Profissionais */}
      <Card className="p-4 bg-white border border-border rounded-xl flex-1">
        <p className="text-[13px] font-semibold text-foreground mb-3">Top Profissionais</p>
        {profissionais.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profissionais.map((prof) => (
              <div key={prof.nome} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
                    {prof.iniciais}
                  </div>
                  <span className="text-xs text-foreground">{prof.nome.split(" ").slice(0, 2).join(" ")}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{formatCurrency(prof.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Top Procedimentos */}
      <Card className="p-4 bg-white border border-border rounded-xl flex-1">
        <p className="text-[13px] font-semibold text-foreground mb-3">Top Procedimentos</p>
        {procedimentos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
        ) : (
          <div className="flex flex-col gap-3">
            {procedimentos.map((proc) => (
              <div key={proc.nome} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{proc.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {proc.count}x
                  </span>
                  <span className="text-xs font-semibold text-foreground">{formatCurrency(proc.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-rankings.tsx
git commit -m "feat: add PainelRankings component (profissionais + procedimentos)"
```

---

### Task 5: Criar componente PainelRecentes

**Files:**
- Create: `components/painel/painel-recentes.tsx`

- [ ] **Step 1: Criar o arquivo completo**

```tsx
// components/painel/painel-recentes.tsx
import Link from "next/link"
import { Card } from "@/components/ui/card"
import type { PropostaRecente } from "./painel-content"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  em_negociacao: { label: "Em Negociação", className: "bg-yellow-50 text-yellow-700" },
  aguardando_pagamento: { label: "Aguardando", className: "bg-blue-50 text-blue-700" },
  pago: { label: "Pago", className: "bg-green-50 text-green-700" },
  recusada: { label: "Recusada", className: "bg-red-50 text-red-700" },
}

export function PainelRecentes({ propostas }: { propostas: PropostaRecente[] }) {
  return (
    <Card className="p-5 bg-white border border-border rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">Propostas Recentes</p>
        <Link href="/proposta" className="text-[11px] text-blue-500 hover:underline">
          Ver todas →
        </Link>
      </div>

      {propostas.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhuma proposta encontrada</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {propostas.map((p) => {
            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.em_negociacao
            return (
              <div key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{p.nomeCliente}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.procedimentos || "Sem procedimentos"}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-xs font-semibold text-foreground">{formatCurrency(p.valorTotal)}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-recentes.tsx
git commit -m "feat: add PainelRecentes component with recent proposals list"
```

---

### Task 6: Atualizar visual do PainelPipeline

**Files:**
- Modify: `components/painel/painel-pipeline.tsx`

- [ ] **Step 1: Reescrever o arquivo com layout vertical e visual clean**

```tsx
// components/painel/painel-pipeline.tsx
import { Card } from "@/components/ui/card"

export interface PainelPipelineData {
  ganhas: { count: number; valor: number }
  emAberto: { count: number; valor: number }
  perdidas: { count: number; valor: number }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

export function PainelPipeline({ data }: { data: PainelPipelineData }) {
  const total = data.ganhas.valor + data.emAberto.valor + data.perdidas.valor

  const items = [
    {
      label: "Ganhas",
      count: data.ganhas.count,
      valor: data.ganhas.valor,
      pct: total > 0 ? (data.ganhas.valor / total) * 100 : 0,
      barColor: "bg-green-500",
      countColor: "text-green-500",
    },
    {
      label: "Em Aberto",
      count: data.emAberto.count,
      valor: data.emAberto.valor,
      pct: total > 0 ? (data.emAberto.valor / total) * 100 : 0,
      barColor: "bg-blue-500",
      countColor: "text-blue-500",
    },
    {
      label: "Perdidas",
      count: data.perdidas.count,
      valor: data.perdidas.valor,
      pct: total > 0 ? (data.perdidas.valor / total) * 100 : 0,
      barColor: "bg-red-500",
      countColor: "text-red-500",
    },
  ]

  return (
    <Card className="p-5 bg-white border border-border rounded-xl">
      <p className="text-sm font-semibold text-foreground mb-4">Pipeline</p>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(item.valor)}{" "}
                <span className={`font-normal ${item.countColor}`}>{item.count}</span>
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                style={{ width: `${Math.max(item.pct, 1)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-pipeline.tsx
git commit -m "feat: redesign pipeline to vertical layout with clean style"
```

---

### Task 7: Verificação e build

- [ ] **Step 1: Rodar o build para verificar que tudo compila**

```bash
npm run build
```

Se houver erros de TypeScript, corrigir antes de prosseguir.

- [ ] **Step 2: Commit final se houve correções**

```bash
git add -A
git commit -m "fix: resolve build errors from painel redesign"
```
