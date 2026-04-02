# Design: Campo data_proposta em Propostas

**Data:** 2026-04-02  
**Status:** Aprovado

## Contexto

A página `/proposta` permite criar e gerenciar propostas comerciais para pacientes. Atualmente, o sistema armazena `created_at` (timestamp automático do sistema), mas não há campo para registrar a data real em que a proposta foi realizada. Isso impede o cadastro retroativo com a data correta.

## Objetivo

Adicionar um campo `data_proposta` editável à proposta, preenchido automaticamente com a data de hoje mas alterável manualmente. O campo deve aparecer no formulário (Step 1), na lista de propostas e no detalhe da proposta.

## Banco de Dados

Coluna já adicionada manualmente no Supabase:

```sql
ALTER TABLE propostas 
ADD COLUMN data_proposta DATE NOT NULL DEFAULT CURRENT_DATE;
```

- Tipo: `DATE`
- Obrigatório: sim
- Default: data atual (`CURRENT_DATE`)
- Propostas existentes: receberam a data de hoje automaticamente

## Modelo de Dados

Em `components/propostas/types.ts`, adicionar à interface `Proposta`:

```ts
data_proposta: string  // formato ISO: "YYYY-MM-DD"
```

## Formulário — Step 1 (Cliente)

Arquivo: `components/propostas/steps/step-cliente.tsx`

- Adicionar props `dataProposta: string` e `onDataChange: (date: string) => void`
- Renderizar um input `type="date"` com label "Data da Proposta"
- Posicionamento: abaixo do campo de busca de paciente, acima do card de confirmação
- Valor inicial: gerenciado pelo `PropostaForm` com default `new Date().toISOString().split('T')[0]`

Arquivo: `components/propostas/proposta-form.tsx`

- Novo estado: `const [dataProposta, setDataProposta] = useState(proposta?.data_proposta ?? new Date().toISOString().split('T')[0])`
- Passa `dataProposta` e `onDataChange={setDataProposta}` para `<StepCliente>`
- Inclui `data_proposta: dataProposta` no payload do Supabase (insert e update)

## Lista de Propostas

Arquivo: `components/propostas/propostas-lista.tsx`

- Nova coluna "Data" exibindo `data_proposta` formatada como `DD/MM/YYYY`
- Posicionamento: após a coluna do paciente, antes do valor total

## Detalhe da Proposta

Arquivo: `components/propostas/proposta-detalhes.tsx`

- Exibir campo "Data da Proposta" com valor formatado como `DD/MM/YYYY`
- Posicionamento: nas informações gerais da proposta

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `components/propostas/types.ts` | Adicionar `data_proposta: string` à interface `Proposta` |
| `components/propostas/steps/step-cliente.tsx` | Input date + props dataProposta/onDataChange |
| `components/propostas/proposta-form.tsx` | Estado dataProposta, passa para StepCliente, inclui no payload |
| `components/propostas/propostas-lista.tsx` | Nova coluna "Data" |
| `components/propostas/proposta-detalhes.tsx` | Exibir data_proposta |

## Fora do Escopo

- Filtro por data na lista de propostas
- Validação de datas futuras
- Histórico de alterações da data
