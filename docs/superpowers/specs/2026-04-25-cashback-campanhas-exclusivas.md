# Design Spec: Campanhas de Cashback Exclusivas

**Data:** 2026-04-25
**Status:** Aprovado
**Arquivos alvo:** `components/cashback/cashback-form.tsx`, `components/propostas/proposta-form.tsx`

---

## Objetivo

Permitir que o admin crie campanhas de cashback com percentual personalizado e elegibilidade restrita a um conjunto específico de clientes (pacientes), selecionados via lista com checkbox. A campanha exclusiva só aparece no formulário de proposta quando o cliente da proposta é elegível.

---

## Banco de Dados

### Já executado em produção

```sql
ALTER TABLE cashback_campanhas ADD COLUMN exclusivo BOOLEAN DEFAULT false;

CREATE TABLE cashback_campanha_clientes (
  id          SERIAL PRIMARY KEY,
  campanha_id INTEGER REFERENCES cashback_campanhas(id) ON DELETE CASCADE,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  UNIQUE(campanha_id, paciente_id)
);
```

- `exclusivo = false` (default) → comportamento atual, campanha universal
- `exclusivo = true` → apenas pacientes com vínculo em `cashback_campanha_clientes` são elegíveis
- `ON DELETE CASCADE` em ambas as FKs garante limpeza automática ao deletar campanha ou paciente

---

## UI — CashbackForm (`components/cashback/cashback-form.tsx`)

### Novos campos de estado

```ts
const [exclusivo, setExclusivo] = useState(false)
const [pacientes, setPacientes] = useState<{ id: number; nome: string; cpf_cnpj: string | null }[]>([])
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
const [buscaPaciente, setBuscaPaciente] = useState("")
```

### Carregamento de pacientes

Ao abrir o Sheet (`open = true`), buscar todos os pacientes ordenados por nome:

```ts
supabase.from("pacientes").select("id, nome, cpf_cnpj").order("nome")
```

Se editando campanha com `exclusivo = true`, também buscar os vínculos existentes:

```ts
supabase.from("cashback_campanha_clientes")
  .select("paciente_id")
  .eq("campanha_id", campanha.id)
```

Pré-marcar os checkboxes com os `paciente_id` encontrados.

### Layout do formulário

Após o switch "Campanha ativa", adicionar:

1. **Toggle "Campanha Exclusiva"** — `Switch` + label + descrição "Restringir esta campanha a clientes selecionados"
2. **Seção de seleção** (renderizada condicionalmente quando `exclusivo = true`):
   - Label "Clientes elegíveis"
   - Contador `X de Y clientes selecionados`
   - Input de busca por nome/CPF
   - Lista scrollável (max-height fixo, overflow-y-auto) com um item por paciente:
     - Checkbox à esquerda
     - Nome do paciente
     - CPF em texto menor (se disponível)
   - Validação: se `exclusivo = true` e `selectedIds.size === 0`, bloquear save com toast "Selecione ao menos um cliente para a campanha exclusiva."

### Lógica de save

```ts
// 1. Salvar campanha (insert ou update) com campo exclusivo
const payload = { nome, percentual, data_inicio, data_fim, ativa, exclusivo }

// 2. Se exclusivo = true: sincronizar vínculos
//    - Deletar todos os vínculos antigos da campanha
//    - Inserir os novos selecionados em batch
await supabase.from("cashback_campanha_clientes").delete().eq("campanha_id", campanhaId)
await supabase.from("cashback_campanha_clientes").insert(
  [...selectedIds].map(paciente_id => ({ campanha_id: campanhaId, paciente_id }))
)

// 3. Se exclusivo = false: garantir que não existem vínculos residuais
await supabase.from("cashback_campanha_clientes").delete().eq("campanha_id", campanhaId)
```

---

## UI — CashbackLista (`components/cashback/cashback-lista.tsx`)

Nos cards de campanha, exibir badge "Exclusiva" quando `campanha.exclusivo = true`:

```tsx
{campanha.exclusivo && (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
    Exclusiva
  </span>
)}
```

O tipo `CashbackCampanha` precisa adicionar o campo `exclusivo: boolean`.

---

## Lógica de Aplicação — PropostaForm (`components/propostas/proposta-form.tsx`)

### Query de campanhas ativas (linha ~98)

Substituir a query atual por dois selects paralelos:

```ts
const [universaisRes, exclusivasRes] = await Promise.all([
  // Campanhas universais — sem restrição de cliente
  supabase
    .from("cashback_campanhas")
    .select("id, nome, percentual")
    .eq("ativa", true)
    .eq("exclusivo", false)
    .lte("data_inicio", today)
    .gte("data_fim", today),

  // Campanhas exclusivas — apenas se o paciente tem vínculo
  pacienteId
    ? supabase
        .from("cashback_campanha_clientes")
        .select("campanha_id, cashback_campanhas!inner(id, nome, percentual, ativa, exclusivo, data_inicio, data_fim)")
        .eq("paciente_id", pacienteId)
        // filtrar apenas ativas e dentro do período via join
    : Promise.resolve({ data: [], error: null }),
])
```

Alternativa mais simples (dois selects sem join):

1. Buscar campanhas exclusivas vinculadas ao paciente: `cashback_campanha_clientes` onde `paciente_id = X` → obter lista de `campanha_id`
2. Buscar detalhes dessas campanhas com filtro de ativa + período
3. Concatenar com campanhas universais

O resultado final é `setCashbackCampanhas([...universais, ...exclusivas])`.

**Se `pacienteId` for null** (cliente ainda não selecionado), exibir apenas campanhas universais.

### Nenhuma mudança na lógica de save

A geração de transações de cashback (linhas 260–282) permanece idêntica — a filtragem na busca garante que só campanhas elegíveis aparecem no select.

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `components/cashback/cashback-form.tsx` | Adicionar toggle exclusivo + lista de clientes com checkbox + lógica de save com sincronização de vínculos |
| `components/cashback/cashback-lista.tsx` | Adicionar campo `exclusivo` ao tipo `CashbackCampanha` + badge visual no card |
| `components/propostas/proposta-form.tsx` | Substituir query de campanhas ativas por dois selects (universais + exclusivas do paciente) |

---

## O que NÃO muda

- Lógica de geração de transações cashback no save da proposta
- Estrutura dos cards de campanha (exceto badge)
- Fluxo de transferência de cashback entre clientes
- Props e interfaces existentes do CashbackForm (exceto tipo CashbackCampanha)
