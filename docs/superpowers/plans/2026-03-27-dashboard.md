# Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all generic dashboard widgets with real proposal KPIs, a cash-flow area chart (current year + forecast), and a pipeline summary — and remove the Time module.

**Architecture:** `PainelContent` orchestrates a single Supabase fetch of the current year's proposals, passes pre-computed aggregates down to three focused components: `PainelKpis`, `PainelChart`, and `PainelPipeline`. No server components — data is fetched client-side following the existing pattern.

**Tech Stack:** Next.js 15 App Router, React 19, Recharts 2.15, Supabase JS v2, Tailwind CSS v4, shadcn/ui Card.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `components/painel/painel-content.tsx` | Fetch proposals, compute aggregates, render layout |
| Create | `components/painel/painel-kpis.tsx` | 4 KPI cards (Recebido, A Receber, Ticket Médio, Conversão) |
| Create | `components/painel/painel-chart.tsx` | Recharts AreaChart — cash-flow journey |
| Create | `components/painel/painel-pipeline.tsx` | 3 pipeline cards (Ganhas, Em Aberto, Perdidas) |
| Modify | `app/page.tsx` | Replace all old imports/layout with PainelContent |
| Modify | `components/dashboard/sidebar.tsx` | Remove "Time" menu item |
| Delete | `app/team/page.tsx` | Time module route |
| Delete | `components/dashboard/time-tracker.tsx` | TimeTracker widget |
| Delete | `components/dashboard/stats-cards.tsx` | Old stats |
| Delete | `components/dashboard/project-analytics.tsx` | Old analytics |
| Delete | `components/dashboard/team-collaboration.tsx` | Old team widget |
| Delete | `components/dashboard/reminders.tsx` | Old reminders |
| Delete | `components/dashboard/project-progress.tsx` | Old progress |
| Delete | `components/dashboard/project-list.tsx` | Old project list |
| Delete | `components/dashboard/mobile-app-card.tsx` | Old mobile card |

---

### Task 1: Remove Time module and old widgets

**Files:**
- Delete: `app/team/page.tsx`
- Delete: `components/dashboard/time-tracker.tsx`
- Delete: `components/dashboard/stats-cards.tsx`
- Delete: `components/dashboard/project-analytics.tsx`
- Delete: `components/dashboard/team-collaboration.tsx`
- Delete: `components/dashboard/reminders.tsx`
- Delete: `components/dashboard/project-progress.tsx`
- Delete: `components/dashboard/project-list.tsx`
- Delete: `components/dashboard/mobile-app-card.tsx`
- Modify: `components/dashboard/sidebar.tsx`

- [ ] **Step 1: Remove Time from sidebar**

Replace the `menuItems` array in `components/dashboard/sidebar.tsx`:

```tsx
const menuItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: CheckSquare, label: "Proposta", href: "/proposta" },
  { icon: Calendar, label: "Calendário", href: "/calendar" },
  { icon: BarChart3, label: "Relatórios", href: "/analytics" },
  { icon: Stethoscope, label: "Pacientes", href: "/pacientes" },
]
```

Remove `Users` from the import line:
```tsx
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, Settings, HelpCircle, LogOut, Stethoscope } from "lucide-react"
```

- [ ] **Step 2: Delete old dashboard component files**

```bash
rm app/team/page.tsx
rm components/dashboard/time-tracker.tsx
rm components/dashboard/stats-cards.tsx
rm components/dashboard/project-analytics.tsx
rm components/dashboard/team-collaboration.tsx
rm components/dashboard/reminders.tsx
rm components/dashboard/project-progress.tsx
rm components/dashboard/project-list.tsx
rm components/dashboard/mobile-app-card.tsx
```

- [ ] **Step 3: Replace app/page.tsx with a placeholder to avoid broken imports**

```tsx
// app/page.tsx
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-64">
        <Header title="Painel" description="Métricas de propostas e receita." />
        <div className="mt-4">
          <p className="text-muted-foreground text-sm">Carregando painel...</p>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Verify app builds**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors about missing modules.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove Time module and old dashboard widgets"
```

---

### Task 2: Create painel-kpis.tsx

**Files:**
- Create: `components/painel/painel-kpis.tsx`

- [ ] **Step 1: Create the component**

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
  totalPropostas: number
  conversao: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  const abs = Math.abs(pct).toFixed(0)
  if (pct > 0) return <span className="flex items-center gap-0.5 text-green-500 text-xs"><TrendingUp className="w-3 h-3" />+{abs}% vs mês ant.</span>
  if (pct < 0) return <span className="flex items-center gap-0.5 text-destructive text-xs"><TrendingDown className="w-3 h-3" />-{abs}% vs mês ant.</span>
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="w-3 h-3" />estável</span>
}

export function PainelKpis({ data }: { data: PainelKpisData }) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recebido (mês)</p>
        <p className="text-2xl font-extrabold text-green-500 leading-tight">{formatCurrency(data.recebidoMes)}</p>
        <Trend current={data.recebidoMes} previous={data.recebidoMesAnterior} />
        <p className="text-[10px] text-muted-foreground mt-1">{data.totalPropostas} propostas pagas</p>
      </Card>

      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">A Receber</p>
        <p className="text-2xl font-extrabold text-blue-400 leading-tight">{formatCurrency(data.aReceber)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{data.aReceberCount} aguardando pagamento</p>
      </Card>

      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ticket Médio</p>
        <p className="text-2xl font-extrabold text-foreground leading-tight">{formatCurrency(data.ticketMedio)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">propostas pagas</p>
      </Card>

      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Conversão</p>
        <p className="text-2xl font-extrabold text-foreground leading-tight">{data.conversao.toFixed(0)}%</p>
        <p className="text-[10px] text-muted-foreground mt-1">ganhas / (total − perdidas)</p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-kpis.tsx
git commit -m "feat: add PainelKpis component"
```

---

### Task 3: Create painel-chart.tsx

**Files:**
- Create: `components/painel/painel-chart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/painel/painel-chart.tsx
"use client"

import { Card } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

export interface MesData {
  mes: string
  recebido: number | null
  previsao: number | null
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function formatCurrency(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return `R$ ${value}`
}

export function PainelChart({ dados }: { dados: MesData[] }) {
  const mesAtual = new Date().getMonth() // 0-indexed
  const labelMesAtual = MESES[mesAtual]

  return (
    <Card className="p-4 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Jornada do Caixa — {new Date().getFullYear()}</p>
          <p className="text-xs text-muted-foreground">Receita recebida · meses futuros = previsão</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-indigo-500 rounded" />
            Recebido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-indigo-400 opacity-50 rounded border-t border-dashed border-indigo-400" />
            Previsão
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={dados} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRecebido" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPrevisao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
            }
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
          />
          <ReferenceLine x={labelMesAtual} stroke="hsl(var(--warning, #f59e0b))" strokeDasharray="4 3" label={{ value: "hoje", fontSize: 10, fill: "#f59e0b", position: "top" }} />
          <Area type="monotone" dataKey="recebido" stroke="#6366f1" strokeWidth={2} fill="url(#gradRecebido)" connectNulls={false} dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="previsao" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="5 4" fill="url(#gradPrevisao)" connectNulls={false} dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-chart.tsx
git commit -m "feat: add PainelChart component with recharts"
```

---

### Task 4: Create painel-pipeline.tsx

**Files:**
- Create: `components/painel/painel-pipeline.tsx`

- [ ] **Step 1: Create the component**

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
      textColor: "text-green-500",
      badgeBg: "bg-green-500/10",
      badgeText: "text-green-500",
    },
    {
      label: "Em Aberto",
      count: data.emAberto.count,
      valor: data.emAberto.valor,
      pct: total > 0 ? (data.emAberto.valor / total) * 100 : 0,
      barColor: "bg-blue-400",
      textColor: "text-blue-400",
      badgeBg: "bg-blue-400/10",
      badgeText: "text-blue-400",
      sub: "Em negociação + aguardando",
    },
    {
      label: "Perdidas",
      count: data.perdidas.count,
      valor: data.perdidas.valor,
      pct: total > 0 ? (data.perdidas.valor / total) * 100 : 0,
      barColor: "bg-destructive",
      textColor: "text-destructive",
      badgeBg: "bg-destructive/10",
      badgeText: "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.badgeBg} ${item.badgeText}`}>
              {item.count} proposta{item.count !== 1 ? "s" : ""}
            </span>
          </div>
          <p className={`text-lg font-bold mb-2 ${item.textColor}`}>{formatCurrency(item.valor)}</p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full ${item.barColor} transition-all duration-500`} style={{ width: `${item.pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground">{item.sub ?? `${item.pct.toFixed(0)}% do total`}</p>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-pipeline.tsx
git commit -m "feat: add PainelPipeline component"
```

---

### Task 5: Create painel-content.tsx (orchestrator)

**Files:**
- Create: `components/painel/painel-content.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
  const perdidas = propostas.filter((p) => p.status === "recusada")
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
      // Realized months
      const valor = propostas
        .filter((p) => {
          const d = new Date(p.updated_at)
          return p.status === "pago" && d.getMonth() === idx
        })
        .reduce((s, p) => s + p.valor_total, 0)
      return { mes, recebido: valor, previsao: null }
    }
    if (idx === mesAtual) {
      // Current month: show both realized + open
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
    // Future months: forecast only
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
```

- [ ] **Step 2: Commit**

```bash
git add components/painel/painel-content.tsx
git commit -m "feat: add PainelContent orchestrator with data aggregation"
```

---

### Task 6: Wire up app/page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update the page**

```tsx
// app/page.tsx
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PainelContent } from "@/components/painel/painel-content"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-64">
        <Header title="Painel" description="Métricas de propostas e receita." />
        <div className="mt-4 md:mt-5">
          <PainelContent />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire PainelContent into dashboard page"
```
