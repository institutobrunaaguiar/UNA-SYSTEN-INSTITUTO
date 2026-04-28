"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, Zap, Scale, Shield, SlidersHorizontal } from "lucide-react"
import { TaxasMDREditor } from "../taxas-mdr-editor"
import type { CenarioTipo, TaxasMDR } from "../types"
import { CENARIOS } from "../types"

interface StepCenariosProps {
  valorTotal: number
  cenarioTipo: CenarioTipo
  valorEntrada: number
  numParcelas: number
  taxas: TaxasMDR
  onCenarioChange: (cenario: CenarioTipo, entrada: number, parcelas: number) => void
  onTaxasChange: (taxas: TaxasMDR) => void
}

const CENARIO_ICONS = {
  agressivo: Zap,
  balanceado: Scale,
  conservador: Shield,
  personalizado: SlidersHorizontal,
}

const CENARIO_LABELS = {
  agressivo: "Agressivo",
  balanceado: "Balanceado",
  conservador: "Conservador",
  personalizado: "Personalizado",
}

const CENARIO_DESC = {
  agressivo: "50% de entrada + 6 parcelas. Melhor fluxo de caixa.",
  balanceado: "30% de entrada + 8 parcelas. Equilibrio entre caixa e acessibilidade.",
  conservador: "10% de entrada + 12 parcelas. Mais acessivel para o cliente.",
  personalizado: "Defina a entrada e parcelas manualmente.",
}

export function StepCenarios({
  valorTotal,
  cenarioTipo,
  valorEntrada,
  numParcelas,
  taxas,
  onCenarioChange,
  onTaxasChange,
}: StepCenariosProps) {
  const [customEntradaPct, setCustomEntradaPct] = useState(30)
  const [customParcelas, setCustomParcelas] = useState(6)
  const [mdrOpen, setMdrOpen] = useState(false)

  function selectCenario(tipo: CenarioTipo) {
    if (tipo === "personalizado") {
      const entrada = (valorTotal * customEntradaPct) / 100
      onCenarioChange(tipo, entrada, customParcelas)
    } else {
      const config = CENARIOS[tipo]
      const entrada = (valorTotal * config.entrada_pct) / 100
      onCenarioChange(tipo, entrada, config.parcelas)
    }
  }

  function handleCustomChange(entradaPct: number, parcelas: number) {
    setCustomEntradaPct(entradaPct)
    setCustomParcelas(parcelas)
    if (cenarioTipo === "personalizado") {
      const entrada = (valorTotal * entradaPct) / 100
      onCenarioChange("personalizado", entrada, parcelas)
    }
  }

  const valorParcela = numParcelas > 0 ? (valorTotal - valorEntrada) / numParcelas : 0

  function calcularMDR(): number {
    if (numParcelas === 0) return 0
    const valorParcelado = valorTotal - valorEntrada
    let taxaMdr = taxas.parcelado_2_6
    if (numParcelas > 6) taxaMdr = taxas.parcelado_7_12
    return (valorParcelado * taxaMdr) / 100
  }

  const custoMDR = calcularMDR()
  const valorLiquido = valorTotal - custoMDR

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["agressivo", "balanceado", "conservador", "personalizado"] as CenarioTipo[]).map((tipo) => {
          const Icon = CENARIO_ICONS[tipo]
          const isSelected = cenarioTipo === tipo
          return (
            <Card
              key={tipo}
              className={`p-4 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "hover:border-primary/50 hover:shadow-md"
              }`}
              onClick={() => selectCenario(tipo)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{CENARIO_LABELS[tipo]}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{CENARIO_DESC[tipo]}</p>
                  {tipo !== "personalizado" && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatCurrency((valorTotal * CENARIOS[tipo].entrada_pct) / 100)}
                      </span>
                      {" entrada + "}
                      <span className="font-medium text-foreground">{CENARIOS[tipo].parcelas}x</span>
                      {" de "}
                      <span className="font-medium text-foreground">
                        {formatCurrency((valorTotal - (valorTotal * CENARIOS[tipo].entrada_pct) / 100) / CENARIOS[tipo].parcelas)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {cenarioTipo === "personalizado" && (
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Configuracao Personalizada</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Entrada (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={customEntradaPct}
                onChange={(e) => handleCustomChange(parseFloat(e.target.value) || 0, customParcelas)}
              />
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency((valorTotal * customEntradaPct) / 100)}</p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Entrada (R$)</Label>
              <Input
                type="number"
                min="0"
                max={valorTotal}
                step="0.01"
                value={Number(((valorTotal * customEntradaPct) / 100).toFixed(2))}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value) || 0
                  const pct = valorTotal > 0 ? (valor / valorTotal) * 100 : 0
                  handleCustomChange(Number(pct.toFixed(4)), customParcelas)
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">{customEntradaPct.toFixed(2)}% do total</p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Parcelas</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={customParcelas}
                onChange={(e) => handleCustomChange(customEntradaPct, parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(valorParcela)} / parcela</p>
            </div>
          </div>
        </Card>
      )}

      {cenarioTipo && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Resumo do Cenario</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Entrada</p>
              <p className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(valorEntrada)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Parcelas</p>
              <p className="text-base sm:text-lg font-bold text-foreground">{numParcelas}x {formatCurrency(valorParcela)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo MDR</p>
              <p className="text-base sm:text-lg font-bold text-destructive">- {formatCurrency(custoMDR)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Liquido</p>
              <p className="text-base sm:text-lg font-bold text-primary">{formatCurrency(valorLiquido)}</p>
            </div>
          </div>
        </Card>
      )}

      <Collapsible open={mdrOpen} onOpenChange={setMdrOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
          <ChevronDown className={`w-4 h-4 transition-transform ${mdrOpen ? "rotate-180" : ""}`} />
          Taxas MDR
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="p-4">
            <TaxasMDREditor taxas={taxas} onChange={onTaxasChange} />
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
