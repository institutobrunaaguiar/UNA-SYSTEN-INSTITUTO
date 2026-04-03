# Propostas Aprovadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma página `/aprovadas` com KPIs, filtros avançados e lista de propostas aprovadas para análise de bonificação.

**Architecture:** Nova rota `/aprovadas` seguindo o padrão do projeto (page.tsx + componentes dedicados). O orquestrador (`aprovadas-content.tsx`) faz um único fetch de todas as propostas aprovadas e aplica filtros no frontend. Os componentes filhos (kpis, filtros, lista) são presentacionais e recebem dados via props.

**Tech Stack:** Next.js 14, TypeScript, Supabase JS, shadcn/ui (Card, Select, Input), Tailwind CSS

---

### Task 1: Criar a página `/aprovadas`

**Files:**
- Create: `app/aprovadas/page.tsx`

- [ ] **Step 1: Criar o arquivo da página**

```tsx
import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AprovadasContent } from "@/components/aprovadas/aprovadas-content"

export default function AprovadasPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-[68px] dock-spacer">
        <Header title="Propostas Aprovadas" description="Visualize e analise propostas aprovadas para bonificação." />
        <div className="mt-4 md:mt-5">
          <AprovadasContent />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/aprovadas/page.tsx
git commit -m "feat: add /aprovadas page route"
```

---

### Task 2: Criar o orquestrador `aprovadas-content.tsx`

**Files:**
- Create: `components/aprovadas/aprovadas-content.tsx`

- [ ] **Step 1: Criar o componente completo**

```tsx
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
}

export function AprovadasContent() {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
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
        const { data } = await supabase
          .from("propostas")
          .select("id, valor_total, status, created_at, updated_at, nome_cliente, cpf_cliente, itens, data_proposta, validacao_status, validacao_motivo, validado_em")
          .eq("validacao_status", "aprovada")
          .order("validado_em", { ascending: false })
        if (data) setPropostas(data as Proposta[])
      } catch (e) {
        console.error("[aprovadas] erro ao buscar:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Extrair opções únicas para filtros
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

  // Gerar lista de meses disponíveis
  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>()
    propostas.forEach((p) => {
      if (p.validado_em) {
        const d = new Date(p.validado_em)
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
      }
    })
    // Sempre incluir o mês atual
    set.add(getMesAnoAtual())
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [ano, mes] = key.split("-")
        return { value: key, label: `${MESES[parseInt(mes) - 1]} ${ano}` }
      })
  }, [propostas])

  // Aplicar filtros
  const filtered = useMemo(() => {
    return propostas.filter((p) => {
      // Filtro mês/ano sobre validado_em
      if (filtros.mesAno && p.validado_em) {
        const d = new Date(p.validado_em)
        const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        if (mesAno !== filtros.mesAno) return false
      }

      // Filtro profissional
      if (filtros.profissional !== "todos") {
        const tem = p.itens.some((i) => i.profissionalNome === filtros.profissional)
        if (!tem) return false
      }

      // Filtro procedimento
      if (filtros.procedimento !== "todos") {
        const tem = p.itens.some((i) => i.procedimentoNome === filtros.procedimento)
        if (!tem) return false
      }

      // Filtro faixa de valor
      if (filtros.faixaValor !== "todas") {
        const v = p.valor_total
        switch (filtros.faixaValor) {
          case "ate_1000": if (v > 1000) return false; break
          case "1000_5000": if (v < 1000 || v > 5000) return false; break
          case "5000_10000": if (v < 5000 || v > 10000) return false; break
          case "acima_10000": if (v < 10000) return false; break
        }
      }

      // Filtro busca por nome
      if (filtros.busca) {
        if (!p.nome_cliente.toLowerCase().includes(filtros.busca.toLowerCase())) return false
      }

      return true
    })
  }, [propostas, filtros])

  // Computar KPIs
  const kpis = useMemo((): KpisData => {
    const totalAprovado = filtered.reduce((s, p) => s + p.valor_total, 0)
    const quantidade = filtered.length
    const ticketMedio = quantidade > 0 ? totalAprovado / quantidade : 0

    // Top consultora
    const map = new Map<string, number>()
    filtered.forEach((p) => {
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

    return { totalAprovado, quantidade, ticketMedio, topConsultora }
  }, [filtered])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AprovadasKpis data={kpis} />
      <AprovadasFiltros
        filtros={filtros}
        onChange={setFiltros}
        meses={mesesDisponiveis}
        profissionais={profissionais}
        procedimentos={procedimentos}
      />
      <AprovadasLista propostas={filtered} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/aprovadas/aprovadas-content.tsx
git commit -m "feat: add AprovadasContent orchestrator with fetch, filters and KPIs"
```

---

### Task 3: Criar o componente de KPIs

**Files:**
- Create: `components/aprovadas/aprovadas-kpis.tsx`

- [ ] **Step 1: Criar o componente completo**

```tsx
import { Card } from "@/components/ui/card"
import type { KpisData } from "./aprovadas-content"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

export function AprovadasKpis({ data }: { data: KpisData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Aprovado</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.totalAprovado)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">no período</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Quantidade</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{data.quantidade}</p>
        <p className="text-[11px] text-muted-foreground mt-1">propostas aprovadas</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ticket Médio</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.ticketMedio)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">por proposta</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Top Consultora</p>
        <p className="text-2xl font-bold text-foreground leading-tight truncate">
          {data.topConsultora ? data.topConsultora.nome.split(" ").slice(0, 2).join(" ") : "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {data.topConsultora ? formatCurrency(data.topConsultora.valor) : "sem dados"}
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/aprovadas/aprovadas-kpis.tsx
git commit -m "feat: add AprovadasKpis component"
```

---

### Task 4: Criar o componente de filtros

**Files:**
- Create: `components/aprovadas/aprovadas-filtros.tsx`

- [ ] **Step 1: Criar o componente completo**

```tsx
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import type { FiltrosState } from "./aprovadas-content"

interface AprovadasFiltrosProps {
  filtros: FiltrosState
  onChange: (filtros: FiltrosState) => void
  meses: { value: string; label: string }[]
  profissionais: string[]
  procedimentos: string[]
}

export function AprovadasFiltros({ filtros, onChange, meses, profissionais, procedimentos }: AprovadasFiltrosProps) {
  function update(partial: Partial<FiltrosState>) {
    onChange({ ...filtros, ...partial })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={filtros.mesAno} onValueChange={(v) => update({ mesAno: v })}>
        <SelectTrigger className="w-[180px] bg-white border border-border rounded-lg text-xs">
          <SelectValue placeholder="Mês/Ano" />
        </SelectTrigger>
        <SelectContent>
          {meses.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.profissional} onValueChange={(v) => update({ profissional: v })}>
        <SelectTrigger className="w-[180px] bg-white border border-border rounded-lg text-xs">
          <SelectValue placeholder="Profissional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos" className="text-xs">Todos</SelectItem>
          {profissionais.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.procedimento} onValueChange={(v) => update({ procedimento: v })}>
        <SelectTrigger className="w-[180px] bg-white border border-border rounded-lg text-xs">
          <SelectValue placeholder="Procedimento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos" className="text-xs">Todos</SelectItem>
          {procedimentos.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.faixaValor} onValueChange={(v) => update({ faixaValor: v })}>
        <SelectTrigger className="w-[180px] bg-white border border-border rounded-lg text-xs">
          <SelectValue placeholder="Faixa de valor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas" className="text-xs">Todas</SelectItem>
          <SelectItem value="ate_1000" className="text-xs">Até R$ 1.000</SelectItem>
          <SelectItem value="1000_5000" className="text-xs">R$ 1.000 - R$ 5.000</SelectItem>
          <SelectItem value="5000_10000" className="text-xs">R$ 5.000 - R$ 10.000</SelectItem>
          <SelectItem value="acima_10000" className="text-xs">Acima de R$ 10.000</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do paciente..."
          className="pl-9 bg-white border border-border rounded-lg text-xs"
          value={filtros.busca}
          onChange={(e) => update({ busca: e.target.value })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/aprovadas/aprovadas-filtros.tsx
git commit -m "feat: add AprovadasFiltros component"
```

---

### Task 5: Criar o componente de lista

**Files:**
- Create: `components/aprovadas/aprovadas-lista.tsx`

- [ ] **Step 1: Criar o componente completo**

```tsx
import { Card } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"
import type { Proposta } from "@/components/propostas/types"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function AprovadasLista({ propostas }: { propostas: Proposta[] }) {
  if (propostas.length === 0) {
    return (
      <Card className="p-8 text-center bg-white border border-border rounded-xl">
        <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhuma proposta aprovada encontrada para os filtros selecionados.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {propostas.map((p) => {
        const profissional = p.itens.length > 0 ? p.itens[0].profissionalNome : "—"
        const procedimentosTexto = p.itens.map((i) => i.procedimentoNome).join(", ")

        return (
          <Card key={p.id} className="p-4 bg-white border border-border rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">#{p.id}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">
                    Aprovada
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{p.nome_cliente}</p>
                {p.cpf_cliente && (
                  <p className="text-[10px] text-muted-foreground">{p.cpf_cliente}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate">{procedimentosTexto || "Sem procedimentos"}</p>
              </div>

              <div className="text-right ml-4 shrink-0">
                <p className="text-sm font-bold text-foreground">{formatCurrency(p.valor_total)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{profissional}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
              <span>Proposta: {formatDate(p.data_proposta)}</span>
              <span>Aprovada: {formatDate(p.validado_em)}</span>
            </div>
          </Card>
        )
      })}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Mostrando {propostas.length} {propostas.length === 1 ? "proposta" : "propostas"}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/aprovadas/aprovadas-lista.tsx
git commit -m "feat: add AprovadasLista component"
```

---

### Task 6: Adicionar item no sidebar

**Files:**
- Modify: `components/dashboard/sidebar.tsx`

- [ ] **Step 1: Adicionar import do ShieldCheck**

Adicionar `ShieldCheck` à lista de imports de lucide-react (já existe no arquivo, verificar — se não existir, adicionar).

- [ ] **Step 2: Adicionar item no menuItems**

No array `menuItems`, após a linha de "Proposta", adicionar:

```ts
{ icon: ShieldCheck, label: "Aprovadas", href: "/aprovadas", modulo: "aprovadas" },
```

O array ficará:
```ts
const menuItems = [
  { icon: LayoutDashboard, label: "Painel",     href: "/painel",    modulo: "painel" },
  { icon: CheckSquare,    label: "Proposta",    href: "/proposta",  modulo: "proposta" },
  { icon: ShieldCheck,    label: "Aprovadas",   href: "/aprovadas", modulo: "aprovadas" },
  { icon: Calendar,       label: "Calendário",  href: "/calendar",  modulo: "calendario" },
  // ... restante
]
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/sidebar.tsx
git commit -m "feat: add Aprovadas link to sidebar"
```

---

### Task 7: Build e verificação

- [ ] **Step 1: Rodar o build**

```bash
npm run build
```

- [ ] **Step 2: Commit de correções se necessário**

```bash
git add -A
git commit -m "fix: resolve build errors from aprovadas page"
```
