"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Pencil, Copy, User, Stethoscope, CreditCard, FileText, Clock, ShieldCheck, Gift, ChevronDown, ArrowLeft } from "lucide-react"
import type { Proposta, ValidacaoStatus } from "./types"
import { STATUS_CONFIG, VALIDACAO_CONFIG } from "./types"

interface PropostaDetalhesProps {
  proposta: Proposta | null
  open: boolean
  onClose: () => void
  onEditar: (proposta: Proposta) => void
  onDuplicar: (proposta: Proposta) => void
}

function Section({ icon: Icon, title, children, defaultOpen = false }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
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
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg p-0">
        {/* Resumo fixo no topo — sempre visivel */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground transition-colors -ml-1 py-1 px-1 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </div>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              Proposta #{proposta.id}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CONFIG[proposta.status].color}`}>
                {STATUS_CONFIG[proposta.status].label}
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(proposta.valor_total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{proposta.nome_cliente}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{proposta.num_parcelas}x {formatCurrency(valorParcela)}</p>
              <p>Entrada: {formatCurrency(proposta.valor_entrada)}</p>
            </div>
          </div>
        </div>

        {/* Seções colapsáveis */}
        <div className="px-4 sm:px-6">
          <Section icon={User} title="Cliente" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-6">
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
          </Section>

          <Section icon={Stethoscope} title={`Procedimentos (${proposta.itens.length})`} defaultOpen={false}>
            <div className="pl-6 space-y-2">
              {proposta.itens.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.procedimentoNome}</p>
                    <p className="text-xs text-muted-foreground">{item.profissionalNome}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.desconto_tipo && (
                      <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.valor)}</p>
                    )}
                    <p className="font-medium">{formatCurrency(item.valor_final)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={CreditCard} title={`Cenario: ${cenarioLabel}`} defaultOpen={false}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm pl-6">
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
          </Section>

          <Section icon={FileText} title="Valores" defaultOpen={false}>
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
          </Section>

          {((proposta.cashback_gerado != null && proposta.cashback_gerado > 0) || (proposta.cashback_utilizado != null && proposta.cashback_utilizado > 0)) && (
            <Section icon={Gift} title="Cashback" defaultOpen={false}>
              <div className="pl-6 space-y-1 text-sm">
                {proposta.cashback_gerado != null && proposta.cashback_gerado > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cashback gerado</span>
                    <span className="text-green-700 font-medium">+ {formatCurrency(proposta.cashback_gerado)}</span>
                  </div>
                )}
                {proposta.cashback_utilizado != null && proposta.cashback_utilizado > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cashback utilizado</span>
                    <span className="text-orange-700 font-medium">- {formatCurrency(proposta.cashback_utilizado)}</span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {proposta.observacoes && (
            <div className="border-b border-border py-3">
              <p className="text-sm font-semibold text-foreground mb-1">Observacoes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{proposta.observacoes}</p>
            </div>
          )}

          <Section icon={ShieldCheck} title="Auditoria" defaultOpen={false}>
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
                  <p className="mt-1 text-sm text-foreground bg-red-50 p-2 rounded-md break-words">{proposta.validacao_motivo}</p>
                </div>
              )}
              {proposta.validado_em && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Validado em:</span>
                  <span className="text-foreground">{formatDate(proposta.validado_em)}</span>
                </div>
              )}
            </div>
          </Section>

          {/* Timestamps */}
          <div className="space-y-1 text-xs text-muted-foreground py-3">
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
        </div>

        {/* Ações fixas no fundo */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 sm:px-6 py-3 safe-area-bottom">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => { onClose(); onEditar(proposta) }}
            >
              <Pencil className="w-4 h-4" /> Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => { onClose(); onDuplicar(proposta) }}
            >
              <Copy className="w-4 h-4" /> Duplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
