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
  validacao_status: "pendente" | "aprovada" | "reprovada"
  validacao_motivo: string | null
  validado_em: string | null
  cashback_campanha_id?: number | null
  cashback_gerado?: number | null
  cashback_utilizado?: number | null
}

export interface PropostaItem {
  procedimentoId: string
  procedimentoNome: string
  profissionalId: number | null
  profissionalNome: string
  valor: number
  desconto_tipo: "percentual" | "valor" | null
  desconto_valor: number | null
  valor_final: number
}

export type PropostaStatus = "em_negociacao" | "aguardando_pagamento" | "pago" | "recusada"

export type ValidacaoStatus = "pendente" | "aprovada" | "reprovada"

export const VALIDACAO_CONFIG: Record<ValidacaoStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-50 text-yellow-700" },
  aprovada: { label: "Aprovada", color: "bg-green-50 text-green-700" },
  reprovada: { label: "Reprovada", color: "bg-red-50 text-red-700" },
}

export type CenarioTipo = "agressivo" | "balanceado" | "conservador" | "personalizado"

export interface Paciente {
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone_celular: string | null
  email: string | null
  ativo: boolean
}

export interface ProcedimentoClinica {
  id: number
  categoria: string
  tipo: string
  nome: string
  descricao: string | null
  valor: number
  profissional_id: number
  relevante: boolean
  ativo: boolean
}

export interface Profissional {
  id: number
  nome: string
  tipo_executor: string
  ativo: boolean
}

export interface TaxasMDR {
  debito: number
  rotativo: number
  parcelado_2_6: number
  parcelado_7_12: number
  crediario: number
  pix: number
}

export const TAXAS_MDR_PADRAO: TaxasMDR = {
  debito: 0.71,
  rotativo: 2.05,
  parcelado_2_6: 2.42,
  parcelado_7_12: 2.69,
  crediario: 3.29,
  pix: 0,
}

export const CENARIOS = {
  agressivo: { entrada_pct: 50, parcelas: 6 },
  balanceado: { entrada_pct: 30, parcelas: 8 },
  conservador: { entrada_pct: 10, parcelas: 12 },
} as const

export const STATUS_CONFIG: Record<PropostaStatus, { label: string; color: string }> = {
  em_negociacao: { label: "Em Negociacao", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  pago: { label: "Pago", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  recusada: { label: "Recusada", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
}
