# Design: Painel Redesign — Clean & Minimalista + Novas Funcionalidades

**Data:** 2026-04-03  
**Status:** Aprovado

## Contexto

O painel atual (`/painel`) exibe 4 KPIs em coluna, um gráfico de área (receita vs previsão) e um pipeline de 3 estágios. O visual é funcional mas genérico, e faltam métricas de gestão como ranking de profissionais, procedimentos mais vendidos e propostas recentes.

## Objetivo

Redesenhar o painel com visual clean/minimalista e adicionar funcionalidades de gestão: ranking de profissionais por receita, top procedimentos vendidos e lista de propostas recentes com ações rápidas.

## Direção Visual

- **Estilo:** Clean & Minimalista — fundo `#fafafa`, cards brancos com `border: 1px solid #e5e5e5`, `border-radius: 12px`
- **Cores:** Neutras por padrão, cores apenas para dados (verde=sucesso, azul=info, vermelho=perda, amarelo=negociação)
- **Tipografia:** Labels uppercase `11px #737373`, valores `24px bold #18181b`, textos secundários `12px #737373`
- **Sem sombras pesadas** — bordas sutis como separadores

## Layout

Grid responsivo em 3 seções verticais:

### Seção 1 — KPIs (topo)

**5 cards em linha** (`grid-cols-5` desktop, `grid-cols-2` + overflow mobile):

| KPI | Dado | Subtexto |
|---|---|---|
| Recebido (Mês) | Soma `valor_total` de propostas com `status='pago'` no mês | Trend % vs mês anterior + contagem |
| A Receber | Soma `valor_total` de `status='aguardando_pagamento'` | Contagem de propostas |
| Ticket Médio | Recebido / contagem de pagas no mês | "propostas pagas" |
| Conversão | Pagas / (pagas + recusadas) × 100 | "ganhas / total" |
| Propostas (Mês) | Contagem total de propostas criadas no mês | "criadas este mês" |

**Novo KPI:** "Propostas (Mês)" — contagem de todas as propostas do mês atual (qualquer status).

### Seção 2 — Grid Principal (meio)

**Duas colunas** (`grid-cols-[3fr_2fr]` desktop, empilhado mobile):

#### Coluna esquerda — Gráfico de Barras

- **Tipo:** Recharts `BarChart` (substituindo `AreaChart`)
- **Barras escuras** (`#18181b`) para meses passados (recebido real)
- **Barras claras** (`#e5e5e5`) para meses futuros (previsão)
- **Mês atual** destacado com cor azul no label
- **Eixo Y:** Formatado como "R$ XXk"
- **Tooltip:** Formatado em BRL pt-BR

#### Coluna direita — Rankings (2 cards empilhados)

**Top Profissionais:**
- Dados extraídos dos `itens` das propostas pagas (campo `profissionalNome`)
- Agrupa por profissional, soma `valor_final` de cada item
- Exibe top 3 com avatar (iniciais), nome abreviado e valor total
- Ordena por valor decrescente

**Top Procedimentos:**
- Dados extraídos dos `itens` das propostas pagas (campo `procedimentoNome`)
- Agrupa por procedimento, conta ocorrências e soma valores
- Exibe top 3 com nome, badge de contagem ("12x") e valor total
- Ordena por valor decrescente

### Seção 3 — Grid Inferior (rodapé)

**Duas colunas** (`grid-cols-2` desktop, empilhado mobile):

#### Pipeline (mantido, visual atualizado)

- 3 estágios: Ganhas (verde), Em Aberto (azul), Perdidas (vermelho)
- Cada estágio: label, valor + contagem, barra de progresso
- Barra proporcional ao percentual do total
- Visual atualizado: barras finas (6px), bordas arredondadas

#### Propostas Recentes (novo)

- Últimas 5 propostas ordenadas por `created_at DESC`
- Cada item exibe: nome do cliente, procedimentos (resumo), valor total, badge de status
- Link "Ver todas →" navega para `/proposta`
- Clique em uma proposta abre os detalhes (chama `onVerDetalhes` existente — mas como estamos no painel, navegar para `/proposta` é suficiente)

## Dados e Queries

A query atual busca apenas `valor_total, status, created_at, updated_at`. Para os rankings, precisamos dos `itens`:

```
supabase
  .from("propostas")
  .select("id, valor_total, status, created_at, updated_at, nome_cliente, itens, data_proposta")
  .gte("created_at", startOfYear)
  .lte("created_at", endOfYear)
```

**Computações adicionais no `painel-content.tsx`:**

- `computeRankingProfissionais(propostas)` — filtra `status='pago'`, extrai itens, agrupa por `profissionalNome`, soma `valor_final`
- `computeRankingProcedimentos(propostas)` — filtra `status='pago'`, extrai itens, agrupa por `procedimentoNome`, conta e soma
- `getPropostasRecentes(propostas)` — ordena por `created_at DESC`, pega as 5 primeiras

## Componentes

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `components/painel/painel-content.tsx` | Query expandida, novas funções de computação, novos componentes no render |
| `components/painel/painel-kpis.tsx` | 5 KPIs em grid horizontal, visual atualizado |
| `components/painel/painel-chart.tsx` | Trocar AreaChart por BarChart, nova paleta |
| `components/painel/painel-pipeline.tsx` | Visual atualizado (barras finas, layout vertical) |

### Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `components/painel/painel-rankings.tsx` | Top Profissionais + Top Procedimentos |
| `components/painel/painel-recentes.tsx` | Lista de propostas recentes |

## Responsividade

- **Desktop (lg+):** Layout completo em grid
- **Tablet (md):** KPIs em 3+2, seções principais empilhadas
- **Mobile (sm):** Tudo empilhado, KPIs em 2 colunas com scroll

## Fora do Escopo

- Filtros de período (mês/trimestre/ano)
- Drill-down nos rankings (clicar em profissional para ver detalhes)
- Dados em tempo real (websocket)
- Exportação de relatórios
- Dark mode
