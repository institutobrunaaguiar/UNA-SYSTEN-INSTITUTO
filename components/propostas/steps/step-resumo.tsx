"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Percent, DollarSign, User, Stethoscope, CreditCard, FileText, Tag, Gift } from "lucide-react"
import type { PropostaItem, CenarioTipo, TaxasMDR, PropostaStatus } from "../types"
import { CENARIOS, STATUS_CONFIG } from "../types"

interface StepResumoProps {
  nomeCliente: string
  cpfCliente: string
  itens: PropostaItem[]
  cenarioTipo: CenarioTipo
  valorEntrada: number
  numParcelas: number
  taxas: TaxasMDR
  descontoProtocoloTipo: "percentual" | "valor" | null
  descontoProtocoloValor: number
  observacoes: string
  status: PropostaStatus
  onDescontoProtocoloChange: (tipo: "percentual" | "valor" | null, valor: number) => void
  onObservacoesChange: (obs: string) => void
  onStatusChange: (status: PropostaStatus) => void
  cashbackCampanhas: { id: number; nome: string; percentual: number }[]
  pacienteSaldo: number
  cashbackCampanhaId: number | null
  cashbackUtilizado: number
  onCashbackCampanhaChange: (id: number | null) => void
  onCashbackUtilizadoChange: (valor: number) => void
}

export function StepResumo({
  nomeCliente,
  cpfCliente,
  itens,
  cenarioTipo,
  valorEntrada,
  numParcelas,
  taxas,
  descontoProtocoloTipo,
  descontoProtocoloValor,
  observacoes,
  status,
  onDescontoProtocoloChange,
  onObservacoesChange,
  onStatusChange,
  cashbackCampanhas,
  pacienteSaldo,
  cashbackCampanhaId,
  cashbackUtilizado,
  onCashbackCampanhaChange,
  onCashbackUtilizadoChange,
}: StepResumoProps) {
  const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
  const descontoItens = itens.reduce((sum, item) => sum + (item.valor - item.valor_final), 0)

  function calcDescontoProtocolo(): number {
    if (!descontoProtocoloTipo || !descontoProtocoloValor) return 0
    if (descontoProtocoloTipo === "percentual") return (subtotal * descontoProtocoloValor) / 100
    return descontoProtocoloValor
  }

  const descontoProtocolo = calcDescontoProtocolo()
  const valorTotal = subtotal - descontoProtocolo

  const campanhaSelecionada = cashbackCampanhas.find((c) => c.id === cashbackCampanhaId) ?? null
  const cashbackGerado = campanhaSelecionada ? (valorTotal * campanhaSelecionada.percentual) / 100 : 0
  const valorTotalFinal = valorTotal - cashbackUtilizado

  const valorParcela = numParcelas > 0 ? (valorTotalFinal - valorEntrada) / numParcelas : 0

  function calcMDR(): number {
    const valorParcelado = valorTotalFinal - valorEntrada
    if (valorParcelado <= 0 || numParcelas === 0) return 0
    let taxa = taxas.parcelado_2_6
    if (numParcelas > 6) taxa = taxas.parcelado_7_12
    return (valorParcelado * taxa) / 100
  }

  const custoMDR = calcMDR()
  const valorLiquido = valorTotalFinal - custoMDR

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  const cenarioLabel = cenarioTipo === "personalizado"
    ? "Personalizado"
    : { agressivo: "Agressivo", balanceado: "Balanceado", conservador: "Conservador" }[cenarioTipo]

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Nome</p>
            <p className="font-medium text-foreground">{nomeCliente}</p>
          </div>
          <div>
            <p className="text-muted-foreground">CPF</p>
            <p className="font-medium text-foreground">{cpfCliente || "Nao informado"}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Procedimentos ({itens.length})</h3>
        </div>
        <div className="space-y-2">
          {itens.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">{item.procedimentoNome}</p>
                <p className="text-xs text-muted-foreground">{item.profissionalNome}</p>
              </div>
              <div className="text-right">
                {item.desconto_tipo && (
                  <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.valor)}</p>
                )}
                <p className="font-medium text-foreground">{formatCurrency(item.valor_final)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cenario: {cenarioLabel}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Entrada</p>
            <p className="font-medium text-foreground">{formatCurrency(valorEntrada)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Parcelas</p>
            <p className="font-medium text-foreground">{numParcelas}x {formatCurrency(valorParcela)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fluxo Imediato</p>
            <p className="font-medium text-foreground">{formatCurrency(valorEntrada)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Desconto de Protocolo</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button
              type="button"
              variant={descontoProtocoloTipo === "percentual" ? "default" : "outline"}
              size="sm"
              onClick={() => onDescontoProtocoloChange("percentual", descontoProtocoloValor)}
            >
              <Percent className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant={descontoProtocoloTipo === "valor" ? "default" : "outline"}
              size="sm"
              onClick={() => onDescontoProtocoloChange("valor", descontoProtocoloValor)}
            >
              <DollarSign className="w-3 h-3" />
            </Button>
            {descontoProtocoloTipo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDescontoProtocoloChange(null, 0)}
                className="text-xs"
              >
                Limpar
              </Button>
            )}
          </div>
          {descontoProtocoloTipo && (
            <>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="w-28"
                value={descontoProtocoloValor || ""}
                onChange={(e) => onDescontoProtocoloChange(descontoProtocoloTipo, parseFloat(e.target.value) || 0)}
                placeholder={descontoProtocoloTipo === "percentual" ? "%" : "R$"}
              />
              <span className="text-sm text-muted-foreground">= - {formatCurrency(descontoProtocolo)}</span>
            </>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cashback</h3>
        </div>

        {cashbackCampanhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha de cashback ativa no momento.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Campanha</Label>
              <Select
                value={cashbackCampanhaId?.toString() ?? "nenhuma"}
                onValueChange={(v) => onCashbackCampanhaChange(v === "nenhuma" ? null : Number(v))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecionar campanha..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Nenhuma</SelectItem>
                  {cashbackCampanhas.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nome} ({c.percentual}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cashbackCampanhaId && (
              <p className="text-sm text-green-700 font-medium">
                Cashback a gerar: {formatCurrency(cashbackGerado)} ({campanhaSelecionada?.percentual}%)
              </p>
            )}
          </div>
        )}

        {pacienteSaldo > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Saldo disponivel do cliente</span>
              <span className="font-medium text-green-700">{formatCurrency(pacienteSaldo)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Saldo ja considera restricoes por profissional desta proposta.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Usar cashback (abatimento)</Label>
              <Input
                type="number"
                min={0}
                max={pacienteSaldo}
                step={0.01}
                value={cashbackUtilizado || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  onCashbackUtilizadoChange(Math.min(val, pacienteSaldo, valorTotal))
                }}
                placeholder="R$ 0,00"
                className="w-40"
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Status da Proposta</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(STATUS_CONFIG) as [PropostaStatus, { label: string; color: string }][]).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(key)}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium border-2 transition-all text-left",
                status === key
                  ? `${config.color} border-current`
                  : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {config.label}
            </button>
          ))}
        </div>
      </Card>

      <div>
        <Label className="text-sm font-medium mb-2 block">Observacoes</Label>
        <Textarea
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
          placeholder="Adicione observacoes sobre a proposta..."
          rows={3}
        />
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          {descontoItens > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto itens</span>
              <span className="text-destructive">- {formatCurrency(descontoItens)}</span>
            </div>
          )}
          {descontoProtocolo > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto protocolo</span>
              <span className="text-destructive">- {formatCurrency(descontoProtocolo)}</span>
            </div>
          )}
          {cashbackUtilizado > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cashback utilizado</span>
              <span className="text-green-700">- {formatCurrency(cashbackUtilizado)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-semibold text-foreground">Valor Total</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(valorTotalFinal)}</span>
          </div>
          {cashbackGerado > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cashback a receber</span>
              <span className="text-green-700">+ {formatCurrency(cashbackGerado)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo MDR</span>
            <span className="text-destructive">- {formatCurrency(custoMDR)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-semibold text-primary">Valor Liquido</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(valorLiquido)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
