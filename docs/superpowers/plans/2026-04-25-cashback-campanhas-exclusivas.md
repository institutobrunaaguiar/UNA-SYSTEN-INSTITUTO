# Cashback — Campanhas Exclusivas por Cliente: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar suporte a campanhas de cashback exclusivas, onde o admin seleciona quais clientes são elegíveis via lista com checkbox, e o formulário de proposta só exibe a campanha para clientes vinculados.

**Architecture:** Três arquivos modificados em sequência independente: (1) tipo + badge visual na lista, (2) formulário com toggle exclusivo + seleção de clientes + sincronização de vínculos, (3) query de campanhas no formulário de proposta filtrada por elegibilidade do paciente. O banco já foi migrado em produção.

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix UI (Sheet, Checkbox), Supabase client-side, Lucide Icons

---

### Task 1: Atualizar tipo `CashbackCampanha` e adicionar badge "Exclusiva" nos cards

**Files:**
- Modify: `components/cashback/cashback-lista.tsx`

- [ ] **Step 1: Adicionar campo `exclusivo` ao tipo e exibir badge no card**

Substituir a interface e o card em [components/cashback/cashback-lista.tsx](components/cashback/cashback-lista.tsx):

```tsx
// Linha 6 — adicionar exclusivo ao tipo
export interface CashbackCampanha {
  id: number
  nome: string
  percentual: number
  data_inicio: string
  data_fim: string
  ativa: boolean
  exclusivo: boolean
  created_at: string
}
```

No card, após o badge de status (linha ~69), adicionar o badge de exclusiva:

```tsx
{/* Header row */}
<div className="flex items-start justify-between gap-2">
  <h3 className="font-semibold text-sm text-foreground leading-tight">
    {campanha.nome}
  </h3>
  <div className="flex items-center gap-1.5 shrink-0">
    {campanha.exclusivo && (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
        Exclusiva
      </span>
    )}
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
    >
      {status.label}
    </span>
  </div>
</div>
```

- [ ] **Step 2: Verificar tipos sem erros**

```bash
cd /Users/alexrodriguesdossantos/Projetos/UNA-SYSTEN-INSTITUTO && npx tsc --noEmit 2>&1 | grep cashback-lista
```

Esperado: sem saída (nenhum erro nesse arquivo).

- [ ] **Step 3: Commit**

```bash
git add components/cashback/cashback-lista.tsx
git commit -m "feat: add exclusivo field to CashbackCampanha type and badge in card"
```

---

### Task 2: Reescrever `CashbackForm` com toggle exclusivo e seleção de clientes

**Files:**
- Modify: `components/cashback/cashback-form.tsx`

- [ ] **Step 1: Adicionar novos imports**

No topo do arquivo, adicionar à linha de imports do lucide-react:

```tsx
import { Loader2, Search, Users } from "lucide-react"
```

E adicionar o import do Checkbox:

```tsx
import { Checkbox } from "@/components/ui/checkbox"
```

- [ ] **Step 2: Adicionar novos estados ao componente**

Após `const [saving, setSaving] = useState(false)` (linha ~35), inserir:

```tsx
const [exclusivo, setExclusivo] = useState(false)
const [pacientes, setPacientes] = useState<{ id: number; nome: string; cpf_cnpj: string | null }[]>([])
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
const [buscaPaciente, setBuscaPaciente] = useState("")
const [loadingPacientes, setLoadingPacientes] = useState(false)
```

- [ ] **Step 3: Carregar pacientes e vínculos ao abrir o Sheet**

Substituir o `useEffect` existente (que começa em `if (open)`) pelo seguinte:

```tsx
useEffect(() => {
  if (!open) return

  async function init() {
    // Reset form fields
    if (campanha) {
      setNome(campanha.nome)
      setPercentual(String(campanha.percentual))
      setDataInicio(campanha.data_inicio)
      setDataFim(campanha.data_fim)
      setAtiva(campanha.ativa)
      setExclusivo(campanha.exclusivo)
    } else {
      setNome("")
      setPercentual("")
      setDataInicio("")
      setDataFim("")
      setAtiva(true)
      setExclusivo(false)
      setSelectedIds(new Set())
    }
    setBuscaPaciente("")

    // Carregar todos os pacientes
    setLoadingPacientes(true)
    try {
      const supabase = getSupabase()
      const { data: pacs } = await supabase
        .from("pacientes")
        .select("id, nome, cpf_cnpj")
        .order("nome")
      setPacientes(pacs ?? [])

      // Pré-marcar clientes já vinculados (edição de campanha exclusiva)
      if (campanha?.exclusivo) {
        const { data: vinculos } = await supabase
          .from("cashback_campanha_clientes")
          .select("paciente_id")
          .eq("campanha_id", campanha.id)
        setSelectedIds(new Set((vinculos ?? []).map((v) => v.paciente_id)))
      } else {
        setSelectedIds(new Set())
      }
    } finally {
      setLoadingPacientes(false)
    }
  }

  init()
}, [open, campanha])
```

- [ ] **Step 4: Atualizar `handleSave` para incluir campo `exclusivo` e sincronizar vínculos**

Substituir o bloco `const payload = { ... }` e a lógica de save pelo seguinte (mantendo o try/catch/finally existente):

```tsx
async function handleSave() {
  if (!nome.trim() || !percentual || Number(percentual) <= 0 || !dataInicio || !dataFim) {
    toast.error("Preencha todos os campos corretamente.")
    return
  }
  if (dataFim < dataInicio) {
    toast.error("A data fim deve ser posterior à data início.")
    return
  }
  if (exclusivo && selectedIds.size === 0) {
    toast.error("Selecione ao menos um cliente para a campanha exclusiva.")
    return
  }

  setSaving(true)
  try {
    const supabase = getSupabase()
    const payload = {
      nome: nome.trim(),
      percentual: Number(percentual),
      data_inicio: dataInicio,
      data_fim: dataFim,
      ativa,
      exclusivo,
    }

    let campanhaId: number

    if (isEditing && campanha) {
      const { error } = await supabase
        .from("cashback_campanhas")
        .update(payload)
        .eq("id", campanha.id)
      if (error) throw error
      campanhaId = campanha.id
    } else {
      const { data, error } = await supabase
        .from("cashback_campanhas")
        .insert(payload)
        .select("id")
        .single()
      if (error) throw error
      campanhaId = data.id
    }

    // Sincronizar vínculos — deletar sempre, reinserir se exclusivo
    await supabase
      .from("cashback_campanha_clientes")
      .delete()
      .eq("campanha_id", campanhaId)

    if (exclusivo && selectedIds.size > 0) {
      const { error: errVinculos } = await supabase
        .from("cashback_campanha_clientes")
        .insert([...selectedIds].map((paciente_id) => ({ campanha_id: campanhaId, paciente_id })))
      if (errVinculos) throw errVinculos
    }

    toast.success("Campanha salva!")
    onSaved()
    onOpenChange(false)
  } catch (err) {
    console.error("[cashback] Erro ao salvar:", err)
    toast.error("Erro ao salvar campanha")
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 5: Adicionar toggle "Campanha Exclusiva" e seção de clientes no JSX**

Após o bloco do switch "Campanha ativa" (que termina com `</div>` fechando o flex items-center justify-between), inserir:

```tsx
{/* Exclusivo */}
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label>Campanha Exclusiva</Label>
    <p className="text-xs text-muted-foreground">
      Restringir esta campanha a clientes selecionados.
    </p>
  </div>
  <Switch checked={exclusivo} onCheckedChange={setExclusivo} />
</div>

{/* Seleção de clientes */}
{exclusivo && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />
        Clientes elegíveis
      </Label>
      <span className="text-xs text-muted-foreground">
        {selectedIds.size} de {pacientes.length} selecionados
      </span>
    </div>

    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome ou CPF..."
        value={buscaPaciente}
        onChange={(e) => setBuscaPaciente(e.target.value)}
        className="pl-9 text-sm h-9"
      />
    </div>

    {loadingPacientes ? (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    ) : (
      <div className="border border-border rounded-lg overflow-y-auto max-h-56 divide-y divide-border">
        {pacientes
          .filter((p) => {
            const q = buscaPaciente.toLowerCase()
            return (
              p.nome.toLowerCase().includes(q) ||
              (p.cpf_cnpj ?? "").toLowerCase().includes(q)
            )
          })
          .map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <Checkbox
                checked={selectedIds.has(p.id)}
                onCheckedChange={(checked) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    if (checked) next.add(p.id)
                    else next.delete(p.id)
                    return next
                  })
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                {p.cpf_cnpj && (
                  <p className="text-[11px] text-muted-foreground">{p.cpf_cnpj}</p>
                )}
              </div>
            </label>
          ))}
        {pacientes.filter((p) => {
          const q = buscaPaciente.toLowerCase()
          return p.nome.toLowerCase().includes(q) || (p.cpf_cnpj ?? "").toLowerCase().includes(q)
        }).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum cliente encontrado.
          </p>
        )}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 6: Verificar tipos sem erros**

```bash
cd /Users/alexrodriguesdossantos/Projetos/UNA-SYSTEN-INSTITUTO && npx tsc --noEmit 2>&1 | grep cashback-form
```

Esperado: sem saída.

- [ ] **Step 7: Commit**

```bash
git add components/cashback/cashback-form.tsx
git commit -m "feat: add exclusive campaign toggle with client selection to CashbackForm"
```

---

### Task 3: Filtrar campanhas por elegibilidade no `PropostaForm`

**Files:**
- Modify: `components/propostas/proposta-form.tsx`

- [ ] **Step 1: Substituir a query de campanhas ativas**

Localizar o `useEffect` que contém `fetchCampanhasERestritos` (linhas ~93–123). Substituir apenas a parte que busca campanhas (mantendo a busca de profissionais restritos intacta):

```tsx
useEffect(() => {
  async function fetchCampanhasERestritos() {
    try {
      const supabase = getSupabase()
      const today = new Date().toISOString().split("T")[0]

      const [universaisRes, restritosRes] = await Promise.all([
        // Campanhas universais (não exclusivas)
        supabase
          .from("cashback_campanhas")
          .select("id, nome, percentual")
          .eq("ativa", true)
          .eq("exclusivo", false)
          .lte("data_inicio", today)
          .gte("data_fim", today),
        supabase
          .from("profissionais")
          .select("id")
          .eq("cashback_restrito", true),
      ])

      const universais = universaisRes.data ?? []

      // Campanhas exclusivas elegíveis para o paciente atual
      let exclusivas: { id: number; nome: string; percentual: number }[] = []
      if (pacienteId) {
        const { data: vinculos } = await supabase
          .from("cashback_campanha_clientes")
          .select("campanha_id")
          .eq("paciente_id", pacienteId)

        const campanhaIds = (vinculos ?? []).map((v) => v.campanha_id)

        if (campanhaIds.length > 0) {
          const { data: excl } = await supabase
            .from("cashback_campanhas")
            .select("id, nome, percentual")
            .eq("ativa", true)
            .eq("exclusivo", true)
            .lte("data_inicio", today)
            .gte("data_fim", today)
            .in("id", campanhaIds)

          exclusivas = excl ?? []
        }
      }

      setCashbackCampanhas([...universais, ...exclusivas])

      if (restritosRes.data) {
        setProfissionaisRestritos(new Set(restritosRes.data.map((p) => p.id)))
      }
    } catch (e) {
      console.error("[propostas] Erro ao buscar campanhas:", e)
    }
  }
  fetchCampanhasERestritos()
}, [pacienteId])
```

**Atenção:** a dependência do `useEffect` muda de `[]` para `[pacienteId]` — isso faz as campanhas serem recarregadas sempre que o paciente muda no Step 1, garantindo que a lista de campanhas reflita o cliente selecionado.

- [ ] **Step 2: Verificar tipos sem erros**

```bash
cd /Users/alexrodriguesdossantos/Projetos/UNA-SYSTEN-INSTITUTO && npx tsc --noEmit 2>&1 | grep proposta-form
```

Esperado: sem saída.

- [ ] **Step 3: Commit**

```bash
git add components/propostas/proposta-form.tsx
git commit -m "feat: filter exclusive cashback campaigns by patient eligibility in PropostaForm"
```

---

### Task 4: Verificação final e deploy

- [ ] **Step 1: Build completo sem erros**

```bash
cd /Users/alexrodriguesdossantos/Projetos/UNA-SYSTEN-INSTITUTO && npx tsc --noEmit 2>&1 | tail -5
```

Esperado: sem erros de tipo.

- [ ] **Step 2: Testar fluxo de criação de campanha exclusiva**

1. Acessar `/cashback`
2. Clicar em "Nova Campanha"
3. Preencher nome, percentual, datas
4. Ativar toggle "Campanha Exclusiva"
5. Verificar que a lista de clientes aparece com checkbox e busca
6. Selecionar 2+ clientes
7. Salvar — verificar toast "Campanha salva!"
8. Verificar badge "Exclusiva" no card da campanha na listagem

- [ ] **Step 3: Testar edição de campanha exclusiva**

1. Clicar em "Editar" na campanha exclusiva recém-criada
2. Verificar que o toggle "Campanha Exclusiva" está ativado
3. Verificar que os clientes selecionados anteriormente estão pré-marcados
4. Desmarcar um cliente, salvar
5. Reabrir — verificar que o cliente foi desmarcado

- [ ] **Step 4: Testar elegibilidade no formulário de proposta**

1. Acessar `/propostas` → Nova Proposta
2. No Step 1, selecionar um cliente que NÃO está na campanha exclusiva
3. Ir ao Step 4 (Resumo) — verificar que a campanha exclusiva NÃO aparece no select de cashback
4. Voltar ao Step 1, trocar para um cliente que ESTÁ na campanha exclusiva
5. Ir ao Step 4 — verificar que a campanha exclusiva APARECE no select

- [ ] **Step 5: Deploy**

```bash
git push origin main
```

Acompanhar deploy na Vercel em https://vercel.com/bruna-aguiars-projects/una-system-instituto-bruna-aguiar
