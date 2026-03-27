# Dashboard — Design Spec

**Data:** 2026-03-27
**Status:** Aprovado

## Contexto

O painel atual exibe widgets genéricos (projetos, colaboração, time, mobile card) sem dados reais. O objetivo é substituí-los completamente por métricas derivadas da tabela `propostas` do Supabase, mostrando receita recebida, a receber, pipeline por status e jornada do caixa no ano.

O widget TimeTracker (cronômetro) e o módulo "Time" na sidebar também são removidos.

## Decisoes

| Decisao | Escolha |
|---|---|
| Layout | B — KPIs à esquerda, área chart à direita, pipeline na base |
| Receita | Dois KPIs separados: "Recebido" (pago) e "A Receber" (aguardando_pagamento) |
| Período do gráfico | Ano corrente (Jan–Dez), meses realizados + linha pontilhada de previsão |
| Fonte de dados | Tabela `propostas` no Supabase |

## Componentes

```
components/painel/
  painel-content.tsx        # Orquestra fetch + layout geral
  painel-kpis.tsx           # 4 cards KPI (Recebido, A Receber, Ticket Médio, Conversão)
  painel-chart.tsx          # Gráfico de área — jornada do caixa
  painel-pipeline.tsx       # 3 cards de pipeline (Ganhas, Em Aberto, Perdidas)
```

`app/page.tsx` — atualizar para usar `PainelContent`, remover todos os widgets antigos.

## KPIs

| KPI | Cálculo |
|---|---|
| Recebido (mês) | `SUM(valor_total)` onde `status = 'pago'` e `updated_at` no mês atual |
| A Receber | `SUM(valor_total)` onde `status = 'aguardando_pagamento'` |
| Ticket Médio | `AVG(valor_total)` onde `status = 'pago'` e `updated_at` no mês atual |
| Conversão | `COUNT(pago) / (COUNT(*) - COUNT(recusada)) * 100` no mês atual |

Cada KPI mostra variação percentual vs. mês anterior (ex: "↑ 14% vs fev").

## Gráfico — Jornada do Caixa

- Eixo X: Jan a Dez do ano corrente
- Eixo Y: soma de `valor_total` por mês
- **Meses realizados** (até hoje): linha sólida + área preenchida com gradiente
- **Meses futuros**: linha pontilhada (previsão = soma de propostas em aberto por mês esperado, baseado em `created_at`)
- Marcador vertical "hoje" em âmbar
- Implementado com `recharts` (AreaChart)

## Pipeline

Três cards na base com barra de progresso:

| Card | Status incluídos | Cor |
|---|---|---|
| Ganhas | `pago` | Verde |
| Em Aberto | `em_negociacao` + `aguardando_pagamento` | Azul |
| Perdidas | `recusada` | Vermelho |

Cada card mostra: quantidade de propostas, valor total, barra de progresso relativa ao total, percentual.

## O que é Removido

- `components/dashboard/time-tracker.tsx` — deletar
- `components/dashboard/stats-cards.tsx` — deletar (ou substituir)
- `components/dashboard/project-analytics.tsx` — deletar
- `components/dashboard/team-collaboration.tsx` — deletar
- `components/dashboard/reminders.tsx` — deletar
- `components/dashboard/project-progress.tsx` — deletar
- `components/dashboard/project-list.tsx` — deletar
- `components/dashboard/mobile-app-card.tsx` — deletar
- Sidebar: remover item "Time" (href `/team`) do array `menuItems`
- Header: remover botões "Adicionar Projeto" e "Importar Dados"
- Rota `/team` — deletar pasta `app/team/`

## Operacoes Supabase

```typescript
// Propostas do mês atual
supabase
  .from("propostas")
  .select("valor_total, status, updated_at, created_at")
  .gte("created_at", inicioAno)
  .lte("created_at", fimAno)
```

Toda a agregação (somas, médias, agrupamento por mês) é feita no cliente após o fetch.
