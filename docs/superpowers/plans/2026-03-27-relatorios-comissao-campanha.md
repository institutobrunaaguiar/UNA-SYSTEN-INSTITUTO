# Relatórios, Comissão e Campanha — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three interconnected modules — Relatórios (reports from propostas data), Comissão (commission rules, calculation, approval), and Campanha (commercial campaigns linked to procedures) — forming a cycle where campaigns drive sales, sales generate commissions, and consolidated data feeds reports.

**Architecture:** All modules are client-side components ("use client") following the existing page pattern (Sidebar + Header + Content). Data comes from Supabase tables: `propostas` (status "pago" = fechamento) feeds Relatórios and Comissão; new tables `comissao_regras`, `comissoes`, `metas`, `campanhas`, `campanha_itens` store commission/campaign data. No new API routes needed — direct Supabase client queries.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase JS v2, Recharts, lucide-react

---

## File Structure

### New Files
```
app/comissao/page.tsx                          — Comissão page shell
app/campanha/page.tsx                          — Campanha page shell
components/relatorios/relatorios-content.tsx    — Main reports container with tabs
components/relatorios/relatorios-gerencial.tsx  — KPIs + charts view
components/relatorios/relatorios-analitico.tsx  — Detailed table view
components/relatorios/relatorios-filters.tsx    — Period/professional/procedure filters
components/comissao/comissao-content.tsx         — Main commission container with tabs
components/comissao/comissao-lista.tsx           — Commission list with status/actions
components/comissao/comissao-regras.tsx          — Commission rules CRUD
components/comissao/comissao-metas.tsx           — Goals management
components/comissao/comissao-calcular.tsx        — Calculate commissions dialog
components/campanha/campanha-content.tsx         — Main campaign container
components/campanha/campanha-lista.tsx           — Campaign list
components/campanha/campanha-form.tsx            — Campaign create/edit form
components/campanha/campanha-detalhe.tsx         — Campaign detail sheet
```

### Modified Files
```
components/dashboard/sidebar.tsx               — Add Comissão and Campanha menu items
components/analytics/analytics-content.tsx     — Replace with real reports (or redirect)
app/analytics/page.tsx                          — Update to use RelatoriosContent
```

---

## SQL: Database Tables

These SQL statements must be run in Supabase SQL Editor before starting the implementation.

```sql
-- Commission rules
CREATE TABLE comissao_regras (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('procedimento', 'profissional', 'meta')),
  procedimento_nome TEXT,
  profissional_id INTEGER,
  percentual NUMERIC(5,2) NOT NULL,
  meta_minima NUMERIC(12,2),
  meta_maxima NUMERIC(12,2),
  bonus_percentual NUMERIC(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual commission records
CREATE TABLE comissoes (
  id SERIAL PRIMARY KEY,
  proposta_id INTEGER NOT NULL,
  profissional_id INTEGER NOT NULL,
  profissional_nome TEXT NOT NULL,
  procedimento_nome TEXT NOT NULL,
  valor_base NUMERIC(12,2) NOT NULL,
  percentual NUMERIC(5,2) NOT NULL,
  valor_comissao NUMERIC(12,2) NOT NULL,
  regra_id INTEGER REFERENCES comissao_regras(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_validacao', 'aprovado', 'pago')),
  periodo_referencia TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals (individual and collective)
CREATE TABLE metas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('individual', 'coletiva')),
  profissional_id INTEGER,
  profissional_nome TEXT,
  valor_meta NUMERIC(12,2) NOT NULL,
  valor_atingido NUMERIC(12,2) DEFAULT 0,
  periodo TEXT NOT NULL,
  bonus_percentual NUMERIC(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campanhas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('desconto', 'combo', 'beneficio')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  aplicacao TEXT NOT NULL DEFAULT 'manual' CHECK (aplicacao IN ('automatica', 'manual')),
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign items (linked procedures)
CREATE TABLE campanha_itens (
  id SERIAL PRIMARY KEY,
  campanha_id INTEGER NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  procedimento_nome TEXT NOT NULL,
  procedimento_id INTEGER,
  desconto_tipo TEXT CHECK (desconto_tipo IN ('percentual', 'valor')),
  desconto_valor NUMERIC(12,2),
  combo_com TEXT,
  beneficio_descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Task 1: Sidebar Navigation Update

**Files:**
- Modify: `components/dashboard/sidebar.tsx`

- [ ] **Step 1: Add Comissão and Campanha to sidebar**

Add two new imports and menu items to the sidebar:

```typescript
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, Settings, HelpCircle, LogOut, Stethoscope, DollarSign, Megaphone } from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/" },
  { icon: CheckSquare, label: "Proposta", href: "/proposta" },
  { icon: Calendar, label: "Calendário", href: "/calendar" },
  { icon: BarChart3, label: "Relatórios", href: "/analytics" },
  { icon: Stethoscope, label: "Pacientes", href: "/pacientes" },
  { icon: DollarSign, label: "Comissão", href: "/comissao" },
  { icon: Megaphone, label: "Campanha", href: "/campanha" },
]
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/sidebar.tsx
git commit -m "feat: add Comissão and Campanha to sidebar navigation"
```

---

## Task 2: Relatórios Module — Filters Component

**Files:**
- Create: `components/relatorios/relatorios-filters.tsx`

- [ ] **Step 1: Create the filters component**

Shared filter bar used by both gerencial and analítico views. Filters: date range, profissional, procedimento.

```typescript
"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar, Filter, X } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

export interface RelatorioFilters {
  dataInicial: string
  dataFinal: string
  profissional: string
  procedimento: string
}

interface Props {
  filters: RelatorioFilters
  onChange: (filters: RelatorioFilters) => void
}

export function RelatoriosFilters({ filters, onChange }: Props) {
  const [profissionais, setProfissionais] = useState<{ id: number; nome: string }[]>([])
  const [procedimentos, setProcedimentos] = useState<string[]>([])

  useEffect(() => {
    const supabase = getSupabase()
    // Load profissionais
    supabase.from("profissionais").select("id, nome").eq("ativo", true).order("nome")
      .then(({ data }) => { if (data) setProfissionais(data) })
    // Load unique procedure names
    supabase.from("procedimentos_clinica").select("nome").eq("ativo", true).order("nome")
      .then(({ data }) => {
        if (data) setProcedimentos([...new Set(data.map(d => d.nome))])
      })
  }, [])

  function clear() {
    onChange({ dataInicial: "", dataFinal: "", profissional: "", procedimento: "" })
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
        <Input type="date" value={filters.dataInicial}
          onChange={e => onChange({ ...filters, dataInicial: e.target.value })}
          className="h-9 w-40" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Data Final</label>
        <Input type="date" value={filters.dataFinal}
          onChange={e => onChange({ ...filters, dataFinal: e.target.value })}
          className="h-9 w-40" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Profissional</label>
        <select value={filters.profissional}
          onChange={e => onChange({ ...filters, profissional: e.target.value })}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">Todos</option>
          {profissionais.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Procedimento</label>
        <select value={filters.procedimento}
          onChange={e => onChange({ ...filters, procedimento: e.target.value })}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">Todos</option>
          {procedimentos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {(filters.dataInicial || filters.dataFinal || filters.profissional || filters.procedimento) && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9">
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/relatorios/relatorios-filters.tsx
git commit -m "feat: add RelatoriosFilters component"
```

---

## Task 3: Relatórios Module — Visão Gerencial

**Files:**
- Create: `components/relatorios/relatorios-gerencial.tsx`

- [ ] **Step 1: Create the gerencial view**

KPI cards (receita, ticket médio, fechamentos, pacientes, conversão) + monthly revenue chart. Data fetched from `propostas` table filtered by status and period.

```typescript
"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { DollarSign, Users, TrendingUp, FileCheck, Target, ArrowUpRight } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { RelatorioFilters } from "./relatorios-filters"
import type { Proposta } from "@/components/propostas/types"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

interface KPI {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  change?: string
}

interface Props {
  filters: RelatorioFilters
}

export function RelatoriosGerencial({ filters }: Props) {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [allPropostas, setAllPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = getSupabase()

      // Fetch all propostas for conversion rate
      let allQuery = supabase.from("propostas").select("*")
      if (filters.dataInicial) allQuery = allQuery.gte("created_at", filters.dataInicial)
      if (filters.dataFinal) allQuery = allQuery.lte("created_at", filters.dataFinal + "T23:59:59")
      const { data: allData } = await allQuery
      setAllPropostas(allData ?? [])

      // Fetch only "pago" (fechamentos)
      let query = supabase.from("propostas").select("*").eq("status", "pago")
      if (filters.dataInicial) query = query.gte("created_at", filters.dataInicial)
      if (filters.dataFinal) query = query.lte("created_at", filters.dataFinal + "T23:59:59")
      const { data } = await query
      let filtered = data ?? []

      // Client-side filter by profissional/procedimento (inside itens JSON)
      if (filters.profissional) {
        filtered = filtered.filter(p =>
          p.itens?.some((i: { profissionalNome: string }) => i.profissionalNome === filters.profissional)
        )
      }
      if (filters.procedimento) {
        filtered = filtered.filter(p =>
          p.itens?.some((i: { procedimentoNome: string }) => i.procedimentoNome === filters.procedimento)
        )
      }

      setPropostas(filtered)
      setLoading(false)
    }
    load()
  }, [filters])

  const receita = propostas.reduce((sum, p) => sum + (p.valor_total || 0), 0)
  const fechamentos = propostas.length
  const ticketMedio = fechamentos > 0 ? receita / fechamentos : 0
  const pacientesUnicos = new Set(propostas.map(p => p.paciente_id)).size
  const conversao = allPropostas.length > 0 ? (fechamentos / allPropostas.length) * 100 : 0

  // Count procedures
  const totalProcedimentos = propostas.reduce((sum, p) => sum + (p.itens?.length || 0), 0)

  const kpis: KPI[] = [
    { title: "Receita Total", value: `R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign },
    { title: "Fechamentos", value: String(fechamentos), icon: FileCheck },
    { title: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp },
    { title: "Pacientes Únicos", value: String(pacientesUnicos), icon: Users },
    { title: "Procedimentos", value: String(totalProcedimentos), icon: Target },
    { title: "Conversão", value: `${conversao.toFixed(1)}%`, icon: ArrowUpRight },
  ]

  // Monthly aggregation for chart
  const monthlyMap = new Map<string, number>()
  propostas.forEach(p => {
    const d = new Date(p.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + (p.valor_total || 0))
  })
  const months = [...monthlyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
  const maxMonth = Math.max(...months.map(m => m[1]), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={kpi.title} className="p-4 hover:shadow-lg transition-all duration-300 animate-slide-in-up"
            style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <kpi.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-xs font-medium text-muted-foreground">{kpi.title}</h3>
              </div>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Receita Mensal</h3>
        {months.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado no período selecionado.</p>
        ) : (
          <div className="space-y-3">
            {months.map(([month, value], i) => {
              const [y, m] = month.split("-")
              const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
              return (
                <div key={month} className="space-y-1.5 animate-slide-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{label}</span>
                    <span className="text-muted-foreground">R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(value / maxMonth) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/relatorios/relatorios-gerencial.tsx
git commit -m "feat: add RelatoriosGerencial component with KPIs and chart"
```

---

## Task 4: Relatórios Module — Visão Analítica

**Files:**
- Create: `components/relatorios/relatorios-analitico.tsx`

- [ ] **Step 1: Create analytic table view**

Detailed table showing each fechamento with patient, procedures, professional, values. Sortable and filterable.

- [ ] **Step 2: Commit**

```bash
git add components/relatorios/relatorios-analitico.tsx
git commit -m "feat: add RelatoriosAnalitico detailed table view"
```

---

## Task 5: Relatórios Module — Main Container

**Files:**
- Create: `components/relatorios/relatorios-content.tsx`
- Modify: `app/analytics/page.tsx`

- [ ] **Step 1: Create RelatoriosContent with tabs (Gerencial/Analítico) + filters**

- [ ] **Step 2: Update analytics page to use RelatoriosContent instead of AnalyticsContent**

- [ ] **Step 3: Commit**

```bash
git add components/relatorios/ app/analytics/page.tsx
git commit -m "feat: complete Relatórios module with gerencial and analítico views"
```

---

## Task 6: Comissão Module — Commission List

**Files:**
- Create: `components/comissao/comissao-lista.tsx`

- [ ] **Step 1: Create commission list with status badges, filters, and bulk approval**

Table showing: profissional, procedimento, valor_base, percentual, valor_comissão, status. Actions: approve, mark as paid. Bulk actions for "aprovar selecionados".

- [ ] **Step 2: Commit**

```bash
git add components/comissao/comissao-lista.tsx
git commit -m "feat: add ComissaoLista component"
```

---

## Task 7: Comissão Module — Rules CRUD

**Files:**
- Create: `components/comissao/comissao-regras.tsx`

- [ ] **Step 1: Create rules management (list + add/edit dialog)**

CRUD for commission rules: name, type (procedimento/profissional/meta), percentage, conditions. Uses Sheet for form.

- [ ] **Step 2: Commit**

```bash
git add components/comissao/comissao-regras.tsx
git commit -m "feat: add ComissaoRegras rules management"
```

---

## Task 8: Comissão Module — Goals Management

**Files:**
- Create: `components/comissao/comissao-metas.tsx`

- [ ] **Step 1: Create goals (metas) view with progress tracking**

Shows individual and collective goals with progress bars. Add/edit goals via Sheet.

- [ ] **Step 2: Commit**

```bash
git add components/comissao/comissao-metas.tsx
git commit -m "feat: add ComissaoMetas goals management"
```

---

## Task 9: Comissão Module — Calculate Commissions

**Files:**
- Create: `components/comissao/comissao-calcular.tsx`

- [ ] **Step 1: Create commission calculation dialog**

"Calcular Comissões" button opens dialog to select period. Fetches propostas with status "pago" in that period, applies rules from comissao_regras, generates comissao records. Shows preview before saving.

- [ ] **Step 2: Commit**

```bash
git add components/comissao/comissao-calcular.tsx
git commit -m "feat: add ComissaoCalcular commission calculation"
```

---

## Task 10: Comissão Module — Main Container + Page

**Files:**
- Create: `components/comissao/comissao-content.tsx`
- Create: `app/comissao/page.tsx`

- [ ] **Step 1: Create ComissaoContent with tabs (Comissões/Regras/Metas)**

- [ ] **Step 2: Create comissao page shell**

- [ ] **Step 3: Commit**

```bash
git add components/comissao/ app/comissao/page.tsx
git commit -m "feat: complete Comissão module with list, rules, goals, and calculation"
```

---

## Task 11: Campanha Module — Campaign List

**Files:**
- Create: `components/campanha/campanha-lista.tsx`

- [ ] **Step 1: Create campaign list with status (ativa/encerrada/rascunho), type badges, period**

Cards or table showing campaigns. Filter by status and type. Click to open detail.

- [ ] **Step 2: Commit**

```bash
git add components/campanha/campanha-lista.tsx
git commit -m "feat: add CampanhaLista component"
```

---

## Task 12: Campanha Module — Campaign Form

**Files:**
- Create: `components/campanha/campanha-form.tsx`

- [ ] **Step 1: Create campaign form (Sheet) for create/edit**

Form fields: nome, descricao, tipo (desconto/combo/beneficio), data_inicio, data_fim, aplicacao (automatica/manual). Procedure items section: add procedures with discount/combo/benefit rules.

- [ ] **Step 2: Commit**

```bash
git add components/campanha/campanha-form.tsx
git commit -m "feat: add CampanhaForm create/edit form"
```

---

## Task 13: Campanha Module — Campaign Detail

**Files:**
- Create: `components/campanha/campanha-detalhe.tsx`

- [ ] **Step 1: Create campaign detail Sheet**

Shows campaign info, linked procedures, and impact preview (how it would affect a sample procedure price).

- [ ] **Step 2: Commit**

```bash
git add components/campanha/campanha-detalhe.tsx
git commit -m "feat: add CampanhaDetalhe detail view"
```

---

## Task 14: Campanha Module — Main Container + Page

**Files:**
- Create: `components/campanha/campanha-content.tsx`
- Create: `app/campanha/page.tsx`

- [ ] **Step 1: Create CampanhaContent with list + form integration**

- [ ] **Step 2: Create campanha page shell**

- [ ] **Step 3: Commit**

```bash
git add components/campanha/ app/campanha/page.tsx
git commit -m "feat: complete Campanha module with list, form, and detail"
```

---

## Task 15: Build Verification + Final Deploy

- [ ] **Step 1: Run `npm run build` and fix any errors**
- [ ] **Step 2: Final commit with all fixes**
- [ ] **Step 3: Push to remote**

```bash
git push origin main
```
