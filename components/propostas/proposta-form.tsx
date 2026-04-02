"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { StepCliente } from "./steps/step-cliente"
import { StepProcedimentos } from "./steps/step-procedimentos"
import { StepCenarios } from "./steps/step-cenarios"
import { StepResumo } from "./steps/step-resumo"
import type { Proposta, PropostaItem, CenarioTipo, TaxasMDR, PropostaStatus } from "./types"
import { TAXAS_MDR_PADRAO, CENARIOS } from "./types"

interface PropostaFormProps {
  proposta?: Proposta | null
  onSave: () => void
  onCancel: () => void
}

const STEPS = [
  { label: "Cliente", number: 1 },
  { label: "Procedimentos", number: 2 },
  { label: "Cenarios", number: 3 },
  { label: "Resumo", number: 4 },
]

function loadTaxas(): TaxasMDR {
  if (typeof window === "undefined") return TAXAS_MDR_PADRAO
  try {
    const saved = localStorage.getItem("taxas_mdr")
    if (saved) return JSON.parse(saved)
  } catch {}
  return TAXAS_MDR_PADRAO
}

function saveTaxas(taxas: TaxasMDR) {
  try {
    localStorage.setItem("taxas_mdr", JSON.stringify(taxas))
  } catch {}
}

export function PropostaForm({ proposta, onSave, onCancel }: PropostaFormProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1 state
  const [pacienteId, setPacienteId] = useState<number | null>(proposta?.paciente_id ?? null)
  const [nomeCliente, setNomeCliente] = useState(proposta?.nome_cliente ?? "")
  const [cpfCliente, setCpfCliente] = useState(proposta?.cpf_cliente ?? "")
  const [dataProposta, setDataProposta] = useState(
    proposta?.data_proposta ?? new Date().toISOString().split("T")[0]
  )

  // Step 2 state
  const [itens, setItens] = useState<PropostaItem[]>(proposta?.itens ?? [])

  // Step 3 state
  const [cenarioTipo, setCenarioTipo] = useState<CenarioTipo>(proposta?.cenario_tipo ?? "balanceado")
  const [valorEntrada, setValorEntrada] = useState(proposta?.valor_entrada ?? 0)
  const [numParcelas, setNumParcelas] = useState(proposta?.num_parcelas ?? 8)
  const [taxas, setTaxas] = useState<TaxasMDR>(loadTaxas)

  // Step 4 state
  const [descontoProtocoloTipo, setDescontoProtocoloTipo] = useState<"percentual" | "valor" | null>(
    proposta?.desconto_protocolo_percentual ? "percentual" : proposta?.desconto_protocolo_valor ? "valor" : null
  )
  const [descontoProtocoloValor, setDescontoProtocoloValor] = useState(
    proposta?.desconto_protocolo_percentual || proposta?.desconto_protocolo_valor || 0
  )
  const [observacoes, setObservacoes] = useState(proposta?.observacoes ?? "")
  const [status, setStatus] = useState<PropostaStatus>(proposta?.status ?? "em_negociacao")

  // Recalculate cenario when itens change
  useEffect(() => {
    if (itens.length === 0) return
    const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
    if (cenarioTipo !== "personalizado") {
      const config = CENARIOS[cenarioTipo]
      setValorEntrada((subtotal * config.entrada_pct) / 100)
      setNumParcelas(config.parcelas)
    }
  }, [itens, cenarioTipo])

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  function handleCenarioChange(tipo: CenarioTipo, entrada: number, parcelas: number) {
    setCenarioTipo(tipo)
    setValorEntrada(entrada)
    setNumParcelas(parcelas)
  }

  function handleTaxasChange(newTaxas: TaxasMDR) {
    setTaxas(newTaxas)
    saveTaxas(newTaxas)
  }

  function calcDescontoProtocolo(): number {
    const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
    if (!descontoProtocoloTipo || !descontoProtocoloValor) return 0
    if (descontoProtocoloTipo === "percentual") return (subtotal * descontoProtocoloValor) / 100
    return descontoProtocoloValor
  }

  async function handleSave() {
    try {
      setSaving(true)
      const supabase = getSupabase()

      const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)
      const descontoItens = itens.reduce((sum, item) => sum + (item.valor - item.valor_final), 0)
      const descontoProtocolo = calcDescontoProtocolo()
      const valorTotal = subtotal - descontoProtocolo

      // Recalc entrada based on valorTotal (not subtotal)
      let finalEntrada = valorEntrada
      let finalParcelas = numParcelas
      if (cenarioTipo !== "personalizado") {
        const config = CENARIOS[cenarioTipo]
        finalEntrada = (valorTotal * config.entrada_pct) / 100
        finalParcelas = config.parcelas
      }

      const payload = {
        paciente_id: pacienteId,
        nome_cliente: nomeCliente,
        cpf_cliente: cpfCliente,
        itens,
        valor_subtotal: subtotal,
        valor_desconto_itens: descontoItens,
        desconto_protocolo_percentual: descontoProtocoloTipo === "percentual" ? descontoProtocoloValor : 0,
        desconto_protocolo_valor: descontoProtocoloTipo === "valor" ? descontoProtocoloValor : 0,
        valor_desconto_protocolo: descontoProtocolo,
        valor_total: valorTotal,
        cenario_tipo: cenarioTipo,
        valor_entrada: finalEntrada,
        num_parcelas: finalParcelas,
        fluxo_caixa_imediato: finalEntrada,
        status,
        observacoes: observacoes || null,
        data_proposta: dataProposta,
      }

      if (proposta) {
        const { error } = await supabase.from("propostas").update(payload).eq("id", proposta.id)
        if (error) {
          console.error("[propostas] Erro ao atualizar:", error.message)
          return
        }
      } else {
        const { error } = await supabase.from("propostas").insert(payload)
        if (error) {
          console.error("[propostas] Erro ao criar:", error.message)
          return
        }
      }

      onSave()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setSaving(false)
    }
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return pacienteId !== null && nomeCliente.length > 0
      case 2:
        return itens.length > 0 && itens.every((i) => i.procedimentoNome && i.valor > 0)
      case 3:
        return cenarioTipo !== null
      default:
        return true
    }
  }

  const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                  step >= s.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.number}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s.number ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${step > s.number ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {step === 1 && (
          <StepCliente
            pacienteId={pacienteId}
            nomeCliente={nomeCliente}
            cpfCliente={cpfCliente}
            onSelect={(p) => {
              setPacienteId(p.id)
              setNomeCliente(p.nome)
              setCpfCliente(p.cpf)
            }}
            dataProposta={dataProposta}
            onDataChange={setDataProposta}
          />
        )}
        {step === 2 && (
          <StepProcedimentos itens={itens} onChange={setItens} />
        )}
        {step === 3 && (
          <StepCenarios
            valorTotal={subtotal}
            cenarioTipo={cenarioTipo}
            valorEntrada={valorEntrada}
            numParcelas={numParcelas}
            taxas={taxas}
            onCenarioChange={handleCenarioChange}
            onTaxasChange={handleTaxasChange}
          />
        )}
        {step === 4 && (
          <StepResumo
            nomeCliente={nomeCliente}
            cpfCliente={cpfCliente}
            itens={itens}
            cenarioTipo={cenarioTipo}
            valorEntrada={valorEntrada}
            numParcelas={numParcelas}
            taxas={taxas}
            descontoProtocoloTipo={descontoProtocoloTipo}
            descontoProtocoloValor={descontoProtocoloValor}
            observacoes={observacoes}
            status={status}
            onDescontoProtocoloChange={(tipo, valor) => {
              setDescontoProtocoloTipo(tipo)
              setDescontoProtocoloValor(valor)
            }}
            onObservacoesChange={setObservacoes}
            onStatusChange={setStatus}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="gap-2"
          >
            Proximo
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : proposta ? "Atualizar Proposta" : "Salvar Proposta"}
          </Button>
        )}
      </div>
    </div>
  )
}
