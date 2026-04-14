# Calendar Modal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `calendar-detalhes.tsx` para adotar o mesmo padrão visual do `proposta-detalhes.tsx` — cabeçalho fixo, seções colapsáveis e rodapé fixo com ações.

**Architecture:** Componente único com Section helper interno, sticky header com nome do paciente + data/hora, seções colapsáveis para cada campo do agendamento, sticky footer com botão de contrato e select de status.

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix UI (Sheet), Lucide Icons, Supabase

---

### Task 1: Reescrever `calendar-detalhes.tsx`

**Files:**
- Modify: `components/calendario/calendar-detalhes.tsx`

- [ ] **Step 1: Substituir o conteúdo do arquivo pelo novo componente**

```tsx
"use client"

import { useState } from "react"
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
import {
  User,
  Clock,
  MapPin,
  Stethoscope,
  FileText,
  Tag,
  FileSignature,
  MessageCircle,
  ChevronDown,
  ArrowLeft,
  UserCheck,
} from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { Agendamento, AgendaStatus } from "./types"
import { STATUS_CONFIG, ALL_STATUSES } from "./types"
import { ContratoNovoSheet } from "@/components/contratos/contrato-novo-sheet"

interface CalendarDetalhesProps {
  agendamento: Agendamento | null
  open: boolean
  onClose: () => void
  onStatusChanged: () => void
}

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

export function CalendarDetalhes({
  agendamento,
  open,
  onClose,
  onStatusChanged,
}: CalendarDetalhesProps) {
  const [showContrato, setShowContrato] = useState(false)

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
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Cabeçalho fixo */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 pt-4 pb-3">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <SheetTitle className="text-sm font-semibold text-muted-foreground">
                Agendamento #{agendamento.id}
              </SheetTitle>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}
              >
                {statusCfg.label}
              </span>
            </div>
          </SheetHeader>
          <p className="text-xl font-bold text-foreground leading-tight">
            {agendamento.nome_paciente || `#${agendamento.id_paciente}`}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {formatDate(agendamento.data)} · {agendamento.hora_inicio.slice(0, 5)} – {agendamento.hora_fim.slice(0, 5)}
          </p>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2">
          <Section icon={User} title="Paciente">
            <div className="text-sm space-y-1">
              <p className="font-medium">
                {agendamento.nome_paciente || `#${agendamento.id_paciente}`}
              </p>
              {agendamento.email_paciente && (
                <p className="text-muted-foreground">{agendamento.email_paciente}</p>
              )}
              {agendamento.telefone_celular_paciente && (
                <p className="text-muted-foreground">{agendamento.telefone_celular_paciente}</p>
              )}
            </div>
          </Section>

          <Section icon={Clock} title="Horário">
            <div className="text-sm space-y-1">
              <p className="font-medium capitalize">{formatDate(agendamento.data)}</p>
              <p className="text-muted-foreground">
                {agendamento.hora_inicio.slice(0, 5)} – {agendamento.hora_fim.slice(0, 5)}
              </p>
            </div>
          </Section>

          {agendamento.nome_profissional && (
            <Section icon={UserCheck} title="Profissional">
              <p className="text-sm font-medium">{agendamento.nome_profissional}</p>
            </Section>
          )}

          {agendamento.nome_local && (
            <Section icon={MapPin} title="Local">
              <p className="text-sm font-medium">{agendamento.nome_local}</p>
            </Section>
          )}

          {agendamento.nome_tipo_consulta && (
            <Section icon={MessageCircle} title="Tipo de Consulta">
              <p className="text-sm font-medium">{agendamento.nome_tipo_consulta}</p>
            </Section>
          )}

          {agendamento.nome_rotulo && (
            <Section icon={Tag} title="Etiqueta">
              <div className="flex items-center gap-2">
                {agendamento.cor_rotulo && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: agendamento.cor_rotulo }}
                  />
                )}
                <span className="text-sm font-medium">{agendamento.nome_rotulo}</span>
              </div>
            </Section>
          )}

          {agendamento.procedimentos && agendamento.procedimentos.length > 0 && (
            <Section
              icon={Stethoscope}
              title={`Procedimentos (${agendamento.procedimentos.length})`}
            >
              <div className="space-y-1">
                {agendamento.procedimentos.map((proc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0"
                  >
                    <span className="font-medium">{proc.nome}</span>
                    <span className="text-muted-foreground">x{proc.quantidade}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {agendamento.observacoes && (
            <Section icon={FileText} title="Observações">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {agendamento.observacoes}
              </p>
            </Section>
          )}
        </div>

        {/* Rodapé fixo */}
        <div className="sticky bottom-0 z-10 bg-card border-t border-border px-4 sm:px-6 py-3 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setShowContrato(true)}
          >
            <FileSignature className="w-4 h-4" />
            Enviar Contrato / Termo
          </Button>
          <Select
            value={agendamento.status}
            onValueChange={(value) => handleStatusChange(value as AgendaStatus)}
          >
            <SelectTrigger className="flex-1">
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
      </SheetContent>

      <ContratoNovoSheet
        open={showContrato}
        onClose={() => setShowContrato(false)}
        onSuccess={() => setShowContrato(false)}
        pacienteId={agendamento.id_paciente}
        nomePaciente={agendamento.nome_paciente ?? ""}
        emailPaciente={agendamento.email_paciente ?? ""}
      />
    </Sheet>
  )
}
```

- [ ] **Step 2: Verificar build sem erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add components/calendario/calendar-detalhes.tsx
git commit -m "feat: redesign calendar modal to match proposal modal pattern"
```
