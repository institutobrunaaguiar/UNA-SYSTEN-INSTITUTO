# Validador de Proposta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que Admins auditem propostas pagas (aprovar/reprovar com motivo), exibindo o status de validação para todos os usuários.

**Architecture:** 3 novos campos na interface Proposta (`validacao_status`, `validacao_motivo`, `validado_em`), aba "Validação" na lista de propostas visível apenas para admin, dialog de reprovação com motivo obrigatório, badges e seção de auditoria no detalhe visíveis para todos. O `useUser()` do contexto existente fornece o role.

**Tech Stack:** Next.js 14, TypeScript, Supabase JS, shadcn/ui (Dialog, Select, Button, Card), Tailwind CSS

---

### Task 1: Atualizar types.ts com campos de validação

**Files:**
- Modify: `components/propostas/types.ts`

- [ ] **Step 1: Adicionar campos de validação à interface Proposta**

Após `data_proposta: string` (última linha da interface), adicionar:

```ts
  validacao_status: "pendente" | "aprovada" | "reprovada"
  validacao_motivo: string | null
  validado_em: string | null
```

- [ ] **Step 2: Adicionar tipo ValidacaoStatus e VALIDACAO_CONFIG**

Após o `export type PropostaStatus = ...` existente, adicionar:

```ts
export type ValidacaoStatus = "pendente" | "aprovada" | "reprovada"

export const VALIDACAO_CONFIG: Record<ValidacaoStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-50 text-yellow-700" },
  aprovada: { label: "Aprovada", color: "bg-green-50 text-green-700" },
  reprovada: { label: "Reprovada", color: "bg-red-50 text-red-700" },
}
```

- [ ] **Step 3: Commit**

```bash
git add components/propostas/types.ts
git commit -m "feat: add validacao fields and config to Proposta type"
```

---

### Task 2: Criar dialog de reprovação

**Files:**
- Create: `components/propostas/validacao-reprovar-dialog.tsx`

- [ ] **Step 1: Criar o componente completo**

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ValidacaoReprovarDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (motivo: string) => void
  saving: boolean
  nomeCliente: string
}

export function ValidacaoReprovarDialog({
  open,
  onClose,
  onConfirm,
  saving,
  nomeCliente,
}: ValidacaoReprovarDialogProps) {
  const [motivo, setMotivo] = useState("")

  function handleConfirm() {
    if (!motivo.trim()) return
    onConfirm(motivo.trim())
    setMotivo("")
  }

  function handleClose() {
    setMotivo("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reprovar Proposta</DialogTitle>
          <DialogDescription>
            Informe o motivo da reprovação da proposta de {nomeCliente}. A consultora verá este motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo" className="text-sm font-medium">
            Motivo da reprovação *
          </Label>
          <Textarea
            id="motivo"
            placeholder="Ex: Desconto acima do permitido, procedimento incorreto..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motivo.trim() || saving}
          >
            {saving ? "Salvando..." : "Reprovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verificar que o componente Textarea existe**

Verificar se `components/ui/textarea.tsx` existe. Se não existir, rodar:

```bash
npx shadcn@latest add textarea
```

- [ ] **Step 3: Commit**

```bash
git add components/propostas/validacao-reprovar-dialog.tsx
git commit -m "feat: add ValidacaoReprovarDialog component"
```

---

### Task 3: Adicionar aba de validação e badges na lista de propostas

**Files:**
- Modify: `components/propostas/propostas-lista.tsx`

Esta é a task mais complexa. A lista de propostas (`propostas-lista.tsx`) precisa de:
1. Import do `useUser` para determinar o role
2. Estado para controlar se a aba "Validação" está ativa
3. Contagem de propostas pendentes de validação
4. Renderização condicional da aba (só admin)
5. Badge de validação em cada card da lista regular
6. Ações de aprovar/reprovar no dropdown menu (só admin)
7. Funções `handleAprovar` e `handleReprovar` que fazem update no Supabase
8. O dialog de reprovação
9. Quando aba "Validação" ativa: mostra lista flat (sem calendário) das propostas `status=pago` + `validacao_status=pendente`

- [ ] **Step 1: Adicionar imports**

No topo do arquivo, adicionar/atualizar estes imports:

Adicionar `useUser`:
```ts
import { useUser } from "@/context/user-context"
```

Adicionar `VALIDACAO_CONFIG` e `ValidacaoStatus` aos imports de types:
```ts
import type { Proposta, PropostaStatus, ValidacaoStatus } from "./types"
import { STATUS_CONFIG, VALIDACAO_CONFIG } from "./types"
```

Adicionar import do dialog de reprovação:
```ts
import { ValidacaoReprovarDialog } from "./validacao-reprovar-dialog"
```

Adicionar `CheckCircle, XCircle, ShieldCheck` aos imports de lucide:
```ts
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react"
```

- [ ] **Step 2: Adicionar estados e user context dentro do componente**

No início da função `PropostasLista`, após os estados existentes, adicionar:

```ts
const { user } = useUser()
const isAdmin = user?.role === "admin"
const [abaValidacao, setAbaValidacao] = useState(false)
const [reprovarProposta, setReprovarProposta] = useState<Proposta | null>(null)
const [reprovarSaving, setReprovarSaving] = useState(false)
```

- [ ] **Step 3: Adicionar contagem de pendentes e propostas filtradas para validação**

Após o bloco `const statusCounts = { ... }` existente, adicionar:

```ts
const pendentesValidacao = propostas.filter(
  (p) => p.status === "pago" && p.validacao_status === "pendente"
)
```

- [ ] **Step 4: Adicionar funções handleAprovar e handleReprovar**

Após a função `handleStatusChange` existente, adicionar:

```ts
async function handleAprovar(proposta: Proposta) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from("propostas")
      .update({
        validacao_status: "aprovada",
        validado_em: new Date().toISOString(),
      })
      .eq("id", proposta.id)
    if (error) {
      console.error("[propostas] Erro ao aprovar:", error.message)
      return
    }
    fetchPropostas()
  } catch (error) {
    console.error("[propostas] Erro:", error)
  }
}

async function handleReprovar(motivo: string) {
  if (!reprovarProposta) return
  try {
    setReprovarSaving(true)
    const supabase = getSupabase()
    const { error } = await supabase
      .from("propostas")
      .update({
        validacao_status: "reprovada",
        validacao_motivo: motivo,
        validado_em: new Date().toISOString(),
      })
      .eq("id", reprovarProposta.id)
    if (error) {
      console.error("[propostas] Erro ao reprovar:", error.message)
      return
    }
    setReprovarProposta(null)
    fetchPropostas()
  } catch (error) {
    console.error("[propostas] Erro:", error)
  } finally {
    setReprovarSaving(false)
  }
}
```

- [ ] **Step 5: Adicionar aba "Validação" no JSX**

Após o bloco `{/* Filtros de status */}` (os botões de status), adicionar a aba de validação condicional ao admin. Localizar o `<div className="flex gap-2 flex-wrap">` que contém os filtros de status e envolver em lógica:

Após o fechamento `</div>` dos filtros de status (por volta da linha 270), adicionar:

```tsx
{isAdmin && (
  <div className="flex gap-2">
    <Button
      variant={!abaValidacao ? "default" : "outline"}
      size="sm"
      onClick={() => setAbaValidacao(false)}
    >
      Propostas
    </Button>
    <Button
      variant={abaValidacao ? "default" : "outline"}
      size="sm"
      onClick={() => setAbaValidacao(true)}
      className="gap-1.5"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      Validação
      {pendentesValidacao.length > 0 && (
        <span className="ml-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {pendentesValidacao.length}
        </span>
      )}
    </Button>
  </div>
)}
```

- [ ] **Step 6: Adicionar badge de validação nos cards da lista regular**

No card de cada proposta (dentro do `propostasDoDia.map`), após o badge de status existente (o `<span>` com `STATUS_CONFIG`), adicionar o badge de validação:

```tsx
{proposta.validacao_status && (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${VALIDACAO_CONFIG[proposta.validacao_status].color}`}>
    {VALIDACAO_CONFIG[proposta.validacao_status].label}
  </span>
)}
```

- [ ] **Step 7: Adicionar ações de aprovar/reprovar no dropdown menu (só admin)**

No `<DropdownMenuContent>` de cada proposta, antes do `<DropdownMenuSeparator />` que antecede "Excluir", adicionar:

```tsx
{isAdmin && proposta.status === "pago" && (
  <>
    <DropdownMenuSeparator />
    {proposta.validacao_status !== "aprovada" && (
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAprovar(proposta) }}>
        <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Aprovar
      </DropdownMenuItem>
    )}
    {proposta.validacao_status !== "reprovada" && (
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setReprovarProposta(proposta) }}>
        <XCircle className="w-4 h-4 mr-2 text-red-500" /> Reprovar
      </DropdownMenuItem>
    )}
  </>
)}
```

- [ ] **Step 8: Adicionar renderização da aba de validação**

Quando `abaValidacao` está ativo, o calendário e a lista regular devem ser substituídos por uma lista flat das propostas pendentes. Envolver o bloco de loading/conteúdo principal em uma condição:

Dentro do bloco `{!loading && ...}`, após o grid do calendário + lista, adicionar uma alternativa para quando `abaValidacao` está ativo. A lógica deve ser:

- Se `abaValidacao` está `true`: mostrar lista flat das `pendentesValidacao`
- Se `abaValidacao` está `false`: mostrar calendário + lista (comportamento atual)

Envolver o conteúdo existente (calendário + lista) com `{!abaValidacao && ( ... )}` e adicionar:

```tsx
{abaValidacao && (
  <div className="space-y-3">
    {pendentesValidacao.length === 0 ? (
      <Card className="p-8 text-center">
        <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma proposta pendente de validação.</p>
      </Card>
    ) : (
      pendentesValidacao.map((proposta) => (
        <Card
          key={proposta.id}
          className="p-4 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">#{proposta.id}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CONFIG[proposta.status].color}`}>
                  {STATUS_CONFIG[proposta.status].label}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{proposta.nome_cliente}</p>
              <p className="text-xs text-muted-foreground truncate">
                {proposta.itens.map((i) => i.procedimentoNome).join(", ")}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm font-bold text-foreground">{formatCurrency(proposta.valor_total)}</span>
                {proposta.valor_desconto_protocolo > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Desconto: {formatCurrency(proposta.valor_desconto_protocolo)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-3 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleAprovar(proposta)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setReprovarProposta(proposta)}
              >
                <XCircle className="w-3.5 h-3.5" />
                Reprovar
              </Button>
            </div>
          </div>
        </Card>
      ))
    )}
  </div>
)}
```

- [ ] **Step 9: Adicionar o dialog de reprovação no JSX**

Antes do fechamento do `</div>` raiz do componente (após o `AlertDialog` de exclusão), adicionar:

```tsx
<ValidacaoReprovarDialog
  open={reprovarProposta !== null}
  onClose={() => setReprovarProposta(null)}
  onConfirm={handleReprovar}
  saving={reprovarSaving}
  nomeCliente={reprovarProposta?.nome_cliente ?? ""}
/>
```

- [ ] **Step 10: Esconder filtros de status e calendário quando aba validação ativa**

Os filtros de status (botões "Todas", "Em Negociação", etc.) devem ser envolvidos em `{!abaValidacao && ( ... )}` para ficarem ocultos quando a aba validação está ativa.

- [ ] **Step 11: Commit**

```bash
git add components/propostas/propostas-lista.tsx
git commit -m "feat: add validation tab for admin with approve/reject workflow"
```

---

### Task 4: Adicionar seção Auditoria no detalhe da proposta

**Files:**
- Modify: `components/propostas/proposta-detalhes.tsx`

- [ ] **Step 1: Importar VALIDACAO_CONFIG**

Adicionar aos imports de types:
```ts
import type { Proposta, ValidacaoStatus } from "./types"
import { STATUS_CONFIG, VALIDACAO_CONFIG } from "./types"
```

Adicionar `ShieldCheck` aos imports de lucide:
```ts
import { Pencil, Copy, User, Stethoscope, CreditCard, FileText, Clock, ShieldCheck } from "lucide-react"
```

- [ ] **Step 2: Adicionar seção Auditoria no JSX**

Após a seção `{/* Observacoes */}` e antes da seção `{/* Timestamps */}`, adicionar:

```tsx
{/* Auditoria */}
<div className="space-y-2">
  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
    <ShieldCheck className="w-4 h-4 text-primary" />
    Auditoria
  </div>
  <div className="pl-6 space-y-2 text-sm">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Status:</span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VALIDACAO_CONFIG[proposta.validacao_status as ValidacaoStatus]?.color ?? "bg-yellow-50 text-yellow-700"}`}>
        {VALIDACAO_CONFIG[proposta.validacao_status as ValidacaoStatus]?.label ?? "Pendente"}
      </span>
    </div>
    {proposta.validacao_status === "reprovada" && proposta.validacao_motivo && (
      <div>
        <span className="text-muted-foreground">Motivo:</span>
        <p className="mt-1 text-sm text-foreground bg-red-50 p-2 rounded-md">{proposta.validacao_motivo}</p>
      </div>
    )}
    {proposta.validado_em && (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Validado em:</span>
        <span className="text-foreground">{formatDate(proposta.validado_em)}</span>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/propostas/proposta-detalhes.tsx
git commit -m "feat: add Auditoria section to PropostaDetalhes"
```

---

### Task 5: Resetar validação ao duplicar proposta

**Files:**
- Modify: `components/propostas/propostas-content.tsx`

- [ ] **Step 1: Resetar campos de validação ao duplicar**

Na função `handleDuplicar`, o spread `...rest` já copia todos os campos. Precisamos garantir que a proposta duplicada comece com validação pendente. Após a linha `status: "em_negociacao"`, adicionar os resets:

```ts
const { id, created_at, updated_at, ...rest } = proposta
await supabase.from("propostas").insert({
  ...rest,
  nome_cliente: `${proposta.nome_cliente} (copia)`,
  status: "em_negociacao",
  validacao_status: "pendente",
  validacao_motivo: null,
  validado_em: null,
})
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/propostas-content.tsx
git commit -m "feat: reset validacao fields when duplicating proposal"
```

---

### Task 6: Build e verificação

- [ ] **Step 1: Rodar o build**

```bash
npm run build
```

Se houver erros de TypeScript, corrigir.

- [ ] **Step 2: Commit de correções se necessário**

```bash
git add -A
git commit -m "fix: resolve build errors from validador feature"
```
