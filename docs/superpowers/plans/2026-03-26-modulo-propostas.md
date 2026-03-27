# Modulo de Propostas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Propostas (proposals) module for Instituto Bruna Aguiar — CRUD operations, stepper wizard with 4 steps, patient autocomplete, payment scenarios with MDR tax calculations, and status management.

**Architecture:** Monolithic component with extracted sub-components. `propostas-content.tsx` orchestrates view switching between list and form. Each wizard step is a separate component receiving shared state via props. Supabase client created directly in components (existing project pattern).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase JS client, localStorage (MDR rates persistence)

**Note:** This project has no test framework configured. Steps use manual verification via `npm run dev` instead of automated tests.

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Create | `app/proposta/page.tsx` | Server component page |
| Create | `components/propostas/propostas-content.tsx` | View orchestrator (lista / nova / editar) |
| Create | `components/propostas/propostas-lista.tsx` | Table with filters, search, actions menu |
| Create | `components/propostas/proposta-form.tsx` | Stepper wizard container (4 steps) |
| Create | `components/propostas/steps/step-cliente.tsx` | Patient autocomplete + quick registration |
| Create | `components/propostas/steps/step-procedimentos.tsx` | Add items + per-item discounts |
| Create | `components/propostas/steps/step-cenarios.tsx` | Payment scenarios + MDR editor |
| Create | `components/propostas/steps/step-resumo.tsx` | Review + protocol discount + save |
| Create | `components/propostas/proposta-detalhes.tsx` | Sheet with proposal details |
| Create | `components/propostas/taxas-mdr-editor.tsx` | MDR rate editor with +/- buttons |
| Modify | `components/dashboard/sidebar.tsx:11` | Change href from `/tasks` to `/proposta` |
| Delete | `app/tasks/page.tsx` | Old tasks page |
| Delete | `components/tasks/tasks-content.tsx` | Old tasks content |

---

### Task 1: Route Setup and Sidebar Update

**Files:**
- Create: `app/proposta/page.tsx`
- Modify: `components/dashboard/sidebar.tsx:11`
- Delete: `app/tasks/page.tsx`
- Delete: `components/tasks/tasks-content.tsx`

- [ ] **Step 1: Create the proposta page**

Create `app/proposta/page.tsx` following the same pattern as `app/pacientes/page.tsx`:

```tsx
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PropostasContent } from "@/components/propostas/propostas-content"
import { Button } from "@/components/ui/button"

export default function PropostaPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header
          title="Propostas"
          description="Crie e gerencie propostas comerciais para seus pacientes."
        />

        <div className="mt-6">
          <PropostasContent />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Update sidebar href**

In `components/dashboard/sidebar.tsx`, change line 11:

```tsx
// Before:
{ icon: CheckSquare, label: "Proposta", badge: "124", href: "/tasks" },

// After:
{ icon: CheckSquare, label: "Proposta", href: "/proposta" },
```

Remove the hardcoded badge — proposal count will come from the list component.

- [ ] **Step 3: Delete old tasks files**

```bash
rm app/tasks/page.tsx
rm components/tasks/tasks-content.tsx
rmdir components/tasks
rmdir app/tasks
```

- [ ] **Step 4: Create placeholder PropostasContent**

Create `components/propostas/propostas-content.tsx` with a minimal placeholder so the page compiles:

```tsx
"use client"

export function PropostasContent() {
  return (
    <div className="animate-fade-in">
      <p className="text-muted-foreground">Modulo de propostas em construcao...</p>
    </div>
  )
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run dev` — navigate to `http://localhost:3000/proposta`
Expected: Page loads with sidebar showing "Proposta" highlighted, header showing "Propostas", placeholder text visible.

```bash
git add app/proposta/page.tsx components/propostas/propostas-content.tsx components/dashboard/sidebar.tsx
git rm app/tasks/page.tsx components/tasks/tasks-content.tsx
git commit -m "feat: create /proposta route, update sidebar, remove /tasks"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `components/propostas/types.ts`

- [ ] **Step 1: Create types file**

Create `components/propostas/types.ts`:

```ts
export interface Proposta {
  id: number
  paciente_id: number
  nome_cliente: string
  cpf_cliente: string
  itens: PropostaItem[]
  valor_subtotal: number
  valor_desconto_itens: number
  desconto_protocolo_percentual: number
  desconto_protocolo_valor: number
  valor_desconto_protocolo: number
  valor_total: number
  cenario_tipo: CenarioTipo
  valor_entrada: number
  num_parcelas: number
  fluxo_caixa_imediato: number
  status: PropostaStatus
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface PropostaItem {
  procedimentoId: string
  procedimentoNome: string
  profissionalNome: string
  valor: number
  desconto_tipo: "percentual" | "valor" | null
  desconto_valor: number | null
  valor_final: number
}

export type PropostaStatus = "em_negociacao" | "aguardando_pagamento" | "pago" | "recusada"

export type CenarioTipo = "agressivo" | "balanceado" | "conservador" | "personalizado"

export interface Paciente {
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone: string | null
  telefone_celular: string | null
  email: string | null
  ativo: boolean
}

export interface Procedimento {
  id: number
  nome: string
  especialidade_id: number
  especialidade_nome: string
  ativo: boolean
}

export interface Profissional {
  id: number
  nome: string
  tipo_executor: string
  ativo: boolean
}

export interface TaxasMDR {
  debito: number
  rotativo: number
  parcelado_2_6: number
  parcelado_7_12: number
  crediario: number
  pix: number
}

export const TAXAS_MDR_PADRAO: TaxasMDR = {
  debito: 0.71,
  rotativo: 2.05,
  parcelado_2_6: 2.42,
  parcelado_7_12: 2.69,
  crediario: 3.29,
  pix: 0,
}

export const CENARIOS = {
  agressivo: { entrada_pct: 50, parcelas: 6 },
  balanceado: { entrada_pct: 30, parcelas: 8 },
  conservador: { entrada_pct: 10, parcelas: 12 },
} as const

export const STATUS_CONFIG: Record<PropostaStatus, { label: string; color: string }> = {
  em_negociacao: { label: "Em Negociacao", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  pago: { label: "Pago", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  recusada: { label: "Recusada", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/types.ts
git commit -m "feat: add TypeScript types for Propostas module"
```

---

### Task 3: Propostas Lista (Table + Filters)

**Files:**
- Create: `components/propostas/propostas-lista.tsx`

- [ ] **Step 1: Create the list component**

Create `components/propostas/propostas-lista.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  RefreshCw,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@supabase/supabase-js"
import type { Proposta, PropostaStatus } from "./types"
import { STATUS_CONFIG } from "./types"

interface PropostasListaProps {
  onNovaProposta: () => void
  onEditarProposta: (proposta: Proposta) => void
  onVerDetalhes: (proposta: Proposta) => void
}

export function PropostasLista({ onNovaProposta, onEditarProposta, onVerDetalhes }: PropostasListaProps) {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<PropostaStatus | "todas">("todas")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    fetchPropostas()
  }, [])

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  async function fetchPropostas() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("propostas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[propostas] Erro ao buscar:", error.message)
        return
      }
      if (data) setPropostas(data as Proposta[])
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDuplicar(proposta: Proposta) {
    try {
      const supabase = getSupabase()
      const { id, created_at, updated_at, ...rest } = proposta
      const { error } = await supabase.from("propostas").insert({
        ...rest,
        nome_cliente: `${proposta.nome_cliente} (copia)`,
        status: "em_negociacao",
      })
      if (error) {
        console.error("[propostas] Erro ao duplicar:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("propostas").delete().eq("id", deleteId)
      if (error) {
        console.error("[propostas] Erro ao excluir:", error.message)
        return
      }
      setDeleteId(null)
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleStatusChange(id: number, status: PropostaStatus) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("propostas").update({ status }).eq("id", id)
      if (error) {
        console.error("[propostas] Erro ao atualizar status:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  const filtered = propostas.filter((p) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      p.nome_cliente.toLowerCase().includes(term) ||
      (p.cpf_cliente && p.cpf_cliente.includes(term))
    const matchesStatus = filterStatus === "todas" || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    todas: propostas.length,
    em_negociacao: propostas.filter((p) => p.status === "em_negociacao").length,
    aguardando_pagamento: propostas.filter((p) => p.status === "aguardando_pagamento").length,
    pago: propostas.filter((p) => p.status === "pago").length,
    recusada: propostas.filter((p) => p.status === "recusada").length,
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={onNovaProposta}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["todas", "em_negociacao", "aguardando_pagamento", "pago", "recusada"] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            onClick={() => setFilterStatus(status)}
            size="sm"
          >
            {status === "todas" ? "Todas" : STATUS_CONFIG[status].label} ({statusCounts[status]})
          </Button>
        ))}
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Carregando propostas...</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Card className="border border-border">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">CPF</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Procedimentos</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Valor Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((proposta) => (
                    <tr
                      key={proposta.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{proposta.id}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{proposta.nome_cliente}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{proposta.cpf_cliente || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {proposta.itens.map((i) => i.procedimentoNome).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {formatCurrency(proposta.valor_total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[proposta.status].color}`}>
                          {STATUS_CONFIG[proposta.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(proposta.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onVerDetalhes(proposta)}>
                              <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditarProposta(proposta)}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(proposta)}>
                              <Copy className="w-4 h-4 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <RefreshCw className="w-4 h-4 mr-2" /> Alterar status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {(Object.keys(STATUS_CONFIG) as PropostaStatus[]).map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() => handleStatusChange(proposta.id, s)}
                                    disabled={proposta.status === s}
                                  >
                                    {STATUS_CONFIG[s].label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(proposta.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhuma proposta encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filtered.length} de {propostas.length} propostas</span>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run dev` — the component won't be visible yet (not wired in), but ensure no TypeScript errors.

```bash
git add components/propostas/propostas-lista.tsx
git commit -m "feat: add PropostasLista component with filters and actions"
```

---

### Task 4: Taxas MDR Editor

**Files:**
- Create: `components/propostas/taxas-mdr-editor.tsx`

- [ ] **Step 1: Create the MDR editor component**

Create `components/propostas/taxas-mdr-editor.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"
import type { TaxasMDR } from "./types"

interface TaxasMDREditorProps {
  taxas: TaxasMDR
  onChange: (taxas: TaxasMDR) => void
}

const LABELS: Record<keyof TaxasMDR, string> = {
  debito: "Debito",
  rotativo: "Rotativo",
  parcelado_2_6: "Parcelado 2 a 6x",
  parcelado_7_12: "Parcelado 7 a 12x",
  crediario: "Crediario",
  pix: "Pix",
}

export function TaxasMDREditor({ taxas, onChange }: TaxasMDREditorProps) {
  function handleAdjust(key: keyof TaxasMDR, delta: number) {
    const newValue = Math.max(0, Math.round((taxas[key] + delta) * 100) / 100)
    onChange({ ...taxas, [key]: newValue })
  }

  function handleInputChange(key: keyof TaxasMDR, value: string) {
    const num = parseFloat(value.replace(",", "."))
    if (!isNaN(num) && num >= 0) {
      onChange({ ...taxas, [key]: Math.round(num * 100) / 100 })
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center text-sm font-medium text-muted-foreground">
        <span>Produto</span>
        <span className="col-span-3 text-center">Edicao das taxas</span>
        <span className="text-right">Taxa</span>
      </div>
      {(Object.keys(LABELS) as (keyof TaxasMDR)[]).map((key) => (
        <div
          key={key}
          className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center"
        >
          <span className="text-sm font-medium text-foreground">{LABELS[key]}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAdjust(key, -0.01)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="text"
            className="w-16 h-8 text-center text-sm"
            value={taxas[key].toFixed(2).replace(".", ",")}
            onChange={(e) => handleInputChange(key, e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAdjust(key, 0.01)}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-semibold text-foreground text-right min-w-[60px]">
            {taxas[key].toFixed(2).replace(".", ",")}%
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/taxas-mdr-editor.tsx
git commit -m "feat: add TaxasMDREditor component with +/- buttons"
```

---

### Task 5: Step 1 — Cliente (Patient Search + Quick Registration)

**Files:**
- Create: `components/propostas/steps/step-cliente.tsx`

- [ ] **Step 1: Create the step-cliente component**

Create `components/propostas/steps/step-cliente.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, Check } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { Paciente } from "../types"

interface StepClienteProps {
  pacienteId: number | null
  nomeCliente: string
  cpfCliente: string
  onSelect: (paciente: { id: number; nome: string; cpf: string }) => void
}

export function StepCliente({ pacienteId, nomeCliente, cpfCliente, onSelect }: StepClienteProps) {
  const [search, setSearch] = useState(nomeCliente || "")
  const [results, setResults] = useState<Paciente[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Paciente | null>(null)
  const [showCadastro, setShowCadastro] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [novoCpf, setNovoCpf] = useState("")
  const [novoTelefone, setNovoTelefone] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [saving, setSaving] = useState(false)

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(() => buscarPacientes(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  async function buscarPacientes(term: string) {
    try {
      setSearching(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, cpf_cnpj, telefone, telefone_celular, email, ativo")
        .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%`)
        .eq("ativo", true)
        .limit(10)

      if (error) {
        console.error("[propostas] Erro ao buscar pacientes:", error.message)
        return
      }
      setResults((data as Paciente[]) || [])
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setSearching(false)
    }
  }

  function handleSelect(paciente: Paciente) {
    setSelected(paciente)
    setSearch(paciente.nome)
    setResults([])
    onSelect({
      id: paciente.id,
      nome: paciente.nome,
      cpf: paciente.cpf_cnpj || "",
    })
  }

  async function handleCadastrar() {
    if (!novoNome.trim()) return
    try {
      setSaving(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("pacientes")
        .insert({
          nome: novoNome.trim(),
          cpf_cnpj: novoCpf.trim() || null,
          telefone_celular: novoTelefone.trim() || null,
          email: novoEmail.trim() || null,
          ativo: true,
        })
        .select()
        .single()

      if (error) {
        console.error("[propostas] Erro ao cadastrar paciente:", error.message)
        return
      }
      if (data) {
        const paciente = data as Paciente
        setSelected(paciente)
        setSearch(paciente.nome)
        setShowCadastro(false)
        onSelect({
          id: paciente.id,
          nome: paciente.nome,
          cpf: paciente.cpf_cnpj || "",
        })
      }
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-2 block">Buscar Paciente</Label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Digite o nome ou CPF do paciente..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelected(null)
            }}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {results.length > 0 && !selected && (
          <Card className="mt-2 divide-y divide-border max-h-60 overflow-y-auto">
            {results.map((paciente) => (
              <button
                key={paciente.id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                onClick={() => handleSelect(paciente)}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{paciente.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {paciente.cpf_cnpj || "Sem CPF"} • {paciente.telefone_celular || paciente.telefone || "Sem telefone"}
                  </p>
                </div>
              </button>
            ))}
          </Card>
        )}

        {search.length >= 2 && results.length === 0 && !searching && !selected && (
          <div className="mt-2 text-sm text-muted-foreground">
            Nenhum paciente encontrado.{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => {
                setShowCadastro(true)
                setNovoNome(search)
              }}
            >
              Cadastrar novo paciente
            </button>
          </div>
        )}
      </div>

      {selected && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selected.nome}</p>
              <p className="text-xs text-muted-foreground">
                CPF: {selected.cpf_cnpj || "Nao informado"} • {selected.email || "Sem email"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {showCadastro && !selected && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Cadastrar Novo Paciente</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Nome *</Label>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">CPF</Label>
              <Input value={novoCpf} onChange={(e) => setNovoCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Telefone</Label>
              <Input value={novoTelefone} onChange={(e) => setNovoTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Email</Label>
              <Input value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowCadastro(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCadastrar} disabled={!novoNome.trim() || saving}>
              {saving ? "Salvando..." : "Cadastrar e Selecionar"}
            </Button>
          </div>
        </Card>
      )}

      {!selected && !showCadastro && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-2">Ou cadastre um novo paciente</p>
          <Button type="button" variant="outline" onClick={() => setShowCadastro(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Cadastrar Novo Paciente
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/steps/step-cliente.tsx
git commit -m "feat: add StepCliente with patient search and quick registration"
```

---

### Task 6: Step 2 — Procedimentos (Items + Discounts)

**Files:**
- Create: `components/propostas/steps/step-procedimentos.tsx`

- [ ] **Step 1: Create the step-procedimentos component**

Create `components/propostas/steps/step-procedimentos.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Percent, DollarSign } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { PropostaItem, Procedimento, Profissional } from "../types"

interface StepProcedimentosProps {
  itens: PropostaItem[]
  onChange: (itens: PropostaItem[]) => void
}

export function StepProcedimentos({ itens, onChange }: StepProcedimentosProps) {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const supabase = getSupabase()
        const [procRes, profRes] = await Promise.all([
          supabase.from("procedimentos").select("*").eq("ativo", true).order("nome"),
          supabase.from("profissionais").select("*").eq("ativo", true).order("nome"),
        ])
        if (procRes.data) setProcedimentos(procRes.data as Procedimento[])
        if (profRes.data) setProfissionais(profRes.data as Profissional[])
      } catch (error) {
        console.error("[propostas] Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function addItem() {
    onChange([
      ...itens,
      {
        procedimentoId: "",
        procedimentoNome: "",
        profissionalNome: "",
        valor: 0,
        desconto_tipo: null,
        desconto_valor: null,
        valor_final: 0,
      },
    ])
  }

  function removeItem(index: number) {
    onChange(itens.filter((_, i) => i !== index))
  }

  function updateItem(index: number, updates: Partial<PropostaItem>) {
    const newItens = itens.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, ...updates }
      updated.valor_final = calcularValorFinal(updated)
      return updated
    })
    onChange(newItens)
  }

  function calcularValorFinal(item: PropostaItem): number {
    if (!item.desconto_tipo || !item.desconto_valor) return item.valor
    if (item.desconto_tipo === "percentual") {
      return item.valor - (item.valor * item.desconto_valor) / 100
    }
    return item.valor - item.desconto_valor
  }

  function toggleDesconto(index: number) {
    const item = itens[index]
    if (item.desconto_tipo) {
      updateItem(index, { desconto_tipo: null, desconto_valor: null })
    } else {
      updateItem(index, { desconto_tipo: "percentual", desconto_valor: 0 })
    }
  }

  const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {itens.map((item, index) => (
        <Card key={index} className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Item {index + 1}</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Profissional</Label>
              <Select
                value={item.profissionalNome}
                onValueChange={(value) => updateItem(index, { profissionalNome: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.nome}>
                      {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Procedimento</Label>
              <Select
                value={item.procedimentoId}
                onValueChange={(value) => {
                  const proc = procedimentos.find((p) => String(p.id) === value)
                  updateItem(index, {
                    procedimentoId: value,
                    procedimentoNome: proc?.nome || "",
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedimentos.map((proc) => (
                    <SelectItem key={proc.id} value={String(proc.id)}>
                      {proc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <Label className="text-xs mb-1 block">Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.valor || ""}
                onChange={(e) => updateItem(index, { valor: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Button
                type="button"
                variant={item.desconto_tipo ? "default" : "outline"}
                size="sm"
                className="gap-1"
                onClick={() => toggleDesconto(index)}
              >
                <Percent className="w-3 h-3" />
                {item.desconto_tipo ? "Remover Desconto" : "Adicionar Desconto"}
              </Button>
            </div>
            <div className="text-right">
              <Label className="text-xs mb-1 block text-muted-foreground">Valor Final</Label>
              <p className="text-lg font-bold text-foreground">{formatCurrency(item.valor_final)}</p>
            </div>
          </div>

          {item.desconto_tipo && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={item.desconto_tipo === "percentual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateItem(index, { desconto_tipo: "percentual" })}
                >
                  <Percent className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant={item.desconto_tipo === "valor" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateItem(index, { desconto_tipo: "valor" })}
                >
                  <DollarSign className="w-3 h-3" />
                </Button>
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="w-28"
                value={item.desconto_valor || ""}
                onChange={(e) => updateItem(index, { desconto_valor: parseFloat(e.target.value) || 0 })}
                placeholder={item.desconto_tipo === "percentual" ? "%" : "R$"}
              />
              <span className="text-xs text-muted-foreground">
                {item.desconto_tipo === "percentual"
                  ? `- ${formatCurrency((item.valor * (item.desconto_valor || 0)) / 100)}`
                  : `- ${formatCurrency(item.desconto_valor || 0)}`}
              </span>
            </div>
          )}
        </Card>
      ))}

      <Button type="button" variant="outline" className="w-full gap-2 border-dashed" onClick={addItem}>
        <Plus className="w-4 h-4" />
        Adicionar Procedimento
      </Button>

      {itens.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Subtotal ({itens.length} {itens.length === 1 ? "item" : "itens"})</span>
          <span className="text-xl font-bold text-foreground">{formatCurrency(subtotal)}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/steps/step-procedimentos.tsx
git commit -m "feat: add StepProcedimentos with items and per-item discounts"
```

---

### Task 7: Step 3 — Cenarios de Pagamento

**Files:**
- Create: `components/propostas/steps/step-cenarios.tsx`

- [ ] **Step 1: Create the step-cenarios component**

Create `components/propostas/steps/step-cenarios.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, Zap, Scale, Shield, SlidersHorizontal } from "lucide-react"
import { TaxasMDREditor } from "../taxas-mdr-editor"
import type { CenarioTipo, TaxasMDR } from "../types"
import { CENARIOS } from "../types"

interface StepCenariosProps {
  valorTotal: number
  cenarioTipo: CenarioTipo
  valorEntrada: number
  numParcelas: number
  taxas: TaxasMDR
  onCenarioChange: (cenario: CenarioTipo, entrada: number, parcelas: number) => void
  onTaxasChange: (taxas: TaxasMDR) => void
}

const CENARIO_ICONS = {
  agressivo: Zap,
  balanceado: Scale,
  conservador: Shield,
  personalizado: SlidersHorizontal,
}

const CENARIO_LABELS = {
  agressivo: "Agressivo",
  balanceado: "Balanceado",
  conservador: "Conservador",
  personalizado: "Personalizado",
}

const CENARIO_DESC = {
  agressivo: "50% de entrada + 6 parcelas. Melhor fluxo de caixa.",
  balanceado: "30% de entrada + 8 parcelas. Equilibrio entre caixa e acessibilidade.",
  conservador: "10% de entrada + 12 parcelas. Mais acessivel para o cliente.",
  personalizado: "Defina a entrada e parcelas manualmente.",
}

export function StepCenarios({
  valorTotal,
  cenarioTipo,
  valorEntrada,
  numParcelas,
  taxas,
  onCenarioChange,
  onTaxasChange,
}: StepCenariosProps) {
  const [customEntradaPct, setCustomEntradaPct] = useState(30)
  const [customParcelas, setCustomParcelas] = useState(6)
  const [mdrOpen, setMdrOpen] = useState(false)

  function selectCenario(tipo: CenarioTipo) {
    if (tipo === "personalizado") {
      const entrada = (valorTotal * customEntradaPct) / 100
      onCenarioChange(tipo, entrada, customParcelas)
    } else {
      const config = CENARIOS[tipo]
      const entrada = (valorTotal * config.entrada_pct) / 100
      onCenarioChange(tipo, entrada, config.parcelas)
    }
  }

  function handleCustomChange(entradaPct: number, parcelas: number) {
    setCustomEntradaPct(entradaPct)
    setCustomParcelas(parcelas)
    if (cenarioTipo === "personalizado") {
      const entrada = (valorTotal * entradaPct) / 100
      onCenarioChange("personalizado", entrada, parcelas)
    }
  }

  const valorParcela = numParcelas > 0 ? (valorTotal - valorEntrada) / numParcelas : 0

  function calcularMDR(): number {
    if (numParcelas === 0) return 0
    const valorParcelado = valorTotal - valorEntrada
    let taxaMdr = taxas.parcelado_2_6
    if (numParcelas > 6) taxaMdr = taxas.parcelado_7_12
    return (valorParcelado * taxaMdr) / 100
  }

  const custoMDR = calcularMDR()
  const valorLiquido = valorTotal - custoMDR

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["agressivo", "balanceado", "conservador", "personalizado"] as CenarioTipo[]).map((tipo) => {
          const Icon = CENARIO_ICONS[tipo]
          const isSelected = cenarioTipo === tipo
          return (
            <Card
              key={tipo}
              className={`p-4 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "hover:border-primary/50 hover:shadow-md"
              }`}
              onClick={() => selectCenario(tipo)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{CENARIO_LABELS[tipo]}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{CENARIO_DESC[tipo]}</p>
                  {tipo !== "personalizado" && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatCurrency((valorTotal * CENARIOS[tipo].entrada_pct) / 100)}
                      </span>
                      {" entrada + "}
                      <span className="font-medium text-foreground">{CENARIOS[tipo].parcelas}x</span>
                      {" de "}
                      <span className="font-medium text-foreground">
                        {formatCurrency((valorTotal - (valorTotal * CENARIOS[tipo].entrada_pct) / 100) / CENARIOS[tipo].parcelas)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {cenarioTipo === "personalizado" && (
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Configuracao Personalizada</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Entrada (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={customEntradaPct}
                onChange={(e) => handleCustomChange(parseFloat(e.target.value) || 0, customParcelas)}
              />
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency((valorTotal * customEntradaPct) / 100)}</p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Parcelas</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={customParcelas}
                onChange={(e) => handleCustomChange(customEntradaPct, parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(valorParcela)} / parcela</p>
            </div>
          </div>
        </Card>
      )}

      {cenarioTipo && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Resumo do Cenario</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Entrada</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(valorEntrada)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Parcelas</p>
              <p className="text-lg font-bold text-foreground">{numParcelas}x {formatCurrency(valorParcela)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo MDR</p>
              <p className="text-lg font-bold text-destructive">- {formatCurrency(custoMDR)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Liquido</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(valorLiquido)}</p>
            </div>
          </div>
        </Card>
      )}

      <Collapsible open={mdrOpen} onOpenChange={setMdrOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
          <ChevronDown className={`w-4 h-4 transition-transform ${mdrOpen ? "rotate-180" : ""}`} />
          Taxas MDR
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="p-4">
            <TaxasMDREditor taxas={taxas} onChange={onTaxasChange} />
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/steps/step-cenarios.tsx
git commit -m "feat: add StepCenarios with payment scenarios and MDR editor"
```

---

### Task 8: Step 4 — Resumo (Review + Save)

**Files:**
- Create: `components/propostas/steps/step-resumo.tsx`

- [ ] **Step 1: Create the step-resumo component**

Create `components/propostas/steps/step-resumo.tsx`:

```tsx
"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Percent, DollarSign, User, Stethoscope, CreditCard, FileText } from "lucide-react"
import type { PropostaItem, CenarioTipo, TaxasMDR } from "../types"
import { CENARIOS } from "../types"

interface StepResumoProps {
  nomeCliente: string
  cpfCliente: string
  itens: PropostaItem[]
  cenarioTipo: CenarioTipo
  valorEntrada: number
  numParcelas: number
  taxas: TaxasMDR
  descontoProtocoloTipo: "percentual" | "valor" | null
  descontoProtocoloValor: number
  observacoes: string
  onDescontoProtocoloChange: (tipo: "percentual" | "valor" | null, valor: number) => void
  onObservacoesChange: (obs: string) => void
}

export function StepResumo({
  nomeCliente,
  cpfCliente,
  itens,
  cenarioTipo,
  valorEntrada,
  numParcelas,
  taxas,
  descontoProtocoloTipo,
  descontoProtocoloValor,
  observacoes,
  onDescontoProtocoloChange,
  onObservacoesChange,
}: StepResumoProps) {
  const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
  const descontoItens = itens.reduce((sum, item) => sum + (item.valor - item.valor_final), 0)

  function calcDescontoProtocolo(): number {
    if (!descontoProtocoloTipo || !descontoProtocoloValor) return 0
    if (descontoProtocoloTipo === "percentual") return (subtotal * descontoProtocoloValor) / 100
    return descontoProtocoloValor
  }

  const descontoProtocolo = calcDescontoProtocolo()
  const valorTotal = subtotal - descontoProtocolo
  const valorParcela = numParcelas > 0 ? (valorTotal - valorEntrada) / numParcelas : 0

  function calcMDR(): number {
    const valorParcelado = valorTotal - valorEntrada
    if (valorParcelado <= 0 || numParcelas === 0) return 0
    let taxa = taxas.parcelado_2_6
    if (numParcelas > 6) taxa = taxas.parcelado_7_12
    return (valorParcelado * taxa) / 100
  }

  const custoMDR = calcMDR()
  const valorLiquido = valorTotal - custoMDR

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  const cenarioLabel = cenarioTipo === "personalizado"
    ? "Personalizado"
    : { agressivo: "Agressivo", balanceado: "Balanceado", conservador: "Conservador" }[cenarioTipo]

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Nome</p>
            <p className="font-medium text-foreground">{nomeCliente}</p>
          </div>
          <div>
            <p className="text-muted-foreground">CPF</p>
            <p className="font-medium text-foreground">{cpfCliente || "Nao informado"}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Procedimentos ({itens.length})</h3>
        </div>
        <div className="space-y-2">
          {itens.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">{item.procedimentoNome}</p>
                <p className="text-xs text-muted-foreground">{item.profissionalNome}</p>
              </div>
              <div className="text-right">
                {item.desconto_tipo && (
                  <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.valor)}</p>
                )}
                <p className="font-medium text-foreground">{formatCurrency(item.valor_final)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cenario: {cenarioLabel}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Entrada</p>
            <p className="font-medium text-foreground">{formatCurrency(valorEntrada)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Parcelas</p>
            <p className="font-medium text-foreground">{numParcelas}x {formatCurrency(valorParcela)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fluxo Imediato</p>
            <p className="font-medium text-foreground">{formatCurrency(valorEntrada)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Desconto de Protocolo</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button
              type="button"
              variant={descontoProtocoloTipo === "percentual" ? "default" : "outline"}
              size="sm"
              onClick={() => onDescontoProtocoloChange("percentual", descontoProtocoloValor)}
            >
              <Percent className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant={descontoProtocoloTipo === "valor" ? "default" : "outline"}
              size="sm"
              onClick={() => onDescontoProtocoloChange("valor", descontoProtocoloValor)}
            >
              <DollarSign className="w-3 h-3" />
            </Button>
            {descontoProtocoloTipo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDescontoProtocoloChange(null, 0)}
                className="text-xs"
              >
                Limpar
              </Button>
            )}
          </div>
          {descontoProtocoloTipo && (
            <>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="w-28"
                value={descontoProtocoloValor || ""}
                onChange={(e) => onDescontoProtocoloChange(descontoProtocoloTipo, parseFloat(e.target.value) || 0)}
                placeholder={descontoProtocoloTipo === "percentual" ? "%" : "R$"}
              />
              <span className="text-sm text-muted-foreground">= - {formatCurrency(descontoProtocolo)}</span>
            </>
          )}
        </div>
      </Card>

      <div>
        <Label className="text-sm font-medium mb-2 block">Observacoes</Label>
        <Textarea
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
          placeholder="Adicione observacoes sobre a proposta..."
          rows={3}
        />
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          {descontoItens > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto itens</span>
              <span className="text-destructive">- {formatCurrency(descontoItens)}</span>
            </div>
          )}
          {descontoProtocolo > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto protocolo</span>
              <span className="text-destructive">- {formatCurrency(descontoProtocolo)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-semibold text-foreground">Valor Total</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(valorTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo MDR</span>
            <span className="text-destructive">- {formatCurrency(custoMDR)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-semibold text-primary">Valor Liquido</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(valorLiquido)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/steps/step-resumo.tsx
git commit -m "feat: add StepResumo with protocol discount and financial summary"
```

---

### Task 9: Proposta Form (Stepper Wizard Container)

**Files:**
- Create: `components/propostas/proposta-form.tsx`

- [ ] **Step 1: Create the wizard/stepper component**

Create `components/propostas/proposta-form.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { StepCliente } from "./steps/step-cliente"
import { StepProcedimentos } from "./steps/step-procedimentos"
import { StepCenarios } from "./steps/step-cenarios"
import { StepResumo } from "./steps/step-resumo"
import type { Proposta, PropostaItem, CenarioTipo, TaxasMDR } from "./types"
import { TAXAS_MDR_PADRAO, CENARIOS } from "./types"

interface PropostaFormProps {
  proposta?: Proposta | null
  onSave: () => void
  onCancel: () => void
}

const STEPS = [
  { label: "Cliente", number: 1 },
  { label: "Procedimentos", number: 2 },
  { label: "Cenarios", number: 3 },
  { label: "Resumo", number: 4 },
]

function loadTaxas(): TaxasMDR {
  if (typeof window === "undefined") return TAXAS_MDR_PADRAO
  try {
    const saved = localStorage.getItem("taxas_mdr")
    if (saved) return JSON.parse(saved)
  } catch {}
  return TAXAS_MDR_PADRAO
}

function saveTaxas(taxas: TaxasMDR) {
  try {
    localStorage.setItem("taxas_mdr", JSON.stringify(taxas))
  } catch {}
}

export function PropostaForm({ proposta, onSave, onCancel }: PropostaFormProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1 state
  const [pacienteId, setPacienteId] = useState<number | null>(proposta?.paciente_id ?? null)
  const [nomeCliente, setNomeCliente] = useState(proposta?.nome_cliente ?? "")
  const [cpfCliente, setCpfCliente] = useState(proposta?.cpf_cliente ?? "")

  // Step 2 state
  const [itens, setItens] = useState<PropostaItem[]>(proposta?.itens ?? [])

  // Step 3 state
  const [cenarioTipo, setCenarioTipo] = useState<CenarioTipo>(proposta?.cenario_tipo ?? "balanceado")
  const [valorEntrada, setValorEntrada] = useState(proposta?.valor_entrada ?? 0)
  const [numParcelas, setNumParcelas] = useState(proposta?.num_parcelas ?? 8)
  const [taxas, setTaxas] = useState<TaxasMDR>(loadTaxas)

  // Step 4 state
  const [descontoProtocoloTipo, setDescontoProtocoloTipo] = useState<"percentual" | "valor" | null>(
    proposta?.desconto_protocolo_percentual ? "percentual" : proposta?.desconto_protocolo_valor ? "valor" : null
  )
  const [descontoProtocoloValor, setDescontoProtocoloValor] = useState(
    proposta?.desconto_protocolo_percentual || proposta?.desconto_protocolo_valor || 0
  )
  const [observacoes, setObservacoes] = useState(proposta?.observacoes ?? "")

  // Recalculate cenario when itens change
  useEffect(() => {
    if (itens.length === 0) return
    const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
    if (cenarioTipo !== "personalizado") {
      const config = CENARIOS[cenarioTipo]
      setValorEntrada((subtotal * config.entrada_pct) / 100)
      setNumParcelas(config.parcelas)
    }
  }, [itens, cenarioTipo])

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  function handleCenarioChange(tipo: CenarioTipo, entrada: number, parcelas: number) {
    setCenarioTipo(tipo)
    setValorEntrada(entrada)
    setNumParcelas(parcelas)
  }

  function handleTaxasChange(newTaxas: TaxasMDR) {
    setTaxas(newTaxas)
    saveTaxas(newTaxas)
  }

  function calcDescontoProtocolo(): number {
    const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
    if (!descontoProtocoloTipo || !descontoProtocoloValor) return 0
    if (descontoProtocoloTipo === "percentual") return (subtotal * descontoProtocoloValor) / 100
    return descontoProtocoloValor
  }

  async function handleSave() {
    try {
      setSaving(true)
      const supabase = getSupabase()

      const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
      const descontoItens = itens.reduce((sum, item) => sum + (item.valor - item.valor_final), 0)
      const descontoProtocolo = calcDescontoProtocolo()
      const valorTotal = subtotal - descontoProtocolo

      // Recalc entrada based on valorTotal (not subtotal)
      let finalEntrada = valorEntrada
      let finalParcelas = numParcelas
      if (cenarioTipo !== "personalizado") {
        const config = CENARIOS[cenarioTipo]
        finalEntrada = (valorTotal * config.entrada_pct) / 100
        finalParcelas = config.parcelas
      }

      const payload = {
        paciente_id: pacienteId,
        nome_cliente: nomeCliente,
        cpf_cliente: cpfCliente,
        itens,
        valor_subtotal: subtotal,
        valor_desconto_itens: descontoItens,
        desconto_protocolo_percentual: descontoProtocoloTipo === "percentual" ? descontoProtocoloValor : 0,
        desconto_protocolo_valor: descontoProtocoloTipo === "valor" ? descontoProtocoloValor : 0,
        valor_desconto_protocolo: descontoProtocolo,
        valor_total: valorTotal,
        cenario_tipo: cenarioTipo,
        valor_entrada: finalEntrada,
        num_parcelas: finalParcelas,
        fluxo_caixa_imediato: finalEntrada,
        status: proposta?.status ?? "em_negociacao",
        observacoes: observacoes || null,
      }

      if (proposta) {
        const { error } = await supabase.from("propostas").update(payload).eq("id", proposta.id)
        if (error) {
          console.error("[propostas] Erro ao atualizar:", error.message)
          return
        }
      } else {
        const { error } = await supabase.from("propostas").insert(payload)
        if (error) {
          console.error("[propostas] Erro ao criar:", error.message)
          return
        }
      }

      onSave()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setSaving(false)
    }
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return pacienteId !== null && nomeCliente.length > 0
      case 2:
        return itens.length > 0 && itens.every((i) => i.procedimentoNome && i.valor > 0)
      case 3:
        return cenarioTipo !== null
      default:
        return true
    }
  }

  const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                  step >= s.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.number}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s.number ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${step > s.number ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {step === 1 && (
          <StepCliente
            pacienteId={pacienteId}
            nomeCliente={nomeCliente}
            cpfCliente={cpfCliente}
            onSelect={(p) => {
              setPacienteId(p.id)
              setNomeCliente(p.nome)
              setCpfCliente(p.cpf)
            }}
          />
        )}
        {step === 2 && (
          <StepProcedimentos itens={itens} onChange={setItens} />
        )}
        {step === 3 && (
          <StepCenarios
            valorTotal={subtotal}
            cenarioTipo={cenarioTipo}
            valorEntrada={valorEntrada}
            numParcelas={numParcelas}
            taxas={taxas}
            onCenarioChange={handleCenarioChange}
            onTaxasChange={handleTaxasChange}
          />
        )}
        {step === 4 && (
          <StepResumo
            nomeCliente={nomeCliente}
            cpfCliente={cpfCliente}
            itens={itens}
            cenarioTipo={cenarioTipo}
            valorEntrada={valorEntrada}
            numParcelas={numParcelas}
            taxas={taxas}
            descontoProtocoloTipo={descontoProtocoloTipo}
            descontoProtocoloValor={descontoProtocoloValor}
            observacoes={observacoes}
            onDescontoProtocoloChange={(tipo, valor) => {
              setDescontoProtocoloTipo(tipo)
              setDescontoProtocoloValor(valor)
            }}
            onObservacoesChange={setObservacoes}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="gap-2"
          >
            Proximo
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : proposta ? "Atualizar Proposta" : "Salvar Proposta"}
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/proposta-form.tsx
git commit -m "feat: add PropostaForm stepper wizard with 4 steps"
```

---

### Task 10: Proposta Detalhes (Sheet)

**Files:**
- Create: `components/propostas/proposta-detalhes.tsx`

- [ ] **Step 1: Create the details sheet component**

Create `components/propostas/proposta-detalhes.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Pencil, Copy, RefreshCw, User, Stethoscope, CreditCard, FileText, Clock } from "lucide-react"
import type { Proposta, PropostaStatus } from "./types"
import { STATUS_CONFIG } from "./types"

interface PropostaDetalhesProps {
  proposta: Proposta | null
  open: boolean
  onClose: () => void
  onEditar: (proposta: Proposta) => void
  onDuplicar: (proposta: Proposta) => void
}

export function PropostaDetalhes({ proposta, open, onClose, onEditar, onDuplicar }: PropostaDetalhesProps) {
  if (!proposta) return null

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const cenarioLabel = {
    agressivo: "Agressivo",
    balanceado: "Balanceado",
    conservador: "Conservador",
    personalizado: "Personalizado",
  }[proposta.cenario_tipo]

  const valorParcela = proposta.num_parcelas > 0
    ? (proposta.valor_total - proposta.valor_entrada) / proposta.num_parcelas
    : 0

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            Proposta #{proposta.id}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[proposta.status].color}`}>
              {STATUS_CONFIG[proposta.status].label}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="w-4 h-4 text-primary" />
              Cliente
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm pl-6">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-medium">{proposta.nome_cliente}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CPF</p>
                <p className="font-medium">{proposta.cpf_cliente || "Nao informado"}</p>
              </div>
            </div>
          </div>

          {/* Procedimentos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Stethoscope className="w-4 h-4 text-primary" />
              Procedimentos ({proposta.itens.length})
            </div>
            <div className="pl-6 space-y-2">
              {proposta.itens.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{item.procedimentoNome}</p>
                    <p className="text-xs text-muted-foreground">{item.profissionalNome}</p>
                  </div>
                  <div className="text-right">
                    {item.desconto_tipo && (
                      <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.valor)}</p>
                    )}
                    <p className="font-medium">{formatCurrency(item.valor_final)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cenario */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="w-4 h-4 text-primary" />
              Cenario: {cenarioLabel}
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm pl-6">
              <div>
                <p className="text-muted-foreground">Entrada</p>
                <p className="font-medium">{formatCurrency(proposta.valor_entrada)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parcelas</p>
                <p className="font-medium">{proposta.num_parcelas}x {formatCurrency(valorParcela)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fluxo Imediato</p>
                <p className="font-medium">{formatCurrency(proposta.fluxo_caixa_imediato)}</p>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              Valores
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(proposta.valor_subtotal)}</span>
              </div>
              {proposta.valor_desconto_itens > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto itens</span>
                  <span className="text-destructive">- {formatCurrency(proposta.valor_desconto_itens)}</span>
                </div>
              )}
              {proposta.valor_desconto_protocolo > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto protocolo</span>
                  <span className="text-destructive">- {formatCurrency(proposta.valor_desconto_protocolo)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Valor Total</span>
                <span className="text-lg">{formatCurrency(proposta.valor_total)}</span>
              </div>
            </div>
          </div>

          {/* Observacoes */}
          {proposta.observacoes && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Observacoes</p>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{proposta.observacoes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Criado em: {formatDate(proposta.created_at)}
            </div>
            {proposta.updated_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Atualizado em: {formatDate(proposta.updated_at)}
              </div>
            )}
          </div>

          {/* Acoes */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                onClose()
                onEditar(proposta)
              }}
            >
              <Pencil className="w-4 h-4" /> Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                onClose()
                onDuplicar(proposta)
              }}
            >
              <Copy className="w-4 h-4" /> Duplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/proposta-detalhes.tsx
git commit -m "feat: add PropostaDetalhes sheet with full proposal view"
```

---

### Task 11: Wire Everything Together in PropostasContent

**Files:**
- Modify: `components/propostas/propostas-content.tsx`

- [ ] **Step 1: Replace the placeholder with the full orchestrator**

Replace the entire content of `components/propostas/propostas-content.tsx`:

```tsx
"use client"

import { useState } from "react"
import { PropostasLista } from "./propostas-lista"
import { PropostaForm } from "./proposta-form"
import { PropostaDetalhes } from "./proposta-detalhes"
import { createClient } from "@supabase/supabase-js"
import type { Proposta } from "./types"

type View = "lista" | "nova" | "editar"

export function PropostasContent() {
  const [view, setView] = useState<View>("lista")
  const [editProposta, setEditProposta] = useState<Proposta | null>(null)
  const [detalheProposta, setDetalheProposta] = useState<Proposta | null>(null)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [listKey, setListKey] = useState(0)

  function handleNovaProposta() {
    setEditProposta(null)
    setView("nova")
  }

  function handleEditarProposta(proposta: Proposta) {
    setEditProposta(proposta)
    setView("editar")
  }

  function handleVerDetalhes(proposta: Proposta) {
    setDetalheProposta(proposta)
    setDetalheOpen(true)
  }

  function handleSave() {
    setView("lista")
    setEditProposta(null)
    setListKey((k) => k + 1)
  }

  function handleCancel() {
    setView("lista")
    setEditProposta(null)
  }

  async function handleDuplicar(proposta: Proposta) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
      if (!url || !key) return
      const supabase = createClient(url, key)
      const { id, created_at, updated_at, ...rest } = proposta
      await supabase.from("propostas").insert({
        ...rest,
        nome_cliente: `${proposta.nome_cliente} (copia)`,
        status: "em_negociacao",
      })
      setListKey((k) => k + 1)
    } catch (error) {
      console.error("[propostas] Erro ao duplicar:", error)
    }
  }

  return (
    <div>
      {view === "lista" && (
        <PropostasLista
          key={listKey}
          onNovaProposta={handleNovaProposta}
          onEditarProposta={handleEditarProposta}
          onVerDetalhes={handleVerDetalhes}
        />
      )}

      {(view === "nova" || view === "editar") && (
        <PropostaForm
          proposta={view === "editar" ? editProposta : null}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <PropostaDetalhes
        proposta={detalheProposta}
        open={detalheOpen}
        onClose={() => setDetalheOpen(false)}
        onEditar={handleEditarProposta}
        onDuplicar={handleDuplicar}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify end-to-end**

Run: `npm run dev` — navigate to `http://localhost:3000/proposta`

**Verify:**
1. List page loads and shows existing proposals from Supabase
2. Search filters by name and CPF
3. Status filter buttons work
4. Click "Nova Proposta" opens the wizard
5. Step 1: search a patient, select it, advance
6. Step 2: add a procedure, set value, add discount, advance
7. Step 3: select a payment scenario, see MDR editor, advance
8. Step 4: review summary, add protocol discount, add notes, save
9. New proposal appears in the list
10. Actions menu: edit, duplicate, status change, delete all work
11. Sheet opens with full proposal details

- [ ] **Step 3: Commit**

```bash
git add components/propostas/propostas-content.tsx
git commit -m "feat: wire PropostasContent orchestrator with all sub-components"
```

---

### Task 12: Update Proposta Page Header with Action Button

**Files:**
- Modify: `app/proposta/page.tsx`

- [ ] **Step 1: Update the page to remove the static button**

The "Nova Proposta" button is already in the list component, so the page header should not duplicate it. Update `app/proposta/page.tsx` to remove the `actions` prop:

```tsx
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PropostasContent } from "@/components/propostas/propostas-content"

export default function PropostaPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header
          title="Propostas"
          description="Crie e gerencie propostas comerciais para seus pacientes."
        />

        <div className="mt-6">
          <PropostasContent />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Final verification and commit**

Run: `npm run dev` — full end-to-end check.

```bash
git add app/proposta/page.tsx
git commit -m "feat: finalize Proposta page layout"
```

---

## Summary

| Task | Description | Files |
|---|---|---|
| 1 | Route setup + sidebar update | `app/proposta/page.tsx`, `sidebar.tsx` |
| 2 | TypeScript types | `components/propostas/types.ts` |
| 3 | Propostas list with filters | `propostas-lista.tsx` |
| 4 | Taxas MDR editor | `taxas-mdr-editor.tsx` |
| 5 | Step 1 — Cliente | `steps/step-cliente.tsx` |
| 6 | Step 2 — Procedimentos | `steps/step-procedimentos.tsx` |
| 7 | Step 3 — Cenarios | `steps/step-cenarios.tsx` |
| 8 | Step 4 — Resumo | `steps/step-resumo.tsx` |
| 9 | Stepper wizard container | `proposta-form.tsx` |
| 10 | Proposal details sheet | `proposta-detalhes.tsx` |
| 11 | Wire everything together | `propostas-content.tsx` |
| 12 | Finalize page layout | `app/proposta/page.tsx` |
