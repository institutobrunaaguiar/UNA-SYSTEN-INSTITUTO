"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Pencil, Copy, User, Stethoscope, CreditCard, FileText, Clock, ShieldCheck } from "lucide-react"
import type { Proposta, ValidacaoStatus } from "./types"
import { STATUS_CONFIG, VALIDACAO_CONFIG } from "./types"

interface PropostaDetalhesProps {
  proposta: Proposta | null
  open: boolean
  onClose: () => void
  onEditar: (proposta: Proposta) => void
  onDuplicar: (proposta: Proposta) => void
}

export function PropostaDetalhes({ proposta, open, onClose, onEditar, onDuplicar }: PropostaDetalhesProps) {
  if (!proposta) return null

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const cenarioLabel = {
    agressivo: "Agressivo",
    balanceado: "Balanceado",
    conservador: "Conservador",
    personalizado: "Personalizado",
  }[proposta.cenario_tipo]

  const valorParcela = proposta.num_parcelas > 0
    ? (proposta.valor_total - proposta.valor_entrada) / proposta.num_parcelas
    : 0

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            Proposta #{proposta.id}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[proposta.status].color}`}>
              {STATUS_CONFIG[proposta.status].label}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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

          {/* Procedimentos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Stethoscope className="w-4 h-4 text-primary" />
              Procedimentos ({proposta.itens.length})
            </div>
            <div className="pl-6 space-y-2">
              {proposta.itens.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{item.procedimentoNome}</p>
                    <p className="text-xs text-muted-foreground">{item.profissionalNome}</p>
                  </div>
                  <div className="text-right">
                    {item.desconto_tipo && (
                      <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.valor)}</p>
                    )}
                    <p className="font-medium">{formatCurrency(item.valor_final)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cenario */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="w-4 h-4 text-primary" />
              Cenario: {cenarioLabel}
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm pl-6">
              <div>
                <p className="text-muted-foreground">Entrada</p>
                <p className="font-medium">{formatCurrency(proposta.valor_entrada)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parcelas</p>
                <p className="font-medium">{proposta.num_parcelas}x {formatCurrency(valorParcela)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fluxo Imediato</p>
                <p className="font-medium">{formatCurrency(proposta.fluxo_caixa_imediato)}</p>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              Valores
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(proposta.valor_subtotal)}</span>
              </div>
              {proposta.valor_desconto_itens > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto itens</span>
                  <span className="text-destructive">- {formatCurrency(proposta.valor_desconto_itens)}</span>
                </div>
              )}
              {proposta.valor_desconto_protocolo > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto protocolo</span>
                  <span className="text-destructive">- {formatCurrency(proposta.valor_desconto_protocolo)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Valor Total</span>
                <span className="text-lg">{formatCurrency(proposta.valor_total)}</span>
              </div>
            </div>
          </div>

          {/* Observacoes */}
          {proposta.observacoes && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Observacoes</p>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{proposta.observacoes}</p>
            </div>
          )}

          {/* Auditoria */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Auditoria
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VALIDACAO_CONFIG[proposta.validacao_status as ValidacaoStatus]?.color ?? "bg-yellow-50 text-yellow-700"}`}>
                  {VALIDACAO_CONFIG[proposta.validacao_status as ValidacaoStatus]?.label ?? "Pendente"}
                </span>
              </div>
              {proposta.validacao_status === "reprovada" && proposta.validacao_motivo && (
                <div>
                  <span className="text-muted-foreground">Motivo:</span>
                  <p className="mt-1 text-sm text-foreground bg-red-50 p-2 rounded-md">{proposta.validacao_motivo}</p>
                </div>
              )}
              {proposta.validado_em && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Validado em:</span>
                  <span className="text-foreground">{formatDate(proposta.validado_em)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Criado em: {formatDate(proposta.created_at)}
            </div>
            {proposta.updated_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Atualizado em: {formatDate(proposta.updated_at)}
              </div>
            )}
          </div>

          {/* Acoes */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                onClose()
                onEditar(proposta)
              }}
            >
              <Pencil className="w-4 h-4" /> Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                onClose()
                onDuplicar(proposta)
              }}
            >
              <Copy className="w-4 h-4" /> Duplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
