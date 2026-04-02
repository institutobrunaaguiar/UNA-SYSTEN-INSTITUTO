# Campo data_proposta em Propostas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o campo `data_proposta` (editável, default hoje) ao formulário de propostas, exibindo-o na lista (calendário) e no detalhe.

**Architecture:** A coluna `data_proposta DATE` já existe no Supabase. As alterações são puramente no frontend: tipo, formulário (Step 1), lista e detalhe. O calendário já agrupa propostas por data — basta trocar `created_at` por `data_proposta`.

**Tech Stack:** Next.js 14, TypeScript, Supabase JS client, shadcn/ui, Tailwind CSS

---

### Task 1: Adicionar `data_proposta` à interface Proposta

**Files:**
- Modify: `components/propostas/types.ts`

- [ ] **Step 1: Adicionar o campo à interface**

Em `components/propostas/types.ts`, adicionar `data_proposta` logo após `updated_at` na interface `Proposta`:

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
  data_proposta: string  // formato ISO: "YYYY-MM-DD"
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/types.ts
git commit -m "feat: add data_proposta field to Proposta type"
```

---

### Task 2: Adicionar input de data no Step 1 (Cliente)

**Files:**
- Modify: `components/propostas/steps/step-cliente.tsx`

- [ ] **Step 1: Adicionar props ao StepCliente**

Localizar a interface `StepClienteProps` (linha 12) e adicionar as duas novas props:

```ts
interface StepClienteProps {
  pacienteId: number | null
  nomeCliente: string
  cpfCliente: string
  onSelect: (paciente: { id: number; nome: string; cpf: string }) => void
  dataProposta: string
  onDataChange: (date: string) => void
}
```

- [ ] **Step 2: Desestruturar as novas props na função**

Localizar a linha da função (linha 19) e adicionar as novas props:

```ts
export function StepCliente({ pacienteId, nomeCliente, cpfCliente, onSelect, dataProposta, onDataChange }: StepClienteProps) {
```

- [ ] **Step 3: Adicionar o campo de data no JSX**

Adicionar o campo logo após o fechamento do bloco de busca de paciente (após a `</div>` que fecha o `<div className="space-y-6">` do campo de busca, antes do bloco `{selected && ...}`). O campo deve ficar entre a busca e o card de confirmação do paciente selecionado:

```tsx
<div>
  <Label className="text-sm font-medium mb-2 block">Data da Proposta</Label>
  <Input
    type="date"
    value={dataProposta}
    onChange={(e) => onDataChange(e.target.value)}
    className="w-full"
  />
</div>
```

O bloco completo do return ficará assim (início do `<div className="space-y-6">`):

```tsx
return (
  <div className="space-y-6">
    <div>
      <Label className="text-sm font-medium mb-2 block">Buscar Paciente</Label>
      {/* ... campo de busca existente ... */}
    </div>

    <div>
      <Label className="text-sm font-medium mb-2 block">Data da Proposta</Label>
      <Input
        type="date"
        value={dataProposta}
        onChange={(e) => onDataChange(e.target.value)}
        className="w-full"
      />
    </div>

    {selected && (
      // ... card de confirmação existente ...
    )}
    {/* ... resto do JSX existente ... */}
  </div>
)
```

- [ ] **Step 4: Commit**

```bash
git add components/propostas/steps/step-cliente.tsx
git commit -m "feat: add data_proposta input to StepCliente"
```

---

### Task 3: Gerenciar `data_proposta` no PropostaForm

**Files:**
- Modify: `components/propostas/proposta-form.tsx`

- [ ] **Step 1: Adicionar estado dataProposta**

Localizar o bloco de estados do Step 1 (em torno da linha 48) e adicionar logo após `cpfCliente`:

```ts
const [dataProposta, setDataProposta] = useState(
  proposta?.data_proposta ?? new Date().toISOString().split("T")[0]
)
```

- [ ] **Step 2: Passar dataProposta para StepCliente**

Localizar o bloco `{step === 1 && (` (em torno da linha 211) e adicionar as duas novas props no `<StepCliente>`:

```tsx
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
    dataProposta={dataProposta}
    onDataChange={setDataProposta}
  />
)}
```

- [ ] **Step 3: Incluir data_proposta no payload do Supabase**

Localizar o objeto `payload` na função `handleSave` (em torno da linha 126) e adicionar `data_proposta`:

```ts
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
  status,
  observacoes: observacoes || null,
  data_proposta: dataProposta,
}
```

- [ ] **Step 4: Commit**

```bash
git add components/propostas/proposta-form.tsx
git commit -m "feat: wire data_proposta state and payload in PropostaForm"
```

---

### Task 4: Usar data_proposta no calendário da lista

**Files:**
- Modify: `components/propostas/propostas-lista.tsx`

- [ ] **Step 1: Trocar created_at por data_proposta no agrupamento**

Localizar o bloco de agrupamento (em torno da linha 169):

```ts
const propostasPorDia: Record<string, Proposta[]> = {}
filtered.forEach((p) => {
  const key = getDateKey(p.created_at)   // <-- linha a alterar
  if (!propostasPorDia[key]) propostasPorDia[key] = []
  propostasPorDia[key].push(p)
})
```

Alterar `getDateKey(p.created_at)` para usar `data_proposta` diretamente (já está no formato `YYYY-MM-DD`, não precisa de parsing):

```ts
const propostasPorDia: Record<string, Proposta[]> = {}
filtered.forEach((p) => {
  const key = p.data_proposta
  if (!propostasPorDia[key]) propostasPorDia[key] = []
  propostasPorDia[key].push(p)
})
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/propostas-lista.tsx
git commit -m "feat: group calendar proposals by data_proposta instead of created_at"
```

---

### Task 5: Exibir data_proposta no detalhe da proposta

**Files:**
- Modify: `components/propostas/proposta-detalhes.tsx`

- [ ] **Step 1: Adicionar formatação de data simples (sem hora)**

A função `formatDate` existente (linha 29) formata com hora — é usada para `created_at`. Para `data_proposta` (que é `YYYY-MM-DD`), usar uma formatação simples sem precisar criar nova função. Adicionar uma linha no bloco de informações do Cliente (após o CPF, em torno da linha 76):

No bloco `{/* Cliente */}` dentro do `<div className="grid grid-cols-2 gap-2 text-sm pl-6">`, adicionar uma terceira coluna (ou linha separada) para a data:

```tsx
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
    <div>
      <p className="text-muted-foreground">Data da Proposta</p>
      <p className="font-medium">
        {proposta.data_proposta
          ? new Date(proposta.data_proposta + "T12:00:00").toLocaleDateString("pt-BR")
          : "Nao informado"}
      </p>
    </div>
  </div>
</div>
```

> **Nota:** O `+ "T12:00:00"` evita problema de fuso horário ao formatar datas `YYYY-MM-DD` com `toLocaleDateString`. Sem isso, `new Date("2026-04-02")` é interpretado como UTC midnight e pode exibir o dia anterior em fusos negativos.

- [ ] **Step 2: Commit**

```bash
git add components/propostas/proposta-detalhes.tsx
git commit -m "feat: display data_proposta in PropostaDetalhes"
```

---

### Task 6: Verificação final

- [ ] **Step 1: Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

- [ ] **Step 2: Verificar fluxo completo**

1. Abrir `/proposta`
2. Clicar em "Nova Proposta"
3. No Step 1, confirmar que o campo "Data da Proposta" aparece preenchido com a data de hoje
4. Alterar a data para uma data diferente (ex: ontem)
5. Completar os 4 steps e salvar a proposta
6. Verificar que no calendário a proposta aparece no dia correto (data informada, não hoje)
7. Clicar na proposta e verificar que no detalhe a "Data da Proposta" exibe corretamente em DD/MM/YYYY
8. Abrir uma proposta existente para editar e confirmar que a data é carregada corretamente

- [ ] **Step 3: Fazer push**

```bash
git push origin main
```
