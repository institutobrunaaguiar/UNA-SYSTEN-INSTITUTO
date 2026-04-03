# Design: Página de Propostas Aprovadas

**Data:** 2026-04-03  
**Status:** Aprovado

## Contexto

Com o validador de propostas implementado, Admins aprovam/reprovam propostas pagas. Falta um espaço dedicado para visualizar e analisar as propostas aprovadas — com filtros, KPIs e busca — para entender a performance das consultoras e tomar decisões de bonificação.

## Objetivo

Criar uma nova página `/aprovadas` com KPIs resumidos, filtros avançados e lista das propostas com `validacao_status = 'aprovada'`.

## Rota e Acesso

- **Rota:** `/aprovadas`
- **Acesso:** Todos os roles (admin, operador, visualizador)
- **Sidebar:** Novo item no menu com ícone `ShieldCheck`, label "Aprovadas", posicionado após "Proposta"
- **Módulo sidebar:** `modulo: "aprovadas"`

## Dados

### Query Supabase

```
supabase
  .from("propostas")
  .select("id, valor_total, status, created_at, updated_at, nome_cliente, cpf_cliente, itens, data_proposta, validacao_status, validacao_motivo, validado_em")
  .eq("validacao_status", "aprovada")
  .order("validado_em", { ascending: false })
```

Todos os dados vêm de uma única query. Filtros são aplicados no frontend após o fetch.

### Interface de dados

Reutiliza a interface `Proposta` existente de `components/propostas/types.ts`. Cada item em `itens` contém `procedimentoNome`, `profissionalNome` e `valor_final`.

## Layout

### Seção 1 — KPIs (topo)

4 cards horizontais (`grid-cols-2 sm:grid-cols-4`), computados a partir das propostas filtradas:

| KPI | Cálculo | Subtexto |
|---|---|---|
| Total Aprovado | `sum(valor_total)` | "no período" |
| Quantidade | `count(propostas)` | "propostas aprovadas" |
| Ticket Médio | Total / Quantidade (ou 0 se vazio) | "por proposta" |
| Top Consultora | Profissional com maior `sum(valor_final)` nos itens | valor total dela |

### Seção 2 — Filtros

Linha de filtros entre KPIs e lista (`flex flex-wrap gap-3`):

1. **Mês/Ano** — `<Select>` com opções geradas dinamicamente dos últimos 12 meses. Default: mês atual. Formato: "Abril 2026". Filtra por `validado_em` (mês/ano da aprovação).

2. **Profissional** — `<Select>` com opção "Todos" + nomes únicos extraídos de `itens[].profissionalNome` das propostas carregadas. Filtra propostas que contêm pelo menos um item com o profissional selecionado.

3. **Procedimento** — `<Select>` com opção "Todos" + nomes únicos extraídos de `itens[].procedimentoNome`. Filtra propostas que contêm pelo menos um item com o procedimento selecionado.

4. **Faixa de Valor** — `<Select>` com opções:
   - Todas
   - Até R$ 1.000
   - R$ 1.000 - R$ 5.000
   - R$ 5.000 - R$ 10.000
   - Acima de R$ 10.000

5. **Busca** — `<Input>` com ícone de lupa. Filtra por `nome_cliente` (case-insensitive, partial match).

Todos os filtros são cumulativos (AND). KPIs recalculam com base nas propostas filtradas.

### Seção 3 — Lista

Cards de propostas aprovadas, ordenados por `validado_em DESC`:

Cada card exibe:
- Nome do paciente + CPF
- Procedimentos (lista dos `procedimentoNome` dos itens)
- Profissional principal (primeiro item)
- Valor total (formatado BRL)
- Data da proposta (`data_proposta` formatada DD/MM/YYYY)
- Data da aprovação (`validado_em` formatada DD/MM/YYYY)

Estado vazio: "Nenhuma proposta aprovada encontrada para os filtros selecionados."

Contagem total no rodapé: "Mostrando X propostas"

## Componentes

### Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `app/aprovadas/page.tsx` | Página server component (layout + header) |
| `components/aprovadas/aprovadas-content.tsx` | Orquestrador: fetch, filtros, estados |
| `components/aprovadas/aprovadas-kpis.tsx` | 4 KPI cards |
| `components/aprovadas/aprovadas-filtros.tsx` | Barra de filtros |
| `components/aprovadas/aprovadas-lista.tsx` | Lista de propostas aprovadas |

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `components/dashboard/sidebar.tsx` | Novo item "Aprovadas" no menu |

## Visual

Seguir o padrão clean/minimalista do painel redesenhado:
- Cards brancos com `border border-border rounded-xl`
- Tipografia: labels `text-[11px] uppercase`, valores `text-2xl font-bold`
- Cores neutras, apenas dados coloridos
- Responsivo: grids adaptam de 1 a 4 colunas

## Fora do Escopo

- Exportação para CSV/PDF
- Paginação server-side (todas as propostas aprovadas são carregadas de uma vez)
- Drill-down ao clicar em uma proposta (apenas visualização na lista)
- Comparação entre períodos
