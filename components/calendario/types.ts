export interface Agendamento {
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
  nome_paciente?: string
  nome_profissional?: string
  nome_local?: string
  nome_rotulo?: string
  cor_rotulo?: string
  nome_tipo_consulta?: string
}

export interface AgendaProcedimento {
  id: number
  idEspecialidade: number
  idPromocao: number | null
  idTipoProcedimento: number
  nome: string
  quantidade: number
}

export interface AgendaRotulo {
  id: number
  nome: string
  cor: string
}

export interface AgendaLocal {
  id: number
  nome: string
  cor: string
  ativo: boolean
}

export interface AgendaTipoConsulta {
  id: number
  nome: string
  ativo: boolean
  reconsulta: boolean
}

export interface ProfissionalMap {
  id: number
  id_pessoa: number
  nome: string
}

export type AgendaStatus =
  | "AGENDADO" | "CONFIRMADO" | "CONFIRMADO_PACIENTE"
  | "CANCELADO" | "CANCELADO_PACIENTE"
  | "EM_ESPERA" | "EM_ANDAMENTO" | "PRE_ATENDIMENTO"
  | "PAGAMENTO" | "FINALIZADO" | "FALTOU" | "REMARCOU"

export type CalendarView = "mensal" | "semanal"
export type ColorMode = "status" | "rotulo"

export const STATUS_CONFIG: Record<AgendaStatus, { label: string; color: string; dotColor: string }> = {
  AGENDADO: { label: "Agendado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", dotColor: "bg-blue-500" },
  CONFIRMADO: { label: "Confirmado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", dotColor: "bg-green-500" },
  CONFIRMADO_PACIENTE: { label: "Confirmado Paciente", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", dotColor: "bg-emerald-500" },
  CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", dotColor: "bg-red-500" },
  CANCELADO_PACIENTE: { label: "Cancelado Paciente", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200", dotColor: "bg-rose-500" },
  EM_ESPERA: { label: "Em Espera", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", dotColor: "bg-yellow-500" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", dotColor: "bg-orange-500" },
  PRE_ATENDIMENTO: { label: "Pre-Atendimento", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", dotColor: "bg-purple-500" },
  PAGAMENTO: { label: "Pagamento", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", dotColor: "bg-indigo-500" },
  FINALIZADO: { label: "Finalizado", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200", dotColor: "bg-teal-500" },
  FALTOU: { label: "Faltou", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", dotColor: "bg-gray-500" },
  REMARCOU: { label: "Remarcou", color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200", dotColor: "bg-sky-500" },
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as AgendaStatus[]
