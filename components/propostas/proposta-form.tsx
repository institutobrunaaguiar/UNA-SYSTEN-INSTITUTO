"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react"
import { getSupabase } from "@/lib/supabase/client"
import { StepCliente } from "./steps/step-cliente"
import { StepProcedimentos } from "./steps/step-procedimentos"
import { StepCenarios } from "./steps/step-cenarios"
import { StepResumo } from "./steps/step-resumo"
import type { Proposta, PropostaItem, CenarioTipo, TaxasMDR, PropostaStatus, CashbackCampanha } from "./types"
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

  // Cashback state
  const [cashbackCampanhas, setCashbackCampanhas] = useState<CashbackCampanha[]>([])
  const [pacienteSaldo, setPacienteSaldo] = useState(0)
  const [cashbackCampanhaId, setCashbackCampanhaId] = useState<number | null>(proposta?.cashback_campanha_id ?? null)
  const [cashbackUtilizado, setCashbackUtilizado] = useState(proposta?.cashback_utilizado ?? 0)
  const [profissionaisRestritos, setProfissionaisRestritos] = useState<Set<number>>(new Set())

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

  // Fetch active cashback campaigns + profissionais restritos
  useEffect(() => {
    async function fetchCampanhasERestritos() {
      try {
        const supabase = getSupabase()
        const today = new Date().toISOString().split("T")[0]

        const [universaisRes, restritosRes] = await Promise.all([
          supabase
            .from("cashback_campanhas")
            .select("id, nome, percentual")
            .eq("ativa", true)
            .eq("exclusivo", false)
            .lte("data_inicio", today)
            .gte("data_fim", today),
          supabase
            .from("profissionais")
            .select("id")
            .eq("cashback_restrito", true),
        ])

        const universais = universaisRes.data ?? []

        let exclusivas: { id: number; nome: string; percentual: number }[] = []
        if (pacienteId) {
          const { data: vinculos } = await supabase
            .from("cashback_campanha_clientes")
            .select("campanha_id")
            .eq("paciente_id", pacienteId)

          const campanhaIds = (vinculos ?? []).map((v) => v.campanha_id)

          if (campanhaIds.length > 0) {
            const { data: excl } = await supabase
              .from("cashback_campanhas")
              .select("id, nome, percentual")
              .eq("ativa", true)
              .eq("exclusivo", true)
              .lte("data_inicio", today)
              .gte("data_fim", today)
              .in("id", campanhaIds)

            exclusivas = excl ?? []
          }
        }

        setCashbackCampanhas([...universais, ...exclusivas])

        if (restritosRes.data) {
          setProfissionaisRestritos(new Set(restritosRes.data.map((p) => p.id)))
        }
      } catch (e) {
        console.error("[propostas] Erro ao buscar campanhas:", e)
      }
    }
    fetchCampanhasERestritos()
  }, [pacienteId])

  // Fetch patient cashback balance considering professional restrictions
  useEffect(() => {
    if (!pacienteId) { setPacienteSaldo(0); return }
    async function fetchSaldo() {
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from("cashback_transacoes")
          .select("tipo, valor, profissional_origem_id")
          .eq("paciente_id", pacienteId)
        if (error) {
          console.error("[propostas] Erro ao buscar saldo cashback:", error.message)
          return
        }
        if (data) {
          // Profissionais da proposta atual
          const profIdsNaProposta = new Set(
            itens.map((i) => i.profissionalId).filter((id): id is number => id !== null)
          )

          // Calcular saldo disponivel aplicando regra de restricao:
          // Se o profissional_origem eh restrito E esta na proposta atual, esse cashback NAO esta disponivel
          let gerado = 0
          let utilizado = 0
          for (const t of data) {
            if (t.tipo === "gerado" || t.tipo === "transferencia_recebida") {
              const origemId = t.profissional_origem_id
              const bloqueado = origemId
                && profissionaisRestritos.has(origemId)
                && profIdsNaProposta.has(origemId)
              if (!bloqueado) gerado += t.valor
            } else {
              utilizado += t.valor
            }
          }
          setPacienteSaldo(Math.max(0, gerado - utilizado))
        }
      } catch (e) {
        console.error("[propostas] Erro ao buscar saldo cashback:", e)
      }
    }
    fetchSaldo()
  }, [pacienteId, itens, profissionaisRestritos])

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
      const valorTotalFinal = valorTotal - (cashbackUtilizado || 0)

      // Recalc entrada based on valorTotalFinal (not subtotal)
      let finalEntrada = valorEntrada
      let finalParcelas = numParcelas
      if (cenarioTipo !== "personalizado") {
        const config = CENARIOS[cenarioTipo]
        finalEntrada = (valorTotalFinal * config.entrada_pct) / 100
        finalParcelas = config.parcelas
      }

      const campanhaSelecionada = cashbackCampanhas.find((c) => c.id === cashbackCampanhaId)
      const cashbackGerado = campanhaSelecionada
        ? (valorTotal * campanhaSelecionada.percentual) / 100
        : 0

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
        valor_total: valorTotalFinal,
        cenario_tipo: cenarioTipo,
        valor_entrada: finalEntrada,
        num_parcelas: finalParcelas,
        fluxo_caixa_imediato: finalEntrada,
        status,
        observacoes: observacoes || null,
        data_proposta: dataProposta,
        cashback_campanha_id: cashbackCampanhaId || null,
        cashback_gerado: cashbackGerado || null,
        cashback_utilizado: cashbackUtilizado || null,
      }

      let propostaId: number

      if (proposta) {
        propostaId = proposta.id
        const { error } = await supabase.from("propostas").update(payload).eq("id", propostaId)
        if (error) {
          console.error("[propostas] Erro ao atualizar:", error.message)
          return
        }
        // Remove transações anteriores para evitar duplicatas
        await supabase.from("cashback_transacoes").delete().eq("proposta_id", propostaId)
      } else {
        const { data: propostaData, error } = await supabase
          .from("propostas")
          .insert(payload)
          .select("id")
          .single()
        if (error) {
          console.error("[propostas] Erro ao criar:", error.message)
          return
        }
        propostaId = propostaData.id
      }

      // Inserir transações de cashback — split por profissional para rastreio de origem
      if (cashbackGerado > 0 && pacienteId && campanhaSelecionada) {
        // Agrupar valor dos itens por profissional
        const profValores = new Map<number | null, number>()
        for (const item of itens) {
          const key = item.profissionalId
          profValores.set(key, (profValores.get(key) || 0) + item.valor_final)
        }
        // Split proporcional do cashback
        for (const [profId, valorProf] of profValores) {
          const proporcao = valorProf / subtotal
          const valorCashback = Math.round(cashbackGerado * proporcao * 100) / 100
          if (valorCashback <= 0) continue
          const { error: errGerado } = await supabase.from("cashback_transacoes").insert({
            paciente_id: pacienteId,
            proposta_id: propostaId,
            tipo: "gerado",
            valor: valorCashback,
            campanha_id: cashbackCampanhaId,
            profissional_origem_id: profId,
          })
          if (errGerado) console.error("[propostas] Erro ao registrar cashback gerado:", errGerado.message)
        }
      }
      if (cashbackUtilizado > 0 && pacienteId) {
        const { error: errUtilizado } = await supabase.from("cashback_transacoes").insert({
          paciente_id: pacienteId,
          proposta_id: propostaId,
          tipo: "utilizado",
          valor: cashbackUtilizado,
          campanha_id: null,
        })
        if (errUtilizado) console.error("[propostas] Erro ao registrar cashback utilizado:", errUtilizado.message)
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Stepper */}
      <div className="flex items-center gap-0.5 sm:gap-2">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                  step >= s.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.number}
              </div>
              <span className={`text-[10px] sm:text-sm ${step >= s.number ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`hidden sm:block h-0.5 flex-1 mx-2 ${step > s.number ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-3 sm:p-4 lg:p-6">
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
            cashbackCampanhas={cashbackCampanhas}
            pacienteSaldo={pacienteSaldo}
            cashbackCampanhaId={cashbackCampanhaId}
            cashbackUtilizado={cashbackUtilizado}
            onCashbackCampanhaChange={setCashbackCampanhaId}
            onCashbackUtilizadoChange={setCashbackUtilizado}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="gap-2 flex-1 sm:flex-none"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="gap-2 flex-1 sm:flex-none"
          >
            Proximo
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 flex-1 sm:flex-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : proposta ? "Atualizar" : "Salvar"}
          </Button>
        )}
      </div>
    </div>
  )
}
