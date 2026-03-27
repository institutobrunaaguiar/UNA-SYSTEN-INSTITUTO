# Modulo de Propostas — Design Spec

**Data:** 2026-03-26
**Status:** Aprovado

## Contexto

O Instituto Bruna Aguiar precisa de um modulo de propostas para criar, gerenciar e acompanhar propostas comerciais para clientes. O modulo integra pacientes, procedimentos esteticos, profissionais e cenarios de pagamento com calculo de taxas MDR.

## Decisoes de Design

| Decisao | Escolha |
|---|---|
| Layout | Tela unica com abas (lista + formulario) |
| Cenarios de pagamento | Fixos (Agressivo/Balanceado/Conservador) + Personalizado |
| Descontos | Por item ou no pedido total, em R$ ou % |
| Paciente nao encontrado | Cadastro rapido inline (salva no Supabase) |
| Status | 4: em_negociacao, aguardando_pagamento, pago, recusada |
| Estatisticas | Separadas no modulo Relatorios (/analytics) |
| Navegacao formulario | Stepper/Wizard com 4 etapas |
| Taxas MDR | Editaveis na interface com botoes +/- |
| Rota | /proposta (substituindo /tasks) |
| Abordagem | Componente monolitico com sub-componentes extraidos |

## Arquitetura de Componentes

```
app/proposta/
  page.tsx                           # Pagina server component

components/propostas/
  propostas-content.tsx              # Orquestra: lista <-> formulario
  propostas-lista.tsx                # Tabela + filtros + acoes
  proposta-form.tsx                  # Stepper wizard (4 etapas)
  steps/
    step-cliente.tsx                 # Autocomplete paciente + cadastro rapido
    step-procedimentos.tsx           # Adicionar itens + descontos por item
    step-cenarios.tsx                # 4 cenarios + taxas MDR editaveis
    step-resumo.tsx                  # Revisao + desconto protocolo + observacoes
  proposta-detalhes.tsx              # Sheet lateral (ver/editar proposta existente)
  taxas-mdr-editor.tsx               # Editor de taxas MDR com botoes +/-
```

### Fluxo de Estado

- `propostas-content.tsx` gerencia a view ativa: `"lista"` | `"nova"` | `"editar"`
- Quando salva/cancela o formulario, volta para lista e recarrega dados
- Supabase client criado diretamente nos componentes (padrao existente)
- Rota continua em `/proposta` (sem sub-rotas)

## Tela de Lista (propostas-lista.tsx)

### Barra Superior
- Campo de busca por **nome** e **CPF**
- Filtros: status (todos, em_negociacao, aguardando_pagamento, pago, recusada), periodo (mes/ano), faixa de valor (min/max)

### Tabela

| # | Cliente | CPF | Procedimentos | Valor Total | Status | Data | Acoes |
|---|---|---|---|---|---|---|---|
| 42 | Maria Silva | 123.456.789-01 | Botox, Preenchimento | R$ 1.615,00 | Em Negociacao | 13/03/2026 | ... |

### Menu de Acoes (tres pontos)
- Ver detalhes (abre Sheet lateral)
- Editar (abre wizard com dados preenchidos)
- Duplicar (cria copia com status `em_negociacao`)
- Alterar status (dropdown com os 4 status)
- Excluir (com confirmacao)

### Status Badges
- `em_negociacao` -> amarelo
- `aguardando_pagamento` -> azul
- `pago` -> verde
- `recusada` -> vermelho

## Stepper/Wizard do Formulario (proposta-form.tsx)

Barra de progresso com 4 steps numerados no topo. Step ativo destacado com cor primaria (verde). Botoes "Voltar" e "Proximo" no rodape.

### Step 1 — Cliente (step-cliente.tsx)

- Campo de busca com autocomplete: digita nome ou CPF -> lista pacientes encontrados no Supabase
- Ao selecionar, preenche: nome, CPF, telefone, email
- Se nao encontrar -> botao "Cadastrar novo paciente"
  - Mini-formulario inline: nome, CPF, telefone, email (campos minimos)
  - Salva na tabela `pacientes` do Supabase
  - Ja vincula automaticamente a proposta

### Step 2 — Procedimentos (step-procedimentos.tsx)

- Botao "+ Adicionar procedimento"
- Para cada item:
  - Select de **profissional** (busca tabela `profissionais`)
  - Select de **procedimento** (busca tabela `procedimentos`)
  - Campo **valor** (R$) — preenchido manualmente
  - Desconto por item (toggle): escolha entre **R$** ou **%**, campo de valor
  - **Valor final** calculado automaticamente
  - Botao remover item (X)
- Rodape com **subtotal** atualizado em tempo real

### Step 3 — Cenarios de Pagamento (step-cenarios.tsx)

- 4 cards selecionaveis:
  - **Agressivo:** 50% entrada + 6x
  - **Balanceado:** 30% entrada + 8x
  - **Conservador:** 10% entrada + 12x
  - **Personalizado:** campos editaveis (% entrada + n parcelas)
- Ao selecionar, calcula automaticamente:
  - Valor da entrada
  - Valor de cada parcela
  - Fluxo de caixa imediato
- Secao colapsavel **"Taxas MDR"** com editor (+/-):
  - Debito, Rotativo, Parcelado 2-6x, Parcelado 7-12x, Crediario, Pix
  - Mostra custo MDR sobre o valor parcelado
  - Mostra **valor liquido** que a clinica recebe

### Step 4 — Resumo (step-resumo.tsx)

- Resumo completo: cliente, itens, cenario escolhido
- Desconto de protocolo (no pedido total): toggle **R$** ou **%**
- Campo de **observacoes** (textarea)
- Totais finais:
  - Subtotal | Desconto itens | Desconto protocolo | **Valor Total**
  - Entrada | Parcelas | Fluxo de caixa | Custo MDR | **Liquido**
- Botao **"Salvar Proposta"**

## Detalhes e Acoes (proposta-detalhes.tsx)

Sheet lateral — abre ao clicar "Ver detalhes" na lista:
- Dados do cliente (nome, CPF, telefone)
- Lista de procedimentos com valores e descontos
- Cenario escolhido com calculos
- Taxas MDR e valor liquido
- Status atual com badge colorido
- Observacoes
- Timestamps (criado em, atualizado em)
- Botoes de acao: **Editar**, **Duplicar**, **Alterar Status**

## Editor de Taxas MDR (taxas-mdr-editor.tsx)

Componente reutilizavel:
- Tabela com linhas: Debito, Rotativo, Parcelado 2-6x, Parcelado 7-12x, Crediario, Pix
- Cada linha: botao **-**, campo de ajuste, botao **+**, taxa atual (%)
- Taxas padrao iniciais salvas em `localStorage` (persistem entre sessoes)
- As taxas sao usadas no Step 3 para calcular o custo MDR

### Taxas Padrao

| Modalidade | Taxa MDR |
|---|---|
| Debito | 0,71% |
| Rotativo | 2,05% |
| Parcelado 2-6x | 2,42% |
| Parcelado 7-12x | 2,69% |
| Crediario | 3,29% |
| Pix | 0% |

## Tipos TypeScript

```typescript
interface Proposta {
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
  cenario_tipo: "agressivo" | "balanceado" | "conservador" | "personalizado"
  valor_entrada: number
  num_parcelas: number
  fluxo_caixa_imediato: number
  status: "em_negociacao" | "aguardando_pagamento" | "pago" | "recusada"
  observacoes: string | null
  created_at: string
  updated_at: string
}

interface PropostaItem {
  procedimentoId: string
  procedimentoNome: string
  profissionalNome: string
  valor: number
  desconto_tipo: "percentual" | "valor" | null
  desconto_valor: number | null
  valor_final: number
}
```

## Tabelas Supabase Existentes

### pacientes
id, nome, nome_social, sexo, genero, cpf_cnpj, data_nascimento, telefone, telefone_celular, email, cep, rua, numero, complemento, bairro, id_cidade, estrangeiro, numero_identificacao, ativo, created_at

### procedimentos
id, nome, especialidade_id, especialidade_nome, ativo, created_at, updated_at

### profissionais
id, nome, tipo_executor, id_pessoa, ativo, created_at, updated_at

### propostas
id, paciente_id, nome_cliente, cpf_cliente, itens (jsonb), valor_subtotal, valor_desconto_itens, desconto_protocolo_percentual, desconto_protocolo_valor, valor_desconto_protocolo, valor_total, cenario_tipo, valor_entrada, num_parcelas, fluxo_caixa_imediato, status, observacoes, created_at, updated_at

## Mudancas na Navegacao

- Renomear rota `/tasks` -> `/proposta`
- Atualizar sidebar: href de `/tasks` para `/proposta`
- Remover `app/tasks/` e `components/tasks/`

## Operacoes CRUD

1. **Criar** — wizard completo, salva no Supabase com `supabase.from("propostas").insert()`
2. **Listar** — busca com filtros via `supabase.from("propostas").select()` com `.ilike()`, `.eq()`, `.gte()`, `.lte()`
3. **Editar** — abre wizard preenchido, salva com `supabase.from("propostas").update()`
4. **Duplicar** — copia proposta, muda status para `em_negociacao`, nome para "nome (copia)", salva como nova
5. **Alterar status** — `supabase.from("propostas").update({ status })`
6. **Excluir** — `supabase.from("propostas").delete()` com confirmacao
7. **Buscar pacientes** — `supabase.from("pacientes").select()` com `.ilike()` para autocomplete
8. **Cadastro rapido paciente** — `supabase.from("pacientes").insert()` inline no formulario
