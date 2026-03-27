# Modulo Calendario — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a calendar module with monthly/weekly views, professional filters, appointment details, status management, and new appointment creation — all reading from Supabase tables synced with Clinica nas Nuvens.

**Architecture:** Monolithic component with extracted sub-components. `calendar-content.tsx` orchestrates view switching (monthly/weekly), filters, and data fetching. Sub-components handle each view and interaction. Data comes from Supabase tables `agendas` (primary), `agenda_completa` (for resolved names), `agenda_rotulos`, `agenda_local`, `agenda_tipos_consulta`, `pacientes`, and `profissionais`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Popover, Sheet, Select, Calendar), Supabase JS client, date-fns

**Note:** No test framework in this project. Steps use manual verification via `npm run dev`.

**Data note:** The `agenda_completa` view has profissional/local/rotulo/tipo_consulta as text but NO patient name. The `agendas` table has `id_paciente` but only IDs. Strategy: fetch `agendas` for data + do client-side lookup of patient names from a `pacientes` map loaded on mount. The `profissionais` table maps `id_pessoa` to `nome` (e.g. id_pessoa=4294792 → "Bruna de Moura Aguiar").

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Create | `components/calendario/types.ts` | TypeScript interfaces and constants |
| Create | `components/calendario/calendar-content.tsx` | Orchestrator: data fetching, filters, view toggle |
| Create | `components/calendario/calendar-month-view.tsx` | Monthly grid + day list |
| Create | `components/calendario/calendar-week-view.tsx` | Weekly timeline (7h-21h) |
| Create | `components/calendario/calendar-day-card.tsx` | Reusable appointment card |
| Create | `components/calendario/calendar-popover.tsx` | Quick popover on card click |
| Create | `components/calendario/calendar-detalhes.tsx` | Sheet with full details + status change |
| Create | `components/calendario/calendar-novo-agendamento.tsx` | New appointment form (Sheet) |
| Modify | `app/calendar/page.tsx` | Update to use new CalendarContent, remove action button |
| Delete | `components/calendar/calendar-content.tsx` | Old placeholder |

---

### Task 1: Types and Constants

**Files:**
- Create: `components/calendario/types.ts`

- [ ] **Step 1: Create types file**

Create `components/calendario/types.ts`:

```ts
export interface Agendamento {
  id: number
  data: string
  hora_inicio: string
  hora_fim: string
  id_paciente: number
  id_pessoa_executor: number
  id_local_agenda: number
  id_tipo_consulta: number
  id_tipo_convenio: number
  id_rotulo: number
  email_paciente: string | null
  telefone_celular_paciente: string | null
  observacoes: string | null
  encaminhamento: string | null
  url_sala_espera: string | null
  status: AgendaStatus
  procedimentos: AgendaProcedimento[]
  created_at: string
  // Resolved names (populated client-side)
  nome_paciente?: string
  nome_profissional?: string
  nome_local?: string
  nome_rotulo?: string
  cor_rotulo?: string
  nome_tipo_consulta?: string
}

export interface AgendaProcedimento {
  id: number
  idEspecialidade: number
  idPromocao: number | null
  idTipoProcedimento: number
  nome: string
  quantidade: number
}

export interface AgendaRotulo {
  id: number
  nome: string
  cor: string
}

export interface AgendaLocal {
  id: number
  nome: string
  cor: string
  ativo: boolean
}

export interface AgendaTipoConsulta {
  id: number
  nome: string
  ativo: boolean
  reconsulta: boolean
}

export interface ProfissionalMap {
  id: number
  id_pessoa: number
  nome: string
}

export type AgendaStatus =
  | "AGENDADO" | "CONFIRMADO" | "CONFIRMADO_PACIENTE"
  | "CANCELADO" | "CANCELADO_PACIENTE"
  | "EM_ESPERA" | "EM_ANDAMENTO" | "PRE_ATENDIMENTO"
  | "PAGAMENTO" | "FINALIZADO" | "FALTOU" | "REMARCOU"

export type CalendarView = "mensal" | "semanal"
export type ColorMode = "status" | "rotulo"

export const STATUS_CONFIG: Record<AgendaStatus, { label: string; color: string; dotColor: string }> = {
  AGENDADO: { label: "Agendado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", dotColor: "bg-blue-500" },
  CONFIRMADO: { label: "Confirmado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", dotColor: "bg-green-500" },
  CONFIRMADO_PACIENTE: { label: "Confirmado Paciente", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", dotColor: "bg-emerald-500" },
  CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", dotColor: "bg-red-500" },
  CANCELADO_PACIENTE: { label: "Cancelado Paciente", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200", dotColor: "bg-rose-500" },
  EM_ESPERA: { label: "Em Espera", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", dotColor: "bg-yellow-500" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", dotColor: "bg-orange-500" },
  PRE_ATENDIMENTO: { label: "Pre-Atendimento", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", dotColor: "bg-purple-500" },
  PAGAMENTO: { label: "Pagamento", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", dotColor: "bg-indigo-500" },
  FINALIZADO: { label: "Finalizado", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200", dotColor: "bg-teal-500" },
  FALTOU: { label: "Faltou", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", dotColor: "bg-gray-500" },
  REMARCOU: { label: "Remarcou", color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200", dotColor: "bg-sky-500" },
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as AgendaStatus[]
```

- [ ] **Step 2: Commit**

```bash
mkdir -p components/calendario
git add components/calendario/types.ts
git commit -m "feat: add TypeScript types for Calendario module"
```

---

### Task 2: Day Card Component

**Files:**
- Create: `components/calendario/calendar-day-card.tsx`

- [ ] **Step 1: Create the reusable card component**

Create `components/calendario/calendar-day-card.tsx`:

```tsx
"use client"

import { Card } from "@/components/ui/card"
import type { Agendamento, ColorMode } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarDayCardProps {
  agendamento: Agendamento
  colorMode: ColorMode
  onClick: (agendamento: Agendamento) => void
}

export function CalendarDayCard({ agendamento, colorMode, onClick }: CalendarDayCardProps) {
  const statusCfg = STATUS_CONFIG[agendamento.status] || STATUS_CONFIG.AGENDADO

  const barColor = colorMode === "rotulo" && agendamento.cor_rotulo
    ? agendamento.cor_rotulo
    : statusCfg.dotColor

  const barStyle = colorMode === "rotulo" && agendamento.cor_rotulo
    ? { backgroundColor: agendamento.cor_rotulo }
    : undefined

  return (
    <Card
      className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick(agendamento)}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-1 self-stretch rounded-full shrink-0 ${colorMode === "status" ? barColor : ""}`}
          style={barStyle}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {agendamento.hora_inicio.slice(0, 5)} - {agendamento.hora_fim.slice(0, 5)}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground truncate mt-0.5">
            {agendamento.nome_paciente || `Paciente #${agendamento.id_paciente}`}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {agendamento.nome_profissional || ""}
            {agendamento.nome_tipo_consulta ? ` • ${agendamento.nome_tipo_consulta}` : ""}
          </p>
          {agendamento.procedimentos && agendamento.procedimentos.length > 0 && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {agendamento.procedimentos.map((p) => p.nome).join(", ")}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendario/calendar-day-card.tsx
git commit -m "feat: add CalendarDayCard component"
```

---

### Task 3: Popover Component

**Files:**
- Create: `components/calendario/calendar-popover.tsx`

- [ ] **Step 1: Create the popover component**

Create `components/calendario/calendar-popover.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Eye, Clock, User, Stethoscope } from "lucide-react"
import type { Agendamento } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarPopoverProps {
  agendamento: Agendamento
  children: React.ReactNode
  onVerDetalhes: (agendamento: Agendamento) => void
}

export function CalendarPopover({ agendamento, children, onVerDetalhes }: CalendarPopoverProps) {
  const statusCfg = STATUS_CONFIG[agendamento.status] || STATUS_CONFIG.AGENDADO

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className="text-xs text-muted-foreground">#{agendamento.id}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{agendamento.hora_inicio.slice(0, 5)} - {agendamento.hora_fim.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{agendamento.nome_paciente || `Paciente #${agendamento.id_paciente}`}</span>
            </div>
            {agendamento.nome_profissional && (
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{agendamento.nome_profissional}</span>
              </div>
            )}
            {agendamento.nome_tipo_consulta && (
              <p className="text-xs text-muted-foreground pl-5.5">{agendamento.nome_tipo_consulta}</p>
            )}
          </div>

          <Button
            size="sm"
            className="w-full gap-2"
            onClick={() => onVerDetalhes(agendamento)}
          >
            <Eye className="w-3.5 h-3.5" />
            Ver detalhes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendario/calendar-popover.tsx
git commit -m "feat: add CalendarPopover component"
```

---

### Task 4: Details Sheet + Status Change

**Files:**
- Create: `components/calendario/calendar-detalhes.tsx`

- [ ] **Step 1: Create the details sheet component**

Create `components/calendario/calendar-detalhes.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Clock, MapPin, Stethoscope, FileText, Tag, Calendar } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { Agendamento, AgendaStatus } from "./types"
import { STATUS_CONFIG, ALL_STATUSES } from "./types"

interface CalendarDetalhesProps {
  agendamento: Agendamento | null
  open: boolean
  onClose: () => void
  onStatusChanged: () => void
}

export function CalendarDetalhes({ agendamento, open, onClose, onStatusChanged }: CalendarDetalhesProps) {
  if (!agendamento) return null

  const statusCfg = STATUS_CONFIG[agendamento.status] || STATUS_CONFIG.AGENDADO

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  async function handleStatusChange(newStatus: AgendaStatus) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from("agendas")
        .update({ status: newStatus })
        .eq("id", agendamento!.id)
      if (error) {
        console.error("[calendario] Erro ao alterar status:", error.message)
        return
      }
      onStatusChanged()
    } catch (error) {
      console.error("[calendario] Erro:", error)
    }
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            Agendamento #{agendamento.id}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Paciente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="w-4 h-4 text-primary" />
              Paciente
            </div>
            <div className="pl-6 text-sm space-y-1">
              <p className="font-medium">{agendamento.nome_paciente || `#${agendamento.id_paciente}`}</p>
              {agendamento.email_paciente && (
                <p className="text-muted-foreground">{agendamento.email_paciente}</p>
              )}
              {agendamento.telefone_celular_paciente && (
                <p className="text-muted-foreground">{agendamento.telefone_celular_paciente}</p>
              )}
            </div>
          </div>

          {/* Horario */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              Horario
            </div>
            <div className="pl-6 text-sm space-y-1">
              <p className="font-medium capitalize">{formatDate(agendamento.data)}</p>
              <p className="text-muted-foreground">{agendamento.hora_inicio.slice(0, 5)} - {agendamento.hora_fim.slice(0, 5)}</p>
            </div>
          </div>

          {/* Profissional */}
          {agendamento.nome_profissional && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Stethoscope className="w-4 h-4 text-primary" />
                Profissional
              </div>
              <p className="pl-6 text-sm font-medium">{agendamento.nome_profissional}</p>
            </div>
          )}

          {/* Local */}
          {agendamento.nome_local && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Local
              </div>
              <p className="pl-6 text-sm font-medium">{agendamento.nome_local}</p>
            </div>
          )}

          {/* Tipo Consulta */}
          {agendamento.nome_tipo_consulta && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                Tipo de Consulta
              </div>
              <p className="pl-6 text-sm font-medium">{agendamento.nome_tipo_consulta}</p>
            </div>
          )}

          {/* Rotulo */}
          {agendamento.nome_rotulo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Tag className="w-4 h-4 text-primary" />
                Rotulo
              </div>
              <div className="pl-6 flex items-center gap-2">
                {agendamento.cor_rotulo && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agendamento.cor_rotulo }} />
                )}
                <span className="text-sm font-medium">{agendamento.nome_rotulo}</span>
              </div>
            </div>
          )}

          {/* Procedimentos */}
          {agendamento.procedimentos && agendamento.procedimentos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                Procedimentos ({agendamento.procedimentos.length})
              </div>
              <div className="pl-6 space-y-1">
                {agendamento.procedimentos.map((proc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                    <span className="font-medium">{proc.nome}</span>
                    <span className="text-muted-foreground">x{proc.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observacoes */}
          {agendamento.observacoes && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Observacoes</p>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{agendamento.observacoes}</p>
            </div>
          )}

          {/* Alterar Status */}
          <div className="space-y-2 pt-4 border-t border-border">
            <p className="text-sm font-semibold text-foreground">Alterar Status</p>
            <Select
              value={agendamento.status}
              onValueChange={(value) => handleStatusChange(value as AgendaStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendario/calendar-detalhes.tsx
git commit -m "feat: add CalendarDetalhes sheet with status change"
```

---

### Task 5: New Appointment Form

**Files:**
- Create: `components/calendario/calendar-novo-agendamento.tsx`

- [ ] **Step 1: Create the new appointment form**

Create `components/calendario/calendar-novo-agendamento.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, X, Save, Loader2, Check } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { AgendaRotulo, AgendaLocal, AgendaTipoConsulta } from "./types"

interface Paciente {
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone_celular: string | null
  email: string | null
}

interface Profissional {
  id: number
  id_pessoa: number
  nome: string
}

interface NovoProcedimento {
  nome: string
  idTipoProcedimento: number
  idEspecialidade: number
  quantidade: number
}

interface CalendarNovoAgendamentoProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaultDate?: string
}

export function CalendarNovoAgendamento({ open, onClose, onSaved, defaultDate }: CalendarNovoAgendamentoProps) {
  const [saving, setSaving] = useState(false)

  // Form state
  const [data, setData] = useState(defaultDate || new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState("09:00")
  const [horaFim, setHoraFim] = useState("10:00")
  const [observacoes, setObservacoes] = useState("")

  // Patient search
  const [searchPaciente, setSearchPaciente] = useState("")
  const [pacienteResults, setPacienteResults] = useState<Paciente[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [searchingPaciente, setSearchingPaciente] = useState(false)

  // Selects
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [locais, setLocais] = useState<AgendaLocal[]>([])
  const [tiposConsulta, setTiposConsulta] = useState<AgendaTipoConsulta[]>([])
  const [rotulos, setRotulos] = useState<AgendaRotulo[]>([])
  const [selectedProfissional, setSelectedProfissional] = useState("")
  const [selectedLocal, setSelectedLocal] = useState("")
  const [selectedTipoConsulta, setSelectedTipoConsulta] = useState("")
  const [selectedRotulo, setSelectedRotulo] = useState("")

  // Procedures
  const [procedimentos, setProcedimentos] = useState<NovoProcedimento[]>([])

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    if (!open) return
    async function loadData() {
      const supabase = getSupabase()
      const [profRes, locRes, tipoRes, rotRes] = await Promise.all([
        supabase.from("profissionais").select("id, id_pessoa, nome").eq("ativo", true).order("nome"),
        supabase.from("agenda_local").select("*").eq("ativo", true).order("nome"),
        supabase.from("agenda_tipos_consulta").select("*").eq("ativo", true).order("nome"),
        supabase.from("agenda_rotulos").select("*").order("nome"),
      ])
      if (profRes.data) setProfissionais(profRes.data as Profissional[])
      if (locRes.data) setLocais(locRes.data as AgendaLocal[])
      if (tipoRes.data) setTiposConsulta(tipoRes.data as AgendaTipoConsulta[])
      if (rotRes.data) setRotulos(rotRes.data as AgendaRotulo[])
    }
    loadData()
  }, [open])

  useEffect(() => {
    if (defaultDate) setData(defaultDate)
  }, [defaultDate])

  // Patient search with debounce
  useEffect(() => {
    if (searchPaciente.length < 2) { setPacienteResults([]); return }
    const timeout = setTimeout(async () => {
      try {
        setSearchingPaciente(true)
        const supabase = getSupabase()
        const { data } = await supabase
          .from("pacientes")
          .select("id, nome, cpf_cnpj, telefone_celular, email")
          .or(`nome.ilike.%${searchPaciente}%,cpf_cnpj.ilike.%${searchPaciente}%`)
          .eq("ativo", true)
          .limit(10)
        setPacienteResults((data as Paciente[]) || [])
      } catch (e) {
        console.error("[calendario] Erro busca paciente:", e)
      } finally {
        setSearchingPaciente(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchPaciente])

  async function handleSave() {
    if (!selectedPaciente) return
    try {
      setSaving(true)
      const supabase = getSupabase()
      const prof = profissionais.find((p) => String(p.id) === selectedProfissional)

      const payload = {
        data,
        hora_inicio: horaInicio + ":00",
        hora_fim: horaFim + ":00",
        id_paciente: selectedPaciente.id,
        id_pessoa_executor: prof?.id_pessoa || 0,
        id_local_agenda: parseInt(selectedLocal) || 0,
        id_tipo_consulta: parseInt(selectedTipoConsulta) || 0,
        id_tipo_convenio: 0,
        id_rotulo: parseInt(selectedRotulo) || 0,
        email_paciente: selectedPaciente.email,
        telefone_celular_paciente: selectedPaciente.telefone_celular,
        observacoes: observacoes || null,
        status: "AGENDADO",
        procedimentos: procedimentos.map((p) => ({
          id: 0,
          nome: p.nome,
          idTipoProcedimento: p.idTipoProcedimento,
          idEspecialidade: p.idEspecialidade,
          idPromocao: null,
          quantidade: p.quantidade,
        })),
      }

      const { error } = await supabase.from("agendas").insert(payload)
      if (error) {
        console.error("[calendario] Erro ao criar:", error.message)
        return
      }

      // Reset form
      setSelectedPaciente(null)
      setSearchPaciente("")
      setObservacoes("")
      setProcedimentos([])
      onSaved()
      onClose()
    } catch (error) {
      console.error("[calendario] Erro:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Novo Agendamento</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Data e Horarios */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Inicio</Label>
              <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Fim</Label>
              <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
          </div>

          {/* Paciente */}
          <div>
            <Label className="text-xs mb-1 block">Paciente</Label>
            {selectedPaciente ? (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{selectedPaciente.nome}</p>
                      <p className="text-xs text-muted-foreground">{selectedPaciente.cpf_cnpj || "Sem CPF"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPaciente(null); setSearchPaciente("") }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente por nome ou CPF..."
                  className="pl-10"
                  value={searchPaciente}
                  onChange={(e) => setSearchPaciente(e.target.value)}
                />
                {pacienteResults.length > 0 && (
                  <Card className="absolute z-10 mt-1 w-full divide-y divide-border max-h-48 overflow-y-auto">
                    {pacienteResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => { setSelectedPaciente(p); setSearchPaciente(p.nome); setPacienteResults([]) }}
                      >
                        <p className="text-sm font-medium">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.cpf_cnpj || "Sem CPF"}</p>
                      </button>
                    ))}
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Profissional */}
          <div>
            <Label className="text-xs mb-1 block">Profissional</Label>
            <Select value={selectedProfissional} onValueChange={setSelectedProfissional}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {profissionais.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Local */}
          <div>
            <Label className="text-xs mb-1 block">Local / Sala</Label>
            <Select value={selectedLocal} onValueChange={setSelectedLocal}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {locais.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.cor }} />
                      {l.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo Consulta */}
          <div>
            <Label className="text-xs mb-1 block">Tipo de Consulta</Label>
            <Select value={selectedTipoConsulta} onValueChange={setSelectedTipoConsulta}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tiposConsulta.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rotulo */}
          <div>
            <Label className="text-xs mb-1 block">Rotulo</Label>
            <Select value={selectedRotulo} onValueChange={setSelectedRotulo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {rotulos.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.cor }} />
                      {r.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observacoes */}
          <div>
            <Label className="text-xs mb-1 block">Observacoes</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observacoes sobre o agendamento..."
              rows={3}
            />
          </div>

          {/* Salvar */}
          <Button
            onClick={handleSave}
            disabled={saving || !selectedPaciente}
            className="w-full gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Criar Agendamento"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendario/calendar-novo-agendamento.tsx
git commit -m "feat: add CalendarNovoAgendamento form"
```

---

### Task 6: Month View

**Files:**
- Create: `components/calendario/calendar-month-view.tsx`

- [ ] **Step 1: Create the month view component**

Create `components/calendario/calendar-month-view.tsx`:

```tsx
"use client"

import { Card } from "@/components/ui/card"
import { CalendarDayCard } from "./calendar-day-card"
import { CalendarPopover } from "./calendar-popover"
import type { Agendamento, ColorMode } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarMonthViewProps {
  year: number
  month: number
  agendamentos: Agendamento[]
  selectedDay: string | null
  colorMode: ColorMode
  onSelectDay: (dayKey: string) => void
  onVerDetalhes: (agendamento: Agendamento) => void
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export function CalendarMonthView({
  year,
  month,
  agendamentos,
  selectedDay,
  colorMode,
  onSelectDay,
  onVerDetalhes,
}: CalendarMonthViewProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startPad; i++) calendarDays.push(null)
  for (let d = 1; d <= totalDays; d++) calendarDays.push(d)

  function getDayKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
  })()

  // Group by day
  const porDia: Record<string, Agendamento[]> = {}
  agendamentos.forEach((a) => {
    const key = a.data
    if (!porDia[key]) porDia[key] = []
    porDia[key].push(a)
  })

  // Sort each day by hora_inicio
  Object.values(porDia).forEach((arr) => arr.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)))

  const propostasDoDia = selectedDay ? (porDia[selectedDay] || []) : []

  function formatSelectedDate(): string {
    if (!selectedDay) return ""
    const [y, m, d] = selectedDay.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      {/* Calendar Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DIAS_SEMANA.map((dia) => (
            <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-1">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="h-10" />
            const dayKey = getDayKey(day)
            const dayAgendamentos = porDia[dayKey] || []
            const count = dayAgendamentos.length
            const isToday = dayKey === todayStr
            const isSelected = dayKey === selectedDay

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onSelectDay(dayKey)}
                className={`h-10 rounded-lg text-sm relative transition-all duration-200 flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday
                      ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                      : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="text-xs">{day}</span>
                {count > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {count <= 3 ? (
                      dayAgendamentos.slice(0, 3).map((a, idx) => {
                        const dotColor = colorMode === "rotulo" && a.cor_rotulo
                          ? undefined
                          : (STATUS_CONFIG[a.status]?.dotColor || "bg-gray-400")
                        const dotStyle = colorMode === "rotulo" && a.cor_rotulo
                          ? { backgroundColor: a.cor_rotulo }
                          : undefined
                        return (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : (dotColor || "")}`}
                            style={isSelected ? undefined : dotStyle}
                          />
                        )
                      })
                    ) : (
                      <span className={`text-[9px] font-bold ${isSelected ? "text-primary-foreground" : "text-primary"}`}>
                        {count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Day List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground capitalize">{formatSelectedDate()}</h3>
          <p className="text-xs text-muted-foreground">
            {propostasDoDia.length} {propostasDoDia.length === 1 ? "agendamento" : "agendamentos"}
          </p>
        </div>

        {propostasDoDia.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {propostasDoDia.map((agendamento) => (
              <CalendarPopover
                key={agendamento.id}
                agendamento={agendamento}
                onVerDetalhes={onVerDetalhes}
              >
                <div>
                  <CalendarDayCard
                    agendamento={agendamento}
                    colorMode={colorMode}
                    onClick={() => {}}
                  />
                </div>
              </CalendarPopover>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendario/calendar-month-view.tsx
git commit -m "feat: add CalendarMonthView with grid and day list"
```

---

### Task 7: Week View

**Files:**
- Create: `components/calendario/calendar-week-view.tsx`

- [ ] **Step 1: Create the week view component**

Create `components/calendario/calendar-week-view.tsx`:

```tsx
"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { CalendarPopover } from "./calendar-popover"
import type { Agendamento, ColorMode } from "./types"
import { STATUS_CONFIG } from "./types"

interface CalendarWeekViewProps {
  weekStart: Date
  agendamentos: Agendamento[]
  colorMode: ColorMode
  onVerDetalhes: (agendamento: Agendamento) => void
}

const HOURS_START = 7
const HOURS_END = 21
const HOUR_HEIGHT = 60 // px per hour
const DIAS_SEMANA_FULL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export function CalendarWeekView({ weekStart, agendamentos, colorMode, onVerDetalhes }: CalendarWeekViewProps) {
  const hours = Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i)

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  function getDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const todayStr = getDayKey(new Date())
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  // Group agendamentos by day
  const porDia: Record<string, Agendamento[]> = {}
  agendamentos.forEach((a) => {
    if (!porDia[a.data]) porDia[a.data] = []
    porDia[a.data].push(a)
  })

  function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number)
    return h * 60 + m
  }

  function getBlockStyle(agendamento: Agendamento): React.CSSProperties {
    const startMin = timeToMinutes(agendamento.hora_inicio)
    const endMin = timeToMinutes(agendamento.hora_fim)
    const top = ((startMin - HOURS_START * 60) / 60) * HOUR_HEIGHT
    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24)
    return { top: `${top}px`, height: `${height}px` }
  }

  function getBlockColor(agendamento: Agendamento): { className: string; style?: React.CSSProperties } {
    if (colorMode === "rotulo" && agendamento.cor_rotulo) {
      return {
        className: "text-white",
        style: { backgroundColor: agendamento.cor_rotulo },
      }
    }
    const cfg = STATUS_CONFIG[agendamento.status]
    return { className: cfg?.color || "bg-gray-100 text-gray-800" }
  }

  const nowLineTop = ((nowMinutes - HOURS_START * 60) / 60) * HOUR_HEIGHT

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header: day labels */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
          <div />
          {weekDays.map((date) => {
            const key = getDayKey(date)
            const isToday = key === todayStr
            return (
              <div
                key={key}
                className={`text-center py-2 rounded-lg ${isToday ? "bg-primary/10" : ""}`}
              >
                <p className="text-xs text-muted-foreground">{DIAS_SEMANA_FULL[date.getDay()]}</p>
                <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                  {date.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 relative" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
          {/* Hour labels */}
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground"
                style={{ top: `${(hour - HOURS_START) * HOUR_HEIGHT}px` }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((date) => {
            const key = getDayKey(date)
            const dayAgendamentos = porDia[key] || []
            const isToday = key === todayStr

            return (
              <div key={key} className="relative border-l border-border">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/50"
                    style={{ top: `${(hour - HOURS_START) * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Now line */}
                {isToday && nowMinutes >= HOURS_START * 60 && nowMinutes <= HOURS_END * 60 && (
                  <div
                    className="absolute w-full h-0.5 bg-red-500 z-10"
                    style={{ top: `${nowLineTop}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-[3px]" />
                  </div>
                )}

                {/* Appointment blocks */}
                {dayAgendamentos.map((agendamento) => {
                  const blockStyle = getBlockStyle(agendamento)
                  const blockColor = getBlockColor(agendamento)
                  return (
                    <CalendarPopover
                      key={agendamento.id}
                      agendamento={agendamento}
                      onVerDetalhes={onVerDetalhes}
                    >
                      <div
                        className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-[5] ${blockColor.className}`}
                        style={{ ...blockStyle, ...blockColor.style }}
                      >
                        <p className="text-[10px] font-medium truncate">
                          {agendamento.hora_inicio.slice(0, 5)}
                        </p>
                        <p className="text-[10px] truncate">
                          {agendamento.nome_paciente || `#${agendamento.id_paciente}`}
                        </p>
                      </div>
                    </CalendarPopover>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendario/calendar-week-view.tsx
git commit -m "feat: add CalendarWeekView with timeline layout"
```

---

### Task 8: Calendar Content Orchestrator

**Files:**
- Create: `components/calendario/calendar-content.tsx`

- [ ] **Step 1: Create the orchestrator component**

Create `components/calendario/calendar-content.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { CalendarMonthView } from "./calendar-month-view"
import { CalendarWeekView } from "./calendar-week-view"
import { CalendarDetalhes } from "./calendar-detalhes"
import { CalendarNovoAgendamento } from "./calendar-novo-agendamento"
import type { Agendamento, AgendaRotulo, CalendarView, ColorMode, ProfissionalMap } from "./types"

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function CalendarContent() {
  const [view, setView] = useState<CalendarView>("mensal")
  const [colorMode, setColorMode] = useState<ColorMode>("status")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [filterProfissional, setFilterProfissional] = useState("todos")

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [rotulos, setRotulos] = useState<AgendaRotulo[]>([])
  const [profissionais, setProfissionais] = useState<ProfissionalMap[]>([])
  const [profissionaisNomes, setProfissionaisNomes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dataKey, setDataKey] = useState(0)

  // Details sheet
  const [detalheAgendamento, setDetalheAgendamento] = useState<Agendamento | null>(null)
  const [detalheOpen, setDetalheOpen] = useState(false)

  // New appointment sheet
  const [novoOpen, setNovoOpen] = useState(false)

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  // Set today as default selected day
  useEffect(() => {
    const t = new Date()
    setSelectedDay(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)
  }, [])

  // Load reference data on mount
  useEffect(() => {
    async function loadRef() {
      const supabase = getSupabase()
      const [rotRes, profRes] = await Promise.all([
        supabase.from("agenda_rotulos").select("*"),
        supabase.from("profissionais").select("id, id_pessoa, nome").eq("ativo", true).order("nome"),
      ])
      if (rotRes.data) setRotulos(rotRes.data as AgendaRotulo[])
      if (profRes.data) setProfissionais(profRes.data as ProfissionalMap[])
    }
    loadRef()
  }, [])

  // Load agendamentos when period or dataKey changes
  useEffect(() => {
    fetchAgendamentos()
  }, [currentDate, view, dataKey])

  async function fetchAgendamentos() {
    try {
      setLoading(true)
      const supabase = getSupabase()

      // Determine date range
      let startDate: string
      let endDate: string
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()

      if (view === "mensal") {
        startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`
        const lastDay = new Date(year, month + 1, 0).getDate()
        endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
      } else {
        const weekStart = getWeekStart(currentDate)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        startDate = formatDateKey(weekStart)
        endDate = formatDateKey(weekEnd)
      }

      const { data, error } = await supabase
        .from("agendas")
        .select("*")
        .gte("data", startDate)
        .lte("data", endDate)
        .order("data")
        .order("hora_inicio")

      if (error) {
        console.error("[calendario] Erro ao buscar agendamentos:", error.message)
        return
      }

      if (data) {
        // Also load patient names for these agendamentos
        const patientIds = [...new Set((data as Agendamento[]).map((a) => a.id_paciente))]
        let pacientesMap: Record<number, string> = {}
        if (patientIds.length > 0) {
          const { data: pacData } = await supabase
            .from("pacientes")
            .select("id, nome")
            .in("id", patientIds)
          if (pacData) {
            pacientesMap = Object.fromEntries(pacData.map((p: any) => [p.id, p.nome]))
          }
        }

        // Also load agenda_completa for resolved names
        const { data: completaData } = await supabase
          .from("agenda_completa")
          .select("id, profissional, local_agenda, rotulo, tipo_consulta")
          .gte("data_agenda", startDate)
          .lte("data_agenda", endDate)

        const completaMap: Record<number, any> = {}
        if (completaData) {
          completaData.forEach((c: any) => { completaMap[c.id] = c })
        }

        // Build rotulos map
        const rotuloMap: Record<number, AgendaRotulo> = {}
        rotulos.forEach((r) => { rotuloMap[r.id] = r })

        // Enrich agendamentos
        const enriched = (data as Agendamento[]).map((a) => {
          const completa = completaMap[a.id]
          const profMap = profissionais.find((p) => p.id_pessoa === a.id_pessoa_executor)
          const rotulo = rotuloMap[a.id_rotulo]
          return {
            ...a,
            nome_paciente: pacientesMap[a.id_paciente] || undefined,
            nome_profissional: completa?.profissional || profMap?.nome || undefined,
            nome_local: completa?.local_agenda || undefined,
            nome_rotulo: completa?.rotulo || rotulo?.nome || undefined,
            cor_rotulo: rotulo?.cor || undefined,
            nome_tipo_consulta: completa?.tipo_consulta || undefined,
          }
        })

        // Extract unique professional names
        const names = [...new Set(enriched.map((a) => a.nome_profissional).filter(Boolean))] as string[]
        setProfissionaisNomes(names.sort())

        setAgendamentos(enriched)
      }
    } catch (error) {
      console.error("[calendario] Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  }

  function formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  // Navigation
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  function prev() {
    if (view === "mensal") {
      setCurrentDate(new Date(year, month - 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    }
  }

  function next() {
    if (view === "mensal") {
      setCurrentDate(new Date(year, month + 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    }
  }

  function goToToday() {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDay(formatDateKey(today))
  }

  function getPeriodLabel(): string {
    if (view === "mensal") {
      return `${MESES[month]} ${year}`
    }
    const ws = getWeekStart(currentDate)
    const we = new Date(ws)
    we.setDate(we.getDate() + 6)
    const startLabel = `${ws.getDate()} ${MESES[ws.getMonth()].slice(0, 3)}`
    const endLabel = `${we.getDate()} ${MESES[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`
    return `${startLabel} - ${endLabel}`
  }

  // Filter by professional
  const filteredAgendamentos = filterProfissional === "todos"
    ? agendamentos
    : agendamentos.filter((a) => a.nome_profissional === filterProfissional)

  function handleVerDetalhes(agendamento: Agendamento) {
    setDetalheAgendamento(agendamento)
    setDetalheOpen(true)
  }

  function handleStatusChanged() {
    setDetalheOpen(false)
    setDataKey((k) => k + 1)
  }

  function handleNovoSaved() {
    setDataKey((k) => k + 1)
  }

  const weekStart = getWeekStart(currentDate)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        {/* Left: view toggle + navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            <Button
              variant={view === "mensal" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("mensal")}
              className="gap-1"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Mensal
            </Button>
            <Button
              variant={view === "semanal" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("semanal")}
              className="gap-1"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Semanal
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[160px] text-center">{getPeriodLabel()}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-7 px-2">
            Hoje
          </Button>
        </div>

        {/* Right: filters + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterProfissional} onValueChange={setFilterProfissional}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {profissionaisNomes.map((nome) => (
                <SelectItem key={nome} value={nome}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              variant={colorMode === "status" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setColorMode("status")}
            >
              Status
            </Button>
            <Button
              variant={colorMode === "rotulo" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setColorMode("rotulo")}
            >
              Rotulo
            </Button>
          </div>

          <Button
            size="sm"
            className="gap-1"
            onClick={() => setNovoOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </Button>
        </div>
      </div>

      {/* Views */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">Carregando agendamentos...</p>
          </div>
        </div>
      ) : view === "mensal" ? (
        <CalendarMonthView
          year={year}
          month={month}
          agendamentos={filteredAgendamentos}
          selectedDay={selectedDay}
          colorMode={colorMode}
          onSelectDay={setSelectedDay}
          onVerDetalhes={handleVerDetalhes}
        />
      ) : (
        <CalendarWeekView
          weekStart={weekStart}
          agendamentos={filteredAgendamentos}
          colorMode={colorMode}
          onVerDetalhes={handleVerDetalhes}
        />
      )}

      {/* Sheets */}
      <CalendarDetalhes
        agendamento={detalheAgendamento}
        open={detalheOpen}
        onClose={() => setDetalheOpen(false)}
        onStatusChanged={handleStatusChanged}
      />

      <CalendarNovoAgendamento
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        onSaved={handleNovoSaved}
        defaultDate={selectedDay || undefined}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendario/calendar-content.tsx
git commit -m "feat: add CalendarContent orchestrator with data enrichment"
```

---

### Task 9: Update Page and Clean Up

**Files:**
- Modify: `app/calendar/page.tsx`
- Delete: `components/calendar/calendar-content.tsx`

- [ ] **Step 1: Update calendar page**

Replace `app/calendar/page.tsx`:

```tsx
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CalendarContent } from "@/components/calendario/calendar-content"

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header
          title="Calendario"
          description="Visualize e gerencie os agendamentos da clinica."
        />

        <div className="mt-6">
          <CalendarContent />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Delete old calendar component**

```bash
rm components/calendar/calendar-content.tsx
rmdir components/calendar
```

- [ ] **Step 3: Verify build and commit**

Run: `npm run dev` — navigate to `http://localhost:3000/calendar`

```bash
git add app/calendar/page.tsx
git rm components/calendar/calendar-content.tsx
git commit -m "feat: update calendar page, remove old placeholder"
```

---

## Summary

| Task | Description | Files |
|---|---|---|
| 1 | TypeScript types + constants | `components/calendario/types.ts` |
| 2 | Day card component | `calendar-day-card.tsx` |
| 3 | Popover component | `calendar-popover.tsx` |
| 4 | Details sheet + status change | `calendar-detalhes.tsx` |
| 5 | New appointment form | `calendar-novo-agendamento.tsx` |
| 6 | Month view | `calendar-month-view.tsx` |
| 7 | Week view (timeline) | `calendar-week-view.tsx` |
| 8 | Content orchestrator | `calendar-content.tsx` |
| 9 | Update page + cleanup | `app/calendar/page.tsx` |
