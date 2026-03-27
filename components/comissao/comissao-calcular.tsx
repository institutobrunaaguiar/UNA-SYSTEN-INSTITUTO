"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { Calculator, Loader2, AlertCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ComissaoCalcularProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

interface PropostaItem {
  procedimentoId: string
  procedimentoNome: string
  profissionalId: number | null
  profissionalNome: string
  valor: number
  valor_final: number
}

interface Proposta {
  id: number
  paciente_id: number
  nome_cliente: string
  itens: PropostaItem[]
  valor_total: number
  status: "em_negociacao" | "aguardando_pagamento" | "pago" | "recusada"
  created_at: string
}

interface ComissaoRegra {
  id: number
  nome: string
  tipo: "procedimento" | "profissional" | "meta"
  procedimento_nome: string | null
  profissional_id: number | null
  percentual: number
  meta_minima: number | null
  meta_maxima: number | null
  bonus_percentual: number | null
  ativo: boolean
}

interface PreviewItem {
  proposta_id: number
  profissional_id: number | null
  profissional_nome: string
  procedimento_nome: string
  valor_base: number
  percentual: number
  valor_comissao: number
  regra_id: number
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function ComissaoCalcular({ open, onOpenChange, onComplete }: ComissaoCalcularProps) {
  const [periodo, setPeriodo] = useState("")
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PreviewItem[]>([])
  const [noRulesMessage, setNoRulesMessage] = useState("")
  const [step, setStep] = useState<"select" | "preview">("select")

  function resetState() {
    setPeriodo("")
    setCalculating(false)
    setSaving(false)
    setPreview([])
    setNoRulesMessage("")
    setStep("select")
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      resetState()
    }
    onOpenChange(value)
  }

  async function handleCalcular() {
    if (!periodo) {
      toast.error("Selecione o periodo de referencia")
      return
    }

    try {
      setCalculating(true)
      setNoRulesMessage("")
      setPreview([])

      const supabase = getSupabase()

      // Fetch paid propostas in the period
      const periodoStart = `${periodo}-01`
      const [year, month] = periodo.split("-").map(Number)
      const lastDay = new Date(year, month, 0).getDate()
      const periodoEnd = `${periodo}-${String(lastDay).padStart(2, "0")}`

      const { data: propostas, error: propostasError } = await supabase
        .from("propostas")
        .select("*")
        .eq("status", "pago")
        .gte("created_at", `${periodoStart}T00:00:00`)
        .lte("created_at", `${periodoEnd}T23:59:59`)

      if (propostasError) {
        console.error("[calcular] Erro ao buscar propostas:", propostasError.message)
        toast.error("Erro ao buscar propostas do periodo")
        return
      }

      if (!propostas || propostas.length === 0) {
        toast.error("Nenhuma proposta paga encontrada neste periodo")
        return
      }

      // Fetch active rules
      const { data: regras, error: regrasError } = await supabase
        .from("comissao_regras")
        .select("*")
        .eq("ativo", true)

      if (regrasError) {
        console.error("[calcular] Erro ao buscar regras:", regrasError.message)
        toast.error("Erro ao buscar regras de comissao")
        return
      }

      if (!regras || regras.length === 0) {
        setNoRulesMessage(
          "Nenhuma regra de comissao configurada. Cadastre regras na aba 'Regras' antes de calcular."
        )
        setStep("preview")
        return
      }

      const typedRegras = regras as ComissaoRegra[]
      const typedPropostas = propostas as Proposta[]

      // Calculate commissions
      const items: PreviewItem[] = []

      for (const proposta of typedPropostas) {
        if (!proposta.itens || !Array.isArray(proposta.itens)) continue

        for (const item of proposta.itens) {
          // Find matching rule: first try by procedimento_nome, then by profissional
          let matchedRule: ComissaoRegra | undefined

          // Match by procedimento name (case-insensitive)
          matchedRule = typedRegras.find(
            (r) =>
              r.tipo === "procedimento" &&
              r.procedimento_nome &&
              r.procedimento_nome.toLowerCase() === item.procedimentoNome.toLowerCase()
          )

          // If no procedimento match, try by profissional
          if (!matchedRule && item.profissionalId) {
            matchedRule = typedRegras.find(
              (r) =>
                r.tipo === "profissional" && r.profissional_id === item.profissionalId
            )
          }

          // If still no match, try meta-type rules (general fallback)
          if (!matchedRule) {
            matchedRule = typedRegras.find((r) => r.tipo === "meta")
          }

          if (matchedRule) {
            const valorBase = item.valor_final || item.valor
            const valorComissao = (valorBase * matchedRule.percentual) / 100

            items.push({
              proposta_id: proposta.id,
              profissional_id: item.profissionalId,
              profissional_nome: item.profissionalNome || "N/A",
              procedimento_nome: item.procedimentoNome,
              valor_base: valorBase,
              percentual: matchedRule.percentual,
              valor_comissao: valorComissao,
              regra_id: matchedRule.id,
            })
          }
        }
      }

      if (items.length === 0) {
        setNoRulesMessage(
          "Nenhuma regra de comissao configurada para os procedimentos encontrados."
        )
        setStep("preview")
        return
      }

      setPreview(items)
      setStep("preview")
    } catch (error) {
      console.error("[calcular] Erro:", error)
      toast.error("Erro ao calcular comissoes")
    } finally {
      setCalculating(false)
    }
  }

  async function handleSalvar() {
    if (preview.length === 0) return

    try {
      setSaving(true)
      const supabase = getSupabase()

      const records = preview.map((item) => ({
        proposta_id: item.proposta_id,
        profissional_id: item.profissional_id,
        profissional_nome: item.profissional_nome,
        procedimento_nome: item.procedimento_nome,
        valor_base: item.valor_base,
        percentual: item.percentual,
        valor_comissao: item.valor_comissao,
        regra_id: item.regra_id,
        status: "pendente",
        periodo_referencia: periodo,
        observacoes: null,
      }))

      const { error } = await supabase.from("comissoes").insert(records)

      if (error) {
        console.error("[calcular] Erro ao salvar:", error.message)
        toast.error("Erro ao salvar comissoes")
        return
      }

      toast.success(`${records.length} comissao(oes) gerada(s) com sucesso`)
      handleOpenChange(false)
      onComplete()
    } catch (error) {
      console.error("[calcular] Erro:", error)
      toast.error("Erro ao salvar comissoes")
    } finally {
      setSaving(false)
    }
  }

  const totalComissao = preview.reduce((sum, item) => sum + item.valor_comissao, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Calcular Comissoes
          </DialogTitle>
          <DialogDescription>
            Selecione o periodo para calcular as comissoes com base nas propostas pagas.
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="periodo">Periodo de Referencia</Label>
              <Input
                id="periodo"
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Serao consideradas todas as propostas com status "pago" dentro deste mes.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCalcular}
                disabled={calculating || !periodo}
                className="gap-2"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Calcular
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && noRulesMessage && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-500">Atenção</p>
                <p className="text-sm text-muted-foreground mt-1">{noRulesMessage}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>
                Voltar
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && preview.length > 0 && (
          <div className="space-y-4 py-2 animate-fade-in">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-right">Valor Base</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Comissao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-foreground">
                        {item.profissional_nome}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.procedimento_nome}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(item.valor_base)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.percentual}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(item.valor_comissao)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div>
                <p className="text-xs text-muted-foreground">
                  {preview.length} comissao(oes) calculada(s) para {periodo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totalComissao)}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>
                Voltar
              </Button>
              <Button onClick={handleSalvar} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Comissoes
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
