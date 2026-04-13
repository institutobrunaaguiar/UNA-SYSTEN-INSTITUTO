# Design: Módulo Cashback

**Data:** 2026-04-09
**Status:** Aprovado

## Contexto

Adicionar um sistema de cashback ao UNA Sistema de Gestão que permite:
1. Criar campanhas de cashback com percentual configurável e período de vigência
2. Aplicar cashback a propostas (gera saldo para o cliente)
3. Usar saldo acumulado de cashback como abatimento em propostas futuras

## Stack e Padrões

- Next.js 14 App Router, TypeScript
- Supabase browser client via `getSupabase()` de `@/lib/supabase/client` (usa `createBrowserClient`)
- shadcn/ui: Card, Select, Input, Switch, Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, Button, Label, Separator
- Tailwind com tokens do projeto: cards brancos `border border-border rounded-xl bg-white`, labels `text-xs text-muted-foreground uppercase tracking-wider`
- Lucide React para ícones
- Sonner (`toast`) para feedback
- Padrão Sheet (painel lateral) para formulários — igual ao `campanha-form.tsx`
- Padrão de página: server component com `AppSidebar` + `Header` + `Content` — igual ao `app/painel/page.tsx`

## Tarefa 1 — Database Migrations

Criar 3 arquivos SQL em `supabase/migrations/`:

### `create_cashback_campanhas.sql`

```sql
CREATE TABLE IF NOT EXISTS cashback_campanhas (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  percentual numeric(5,2) NOT NULL CHECK (percentual > 0 AND percentual <= 100),
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cashback_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage cashback_campanhas"
  ON cashback_campanhas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

### `create_cashback_transacoes.sql`

```sql
CREATE TABLE IF NOT EXISTS cashback_transacoes (
  id serial PRIMARY KEY,
  paciente_id int NOT NULL,
  proposta_id int NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('gerado', 'utilizado')),
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  campanha_id int REFERENCES cashback_campanhas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashback_transacoes_paciente ON cashback_transacoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transacoes_proposta ON cashback_transacoes(proposta_id);

ALTER TABLE cashback_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage cashback_transacoes"
  ON cashback_transacoes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

### `alter_propostas_cashback.sql`

```sql
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS cashback_campanha_id int REFERENCES cashback_campanhas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cashback_gerado numeric(12,2),
  ADD COLUMN IF NOT EXISTS cashback_utilizado numeric(12,2);
```

## Tarefa 2 — CRUD de Campanhas de Cashback

Criar novo módulo de gerenciamento de campanhas de cashback.

### Arquivos

| Arquivo | Tipo |
|---|---|
| `app/cashback/page.tsx` | NEW — server component |
| `components/cashback/cashback-content.tsx` | NEW — orchestrator |
| `components/cashback/cashback-lista.tsx` | NEW — lista de campanhas |
| `components/cashback/cashback-form.tsx` | NEW — sheet de criar/editar |

### Interface `CashbackCampanha` (em `cashback-lista.tsx`)

```typescript
export interface CashbackCampanha {
  id: number
  nome: string
  percentual: number
  data_inicio: string
  data_fim: string
  ativa: boolean
  created_at: string
}
```

### `app/cashback/page.tsx`

Server component seguindo exatamente o padrão de `app/painel/page.tsx`:

```tsx
import { AppSidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CashbackContent } from "@/components/cashback/cashback-content"

export default function CashbackPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-[68px] dock-spacer">
        <Header title="Cashback" description="Gerencie campanhas de cashback e saldos de clientes." />
        <div className="mt-4 md:mt-5">
          <CashbackContent />
        </div>
      </main>
    </div>
  )
}
```

### `components/cashback/cashback-content.tsx`

Client component orchestrator:
- `"use client"`
- Importa `getSupabase` de `@/lib/supabase/client`
- Estado: `campanhas: CashbackCampanha[]`, `loading: boolean`, `formOpen: boolean`, `campanhaEdit: CashbackCampanha | null`
- `useEffect` ao montar: busca `cashback_campanhas` com `.select("*").order("created_at", { ascending: false })`
- Renderiza:
  - Header row: botão "Nova Campanha" (abre form com `campanhaEdit = null`)
  - Loading state: spinner igual ao `painel-content.tsx`
  - `<CashbackLista>` com props `campanhas`, `onEditar`
  - `<CashbackForm>` com props `open`, `onOpenChange`, `campanha`, `onSaved`

### `components/cashback/cashback-lista.tsx`

Client component (apenas renderização, sem fetch):
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Empty state: "Nenhuma campanha de cashback cadastrada."

Cada card (`border border-border rounded-xl bg-white p-4`):
- Header: nome da campanha (font-semibold) + badge de status (chip colorido)
- Percentual: exibe `X%` em destaque (`text-2xl font-bold text-primary`)
- Período: `data_inicio` a `data_fim` formatados como `DD/MM/YYYY`
- Footer: switch `ativa` (ao clicar: faz UPDATE imediato no Supabase + callback refresh) + botão "Editar"

**Status logic** (derivado de `ativa`, `data_inicio`, `data_fim`, data atual):
- `ativa === false` → "Inativa" (vermelho: `bg-red-50 text-red-700`)
- `today < data_inicio` → "Programada" (azul: `bg-blue-50 text-blue-700`)
- `today > data_fim` → "Encerrada" (cinza: `bg-gray-100 text-gray-600`)
- else → "Ativa" (verde: `bg-green-50 text-green-700`)

O componente recebe `onToggleAtiva: (id: number, ativa: boolean) => void` e `onEditar: (campanha: CashbackCampanha) => void` do parent content.

### `components/cashback/cashback-form.tsx`

Sheet para criar/editar campanha:

Props:
```typescript
interface CashbackFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campanha: CashbackCampanha | null
  onSaved: () => void
}
```

Campos:
- `nome`: Input text, obrigatório
- `percentual`: Input number, min=0.01, max=100, step=0.01, obrigatório
- `data_inicio`: Input date, obrigatório
- `data_fim`: Input date, obrigatório, deve ser >= data_inicio
- `ativa`: Switch

Validação antes de salvar:
- Todos os campos obrigatórios preenchidos
- `percentual > 0 && percentual <= 100`
- `data_fim >= data_inicio`
- Exibir toast.error com mensagem específica se inválido

Save:
- Nova campanha: `supabase.from("cashback_campanhas").insert({...})`
- Editar: `supabase.from("cashback_campanhas").update({...}).eq("id", campanha.id)`
- Sucesso: `toast.success("Campanha salva!")` + `onSaved()` + fechar sheet
- Erro: `toast.error("Erro ao salvar campanha")`

Usar `getSupabase` de `@/lib/supabase/client`.

## Tarefa 3 — Sidebar Navigation

Modificar `components/dashboard/sidebar.tsx`:

1. Adicionar `Gift` ao import de `lucide-react` (linha 7):
   ```typescript
   import {
     LayoutDashboard, CheckSquare, Calendar, BarChart3, Settings,
     HelpCircle, LogOut, Stethoscope, DollarSign, Megaphone, UserCircle, FileSignature, ShieldCheck, Gift,
   } from "lucide-react"
   ```

2. Adicionar no array `menuItems` após a entrada "Campanha" (linha 22):
   ```typescript
   { icon: Gift, label: "Cashback", href: "/cashback", modulo: "cashback" },
   ```

## Tarefa 4 — Integração no Formulário de Proposta

### 4a. `components/propostas/types.ts`

Adicionar campos opcionais ao tipo `Proposta`:
```typescript
cashback_campanha_id?: number | null
cashback_gerado?: number | null
cashback_utilizado?: number | null
```

### 4b. `components/propostas/steps/step-resumo.tsx`

**Novos props a adicionar à interface `StepResumoProps`:**
```typescript
cashbackCampanhas: { id: number; nome: string; percentual: number }[]
pacienteSaldo: number
cashbackCampanhaId: number | null
cashbackUtilizado: number
onCashbackCampanhaChange: (id: number | null) => void
onCashbackUtilizadoChange: (valor: number) => void
```

**Nova seção de UI** — inserir após o Card "Desconto de Protocolo" e antes do Card "Status da Proposta":

```tsx
<Card className="p-4 space-y-4">
  <div className="flex items-center gap-2">
    <Gift className="w-4 h-4 text-primary" />
    <h3 className="text-sm font-semibold text-foreground">Cashback</h3>
  </div>

  {cashbackCampanhas.length === 0 ? (
    <p className="text-sm text-muted-foreground">Nenhuma campanha de cashback ativa no momento.</p>
  ) : (
    <div className="space-y-3">
      {/* Select campanha */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Campanha</Label>
        <Select
          value={cashbackCampanhaId?.toString() ?? "nenhuma"}
          onValueChange={(v) => onCashbackCampanhaChange(v === "nenhuma" ? null : Number(v))}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Selecionar campanha..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhuma">Nenhuma</SelectItem>
            {cashbackCampanhas.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.nome} ({c.percentual}%)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview cashback gerado */}
      {cashbackCampanhaId && (
        <p className="text-sm text-green-700 font-medium">
          Cashback a gerar: {formatCurrency(cashbackGerado)} ({campanhaSelecionada?.percentual}%)
        </p>
      )}
    </div>
  )}

  {/* Usar saldo */}
  {pacienteSaldo > 0 && (
    <div className="space-y-2 pt-2 border-t border-border">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Saldo disponível do cliente</span>
        <span className="font-medium text-green-700">{formatCurrency(pacienteSaldo)}</span>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Usar cashback (abatimento)</Label>
        <Input
          type="number"
          min={0}
          max={pacienteSaldo}
          step={0.01}
          value={cashbackUtilizado || ""}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0
            onCashbackUtilizadoChange(Math.min(val, pacienteSaldo))
          }}
          placeholder="R$ 0,00"
          className="w-40"
        />
      </div>
    </div>
  )}
</Card>
```

**Cálculos locais no componente** (adicionar após `calcDescontoProtocolo`):
```typescript
const campanhaSelecionada = cashbackCampanhas.find((c) => c.id === cashbackCampanhaId) ?? null
const cashbackGerado = campanhaSelecionada ? (valorTotal * campanhaSelecionada.percentual) / 100 : 0
const valorTotalFinal = valorTotal - cashbackUtilizado
```

Onde `valorTotal = subtotal - descontoProtocolo` (existente).

**Atualizar o Card de resumo de valores** para usar `valorTotalFinal` e exibir linhas adicionais:
```tsx
{/* linha existente de descontoProtocolo... */}
{cashbackUtilizado > 0 && (
  <div className="flex justify-between">
    <span className="text-muted-foreground">Cashback utilizado</span>
    <span className="text-green-700">- {formatCurrency(cashbackUtilizado)}</span>
  </div>
)}
<div className="flex justify-between border-t border-border pt-2">
  <span className="font-semibold text-foreground">Valor Total</span>
  <span className="text-lg font-bold text-foreground">{formatCurrency(valorTotalFinal)}</span>
</div>
{cashbackGerado > 0 && (
  <div className="flex justify-between">
    <span className="text-muted-foreground">Cashback a receber</span>
    <span className="text-green-700">+ {formatCurrency(cashbackGerado)}</span>
  </div>
)}
{/* custo MDR e valor liquido — recalcular com valorTotalFinal */}
```

**Recalcular MDR com `valorTotalFinal`** (não `valorTotal`):
```typescript
const valorParcela = numParcelas > 0 ? (valorTotalFinal - valorEntrada) / numParcelas : 0

function calcMDR(): number {
  const valorParcelado = valorTotalFinal - valorEntrada
  if (valorParcelado <= 0 || numParcelas === 0) return 0
  let taxa = taxas.parcelado_2_6
  if (numParcelas > 6) taxa = taxas.parcelado_7_12
  return (valorParcelado * taxa) / 100
}
```

**Importar** `Gift` de `lucide-react` e `Select/SelectContent/SelectItem/SelectTrigger/SelectValue` de `@/components/ui/select`.

### 4c. `components/propostas/proposta-form.tsx`

**Novos estados:**
```typescript
const [cashbackCampanhas, setCashbackCampanhas] = useState<{ id: number; nome: string; percentual: number }[]>([])
const [pacienteSaldo, setPacienteSaldo] = useState(0)
const [cashbackCampanhaId, setCashbackCampanhaId] = useState<number | null>(proposta?.cashback_campanha_id ?? null)
const [cashbackUtilizado, setCashbackUtilizado] = useState(proposta?.cashback_utilizado ?? 0)
```

**Fetch campanhas ativas (useEffect ao montar, sem dependências):**
```typescript
useEffect(() => {
  async function fetchCampanhas() {
    const supabase = getSupabase()
    const today = new Date().toISOString().split("T")[0]
    const { data } = await supabase
      .from("cashback_campanhas")
      .select("id, nome, percentual")
      .eq("ativa", true)
      .lte("data_inicio", today)
      .gte("data_fim", today)
    if (data) setCashbackCampanhas(data)
  }
  fetchCampanhas()
}, [])
```

**Fetch saldo do paciente (useEffect quando pacienteId mudar):**
```typescript
useEffect(() => {
  if (!pacienteId) { setPacienteSaldo(0); return }
  async function fetchSaldo() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from("cashback_transacoes")
      .select("tipo, valor")
      .eq("paciente_id", pacienteId)
    if (data) {
      const gerado = data.filter((t) => t.tipo === "gerado").reduce((s, t) => s + t.valor, 0)
      const utilizado = data.filter((t) => t.tipo === "utilizado").reduce((s, t) => s + t.valor, 0)
      setPacienteSaldo(Math.max(0, gerado - utilizado))
    }
  }
  fetchSaldo()
}, [pacienteId])
```

**Calcular cashbackGerado (derivado, logo antes do JSX ou dentro de handleSave):**
```typescript
const campanhaSelecionada = cashbackCampanhas.find((c) => c.id === cashbackCampanhaId)
// cashbackGerado calculado na hora do save com o valorTotal final
```

**Modificar `handleSave`:**

1. Após calcular `valorTotal`, subtrair `cashbackUtilizado`:
   ```typescript
   const valorTotalFinal = valorTotal - (cashbackUtilizado || 0)
   ```

2. Recalcular entrada com base em `valorTotalFinal`:
   ```typescript
   if (cenarioTipo !== "personalizado") {
     const config = CENARIOS[cenarioTipo]
     finalEntrada = (valorTotalFinal * config.entrada_pct) / 100
     finalParcelas = config.parcelas
   }
   ```

3. Calcular `cashbackGerado` no momento do save:
   ```typescript
   const cashbackGerado = campanhaSelecionada
     ? (valorTotalFinal * campanhaSelecionada.percentual) / 100
     : 0
   ```

4. Incluir no payload:
   ```typescript
   valor_total: valorTotalFinal,
   cashback_campanha_id: cashbackCampanhaId || null,
   cashback_gerado: cashbackGerado || null,
   cashback_utilizado: cashbackUtilizado || null,
   ```

5. Para INSERT, recuperar o ID da proposta criada:
   ```typescript
   const { data: propostaData, error } = await supabase
     .from("propostas")
     .insert(payload)
     .select("id")
     .single()
   if (error) { console.error(...); return }
   const propostaId = propostaData.id
   ```

6. Para UPDATE, usar `proposta.id` existente como `propostaId`.

7. Após salvar com sucesso, inserir transações de cashback:
   ```typescript
   if (cashbackGerado > 0) {
     await supabase.from("cashback_transacoes").insert({
       paciente_id: pacienteId,
       proposta_id: propostaId,
       tipo: "gerado",
       valor: cashbackGerado,
       campanha_id: cashbackCampanhaId,
     })
   }
   if (cashbackUtilizado > 0) {
     await supabase.from("cashback_transacoes").insert({
       paciente_id: pacienteId,
       proposta_id: propostaId,
       tipo: "utilizado",
       valor: cashbackUtilizado,
       campanha_id: null,
     })
   }
   ```

**Passar novos props para StepResumo no JSX** (dentro de `step === 4`):
```tsx
<StepResumo
  {/* ...props existentes... */}
  cashbackCampanhas={cashbackCampanhas}
  pacienteSaldo={pacienteSaldo}
  cashbackCampanhaId={cashbackCampanhaId}
  cashbackUtilizado={cashbackUtilizado}
  onCashbackCampanhaChange={setCashbackCampanhaId}
  onCashbackUtilizadoChange={setCashbackUtilizado}
/>
```

**Trocar `createClient` direto pelo shared client:**
O arquivo atual usa `createClient` direto. Substituir por `import { getSupabase } from "@/lib/supabase/client"` e remover a função `getSupabase` local e o import de `createClient`.

## Visual

Seguir o padrão clean/minimalista do painel:
- Cards brancos com `border border-border rounded-xl`
- Tipografia: labels `text-xs text-muted-foreground uppercase tracking-wider`, valores em negrito
- Cashback gerado: cor verde `text-green-700`
- Cashback utilizado (desconto): cor verde `text-green-700` com prefixo `-`

## Fora do Escopo

- Página de extrato de cashback por cliente
- Notificação ao cliente sobre saldo
- Expiração automática de saldo
- Relatório de cashback no painel
