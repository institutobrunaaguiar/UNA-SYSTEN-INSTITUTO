# Modulo Calendario — Design Spec

**Data:** 2026-03-26
**Status:** Aprovado

## Contexto

O Instituto Bruna Aguiar precisa de um modulo de calendario integrado com os dados de agendamento sincronizados da Clinica nas Nuvens (armazenados no Supabase). O modulo permite visualizar agendamentos em visao mensal e semanal, ver detalhes, alterar status e criar novos agendamentos.

## Decisoes de Design

| Decisao | Escolha |
|---|---|
| Fonte de dados | Supabase (tabelas sincronizadas da API Clinica nas Nuvens) |
| Views | Mensal + Semanal com toggle |
| Filtro profissional | Sim, dropdown no topo |
| Interacao com agendamento | Popover rapido + Sheet detalhes + alterar status |
| Codificacao visual | Toggle entre colorir por Status ou por Rotulo |
| Criar agendamento | Sim, formulario em Sheet lateral salva no Supabase |
| Rota | /calendar (mantida) |
| Abordagem | Componente monolitico com sub-componentes |

## Arquitetura de Componentes

```
components/calendario/
  calendar-content.tsx             # Orquestra: filtros, toggle view, dados
  calendar-month-view.tsx          # Grid mensal + lista do dia selecionado
  calendar-week-view.tsx           # Timeline semanal por hora (7h-21h)
  calendar-day-card.tsx            # Card de agendamento reutilizado
  calendar-popover.tsx             # Popover rapido com info resumida
  calendar-detalhes.tsx            # Sheet com detalhes completos + alterar status
  calendar-novo-agendamento.tsx    # Formulario para criar agendamento
  types.ts                         # Interfaces e constantes
```

### Fluxo de Estado

- `calendar-content.tsx` gerencia: view (`"mensal"` | `"semanal"`), filtro profissional, data selecionada, dados do Supabase
- Busca agendamentos da tabela `agenda_completa` para listagem (ja tem nomes como texto)
- Busca da tabela `agendas` para detalhes completos (tem procedimentos jsonb, IDs)
- Lista profissionais distintos a partir da `agenda_completa` (campo `profissional`)
- Lista rotulos da tabela `agenda_rotulos` (com cores)
- Toggle "Colorir por: Status / Rotulo" afeta todos os cards

### Rota e Pagina

- Rota mantida em `/calendar`
- Atualizar `app/calendar/page.tsx` para usar novo `CalendarContent`
- Remover botao "Adicionar Evento" do header (o botao fica dentro do content)

## Barra Superior (dentro de calendar-content.tsx)

- **Toggle de view:** Dois botoes "Mensal" / "Semanal"
- **Navegacao:** Setas esquerda/direita + label do periodo (ex: "Marco 2026" ou "24-30 Mar 2026")
- **Botao "Hoje"** — volta para a data atual
- **Filtro profissional:** Dropdown com "Todos" + lista de profissionais
- **Toggle coloracao:** "Status" / "Rotulo"
- **Botao "Novo Agendamento"** — abre formulario em Sheet

## Visao Mensal (calendar-month-view.tsx)

Layout em duas colunas:

**Esquerda — Grid do mes:**
- 7 colunas (Dom-Sab), dias do mes
- Cada dia mostra bolinhas coloridas (por status ou rotulo) indicando agendamentos
- Dia de hoje destacado, dia selecionado com cor primaria
- Clicar em um dia seleciona e mostra agendamentos a direita

**Direita — Lista do dia selecionado:**
- Cabecalho: data por extenso + quantidade de agendamentos
- Cards ordenados por `hora_inicio`
- Cada card mostra: hora, paciente, procedimentos, status badge, barra de cor
- Clicar no card -> abre Popover rapido

## Visao Semanal (calendar-week-view.tsx)

**Layout timeline:**
- 7 colunas (Seg-Dom da semana) + coluna lateral com horas (7h-21h)
- Agendamentos como blocos posicionados: coluna do dia, altura proporcional a duracao
- Cor do bloco: por status ou rotulo (conforme toggle)
- Dentro do bloco: hora + nome paciente (truncado)
- Clicar no bloco -> abre Popover rapido
- Linha vermelha horizontal indicando hora atual no dia de hoje
- Scroll vertical para as 14h de slots

## Popover Rapido (calendar-popover.tsx)

Aparece ao clicar no card/bloco:
- Hora, paciente, profissional, status badge, tipo consulta
- Botao "Ver detalhes" -> abre Sheet
- Compact, nao bloqueia a tela

## Sheet de Detalhes (calendar-detalhes.tsx)

Informacoes completas:
- Paciente: nome (da agenda_completa), email, telefone (da agendas)
- Horario: data, hora inicio/fim
- Profissional
- Local/Sala
- Tipo de consulta
- Rotulo com cor
- Procedimentos (lista da coluna jsonb)
- Observacoes
- Status atual com badge
- Botao **"Alterar Status"** — dropdown com 12 status, salva no Supabase

## Formulario Novo Agendamento (calendar-novo-agendamento.tsx)

Formulario simples em Sheet lateral:

- **Data** — date picker
- **Hora inicio / Hora fim** — inputs de hora
- **Paciente** — autocomplete buscando na tabela `pacientes`
- **Profissional** — select da tabela `profissionais`
- **Local/Sala** — select da tabela `agenda_local`
- **Tipo de consulta** — select da tabela `agenda_tipos_consulta`
- **Rotulo** — select da tabela `agenda_rotulos` (com preview da cor)
- **Procedimentos** — adicionar multiplos (select + quantidade)
- **Observacoes** — textarea

Salva na tabela `agendas` com status `AGENDADO`.

## Status e Cores

| Status | Cor |
|---|---|
| AGENDADO | bg-blue-100 text-blue-800 / dark:bg-blue-900 dark:text-blue-200 |
| CONFIRMADO | bg-green-100 text-green-800 / dark:bg-green-900 dark:text-green-200 |
| CONFIRMADO_PACIENTE | bg-emerald-100 text-emerald-800 / dark:bg-emerald-900 dark:text-emerald-200 |
| CANCELADO | bg-red-100 text-red-800 / dark:bg-red-900 dark:text-red-200 |
| CANCELADO_PACIENTE | bg-rose-100 text-rose-800 / dark:bg-rose-900 dark:text-rose-200 |
| EM_ESPERA | bg-yellow-100 text-yellow-800 / dark:bg-yellow-900 dark:text-yellow-200 |
| EM_ANDAMENTO | bg-orange-100 text-orange-800 / dark:bg-orange-900 dark:text-orange-200 |
| PRE_ATENDIMENTO | bg-purple-100 text-purple-800 / dark:bg-purple-900 dark:text-purple-200 |
| PAGAMENTO | bg-indigo-100 text-indigo-800 / dark:bg-indigo-900 dark:text-indigo-200 |
| FINALIZADO | bg-teal-100 text-teal-800 / dark:bg-teal-900 dark:text-teal-200 |
| FALTOU | bg-gray-100 text-gray-800 / dark:bg-gray-900 dark:text-gray-200 |
| REMARCOU | bg-sky-100 text-sky-800 / dark:bg-sky-900 dark:text-sky-200 |

## Tipos TypeScript

```typescript
interface Agendamento {
  id: number
  data: string
  hora_inicio: string
  hora_fim: string
  id_paciente: number
  id_pessoa_executor: number
  id_local_agenda: number
  id_tipo_consulta: number
  id_tipo_convenio: number
  id_rotulo: number
  email_paciente: string | null
  telefone_celular_paciente: string | null
  observacoes: string | null
  encaminhamento: string | null
  url_sala_espera: string | null
  status: AgendaStatus
  procedimentos: AgendaProcedimento[]
  created_at: string
}

interface AgendaCompleta {
  id: number
  data_agenda: string
  hora_inicio: string
  hora_fim: string
  profissional: string
  local_agenda: string
  rotulo: string
  tipo_consulta: string
  status_agenda: string
  observacoes: string | null
}

interface AgendaProcedimento {
  id: number
  idEspecialidade: number
  idPromocao: number | null
  idTipoProcedimento: number
  nome: string
  quantidade: number
}

interface AgendaRotulo {
  id: number
  nome: string
  cor: string
}

interface AgendaLocal {
  id: number
  nome: string
  cor: string
  ativo: boolean
}

interface AgendaTipoConsulta {
  id: number
  nome: string
  ativo: boolean
  reconsulta: boolean
}

type AgendaStatus =
  | "AGENDADO" | "CONFIRMADO" | "CONFIRMADO_PACIENTE"
  | "CANCELADO" | "CANCELADO_PACIENTE"
  | "EM_ESPERA" | "EM_ANDAMENTO" | "PRE_ATENDIMENTO"
  | "PAGAMENTO" | "FINALIZADO" | "FALTOU" | "REMARCOU"
```

## Tabelas Supabase Utilizadas

### agenda_completa (leitura para listagem)
id, data_agenda, hora_inicio, hora_fim, profissional, local_agenda, rotulo, tipo_consulta, status_agenda, observacoes, cidade, estado_sigla

### agendas (leitura para detalhes + escrita para criar)
id, data, hora_inicio, hora_fim, id_paciente, id_pessoa_executor, id_local_agenda, id_tipo_consulta, id_tipo_convenio, id_rotulo, email_paciente, telefone_celular_paciente, observacoes, encaminhamento, url_sala_espera, status, procedimentos (jsonb), created_at

### agenda_rotulos
id, nome, cor

### agenda_local
id, nome, cor, ativo

### agenda_tipos_consulta
id, nome, ativo, reconsulta

### pacientes (para autocomplete no formulario)
id, nome, cpf_cnpj, telefone_celular, email, ativo

### profissionais (para select no formulario)
id, nome, tipo_executor, ativo

## Operacoes

1. **Listar** — busca `agenda_completa` filtrada por periodo e profissional
2. **Ver detalhes** — busca `agendas` por ID para dados completos
3. **Alterar status** — `supabase.from("agendas").update({ status }).eq("id", id)`
4. **Criar** — `supabase.from("agendas").insert(payload)` com status AGENDADO
5. **Listar rotulos** — `supabase.from("agenda_rotulos").select("*")`
6. **Listar locais** — `supabase.from("agenda_local").select("*").eq("ativo", true)`
7. **Listar tipos consulta** — `supabase.from("agenda_tipos_consulta").select("*").eq("ativo", true)`
