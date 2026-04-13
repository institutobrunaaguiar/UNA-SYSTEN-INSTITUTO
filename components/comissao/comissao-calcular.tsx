"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  Calculator,
  Loader2,
  AlertCircle,
  Save,
  Info,
  Percent,
  BookOpen,
  ChevronRight,
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Tipos ───────────────────────────────────────────────────────────────────

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
  status: string
  validacao_status: string | null
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

interface ComissaoPeriodoConfig {
  id: string
  mes: number
  ano: number
  modalidade: "por_regra" | "por_percentual_total"
  percentual_global: number
  filtro_status: "pago" | "aprovada"
  descricao: string | null
}

interface PreviewItem {
  proposta_id: number | null
  profissional_id: number | null
  profissional_nome: string
  procedimento_nome: string
  valor_base: number
  percentual: number
  valor_comissao: number
  regra_id: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function getPeriodRange(periodo: string) {
  const [year, month] = periodo.split("-").map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${periodo}-01T00:00:00`,
    end: `${periodo}-${String(lastDay).padStart(2, "0")}T23:59:59`,
    mes: month,
    ano: year,
  }
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

// ─── Cálculo por Regras (modo padrão) ────────────────────────────────────────

async function calcularPorRegras(
  supabase: ReturnType<typeof getSupabase>,
  periodo: string
): Promise<{ items: PreviewItem[]; aviso?: string }> {
  const { start, end } = getPeriodRange(periodo)

  const { data: propostas, error: propostasError } = await supabase
    .from("propostas")
    .select("*")
    .eq("status", "pago")
    .gte("created_at", start)
    .lte("created_at", end)

  if (propostasError) throw new Error("Erro ao buscar propostas: " + propostasError.message)
  if (!propostas || propostas.length === 0) {
    return { items: [], aviso: "Nenhuma proposta com status 'pago' encontrada neste período." }
  }

  const { data: regras, error: regrasError } = await supabase
    .from("comissao_regras")
    .select("*")
    .eq("ativo", true)

  if (regrasError) throw new Error("Erro ao buscar regras: " + regrasError.message)
  if (!regras || regras.length === 0) {
    return {
      items: [],
      aviso: "Nenhuma regra de comissão ativa. Cadastre regras na aba 'Regras'.",
    }
  }

  const typedRegras = regras as ComissaoRegra[]
  const typedPropostas = propostas as Proposta[]
  const items: PreviewItem[] = []

  for (const proposta of typedPropostas) {
    if (!proposta.itens || !Array.isArray(proposta.itens)) continue

    for (const item of proposta.itens) {
      let matched: ComissaoRegra | undefined

      // 1. Por nome do procedimento
      matched = typedRegras.find(
        (r) =>
          r.tipo === "procedimento" &&
          r.procedimento_nome &&
          r.procedimento_nome.toLowerCase() === item.procedimentoNome.toLowerCase()
      )

      // 2. Por profissional
      if (!matched && item.profissionalId) {
        matched = typedRegras.find(
          (r) => r.tipo === "profissional" && r.profissional_id === item.profissionalId
        )
      }

      // 3. Fallback: regra de meta (global)
      if (!matched) {
        matched = typedRegras.find((r) => r.tipo === "meta")
      }

      if (matched) {
        const valorBase = item.valor_final || item.valor
        items.push({
          proposta_id: proposta.id,
          profissional_id: item.profissionalId,
          profissional_nome: item.profissionalNome || "N/A",
          procedimento_nome: item.procedimentoNome,
          valor_base: valorBase,
          percentual: matched.percentual,
          valor_comissao: (valorBase * matched.percentual) / 100,
          regra_id: matched.id,
        })
      }
    }
  }

  if (items.length === 0) {
    return {
      items: [],
      aviso: "Nenhuma regra corresponde aos procedimentos das propostas deste período.",
    }
  }

  return { items }
}

// ─── Cálculo por Percentual Total (novo modo) ─────────────────────────────────

async function calcularPorPercentualTotal(
  supabase: ReturnType<typeof getSupabase>,
  periodo: string,
  config: ComissaoPeriodoConfig
): Promise<{ items: PreviewItem[]; aviso?: string; totalBase: number }> {
  const { start, end } = getPeriodRange(periodo)

  let query = supabase
    .from("propostas")
    .select("*")
    .gte("created_at", start)
    .lte("created_at", end)

  if (config.filtro_status === "aprovada") {
    query = query.eq("validacao_status", "aprovada")
  } else {
    query = query.eq("status", "pago")
  }

  const { data: propostas, error } = await query

  if (error) throw new Error("Erro ao buscar propostas: " + error.message)

  if (!propostas || propostas.length === 0) {
    const label = config.filtro_status === "aprovada" ? "aprovadas" : "pagas"
    return {
      items: [],
      aviso: `Nenhuma proposta ${label} encontrada neste período.`,
      totalBase: 0,
    }
  }

  const typedPropostas = propostas as Proposta[]

  // Agrupa por profissional somando os valores finais de cada item
  const porProfissional = new Map<
    string,
    { profissional_id: number | null; profissional_nome: string; valor_total: number }
  >()

  for (const proposta of typedPropostas) {
    if (!proposta.itens || !Array.isArray(proposta.itens)) {
      // Se não tem itens, usa o valor_total da proposta com profissional genérico
      const key = "Sem Profissional"
      if (!porProfissional.has(key)) {
        porProfissional.set(key, { profissional_id: null, profissional_nome: key, valor_total: 0 })
      }
      porProfissional.get(key)!.valor_total += proposta.valor_total
      continue
    }

    for (const item of proposta.itens) {
      const key = item.profissionalNome || "Sem Profissional"
      if (!porProfissional.has(key)) {
        porProfissional.set(key, {
          profissional_id: item.profissionalId ?? null,
          profissional_nome: key,
          valor_total: 0,
        })
      }
      porProfissional.get(key)!.valor_total += item.valor_final || item.valor
    }
  }

  const totalBase = Array.from(porProfissional.values()).reduce(
    (s, v) => s + v.valor_total,
    0
  )

  const filtroLabel =
    config.filtro_status === "aprovada" ? "Total Aprovado (validação)" : "Total Pago"

  const items: PreviewItem[] = Array.from(porProfissional.entries()).map(([, data]) => ({
    proposta_id: null,
    profissional_id: data.profissional_id,
    profissional_nome: data.profissional_nome,
    procedimento_nome: filtroLabel,
    valor_base: data.valor_total,
    percentual: config.percentual_global,
    valor_comissao: (data.valor_total * config.percentual_global) / 100,
    regra_id: null,
  }))

  return { items, totalBase }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ComissaoCalcular({ open, onOpenChange, onComplete }: ComissaoCalcularProps) {
  const [periodo, setPeriodo] = useState("")
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PreviewItem[]>([])
  const [aviso, setAviso] = useState("")
  const [step, setStep] = useState<"select" | "preview">("select")
  const [periodoConfig, setPeriodoConfig] = useState<ComissaoPeriodoConfig | null>(null)
  const [totalBase, setTotalBase] = useState(0)

  // Permite override manual da modalidade no dialog
  const [modalidadeOverride, setModalidadeOverride] = useState<
    "auto" | "por_regra" | "por_percentual_total"
  >("auto")
  const [percentualOverride, setPercentualOverride] = useState<number>(0.6)
  const [filtroOverride, setFiltroOverride] = useState<"pago" | "aprovada">("aprovada")

  function resetState() {
    setPeriodo("")
    setCalculating(false)
    setSaving(false)
    setPreview([])
    setAviso("")
    setStep("select")
    setPeriodoConfig(null)
    setTotalBase(0)
    setModalidadeOverride("auto")
    setPercentualOverride(0.6)
    setFiltroOverride("aprovada")
  }

  function handleOpenChange(value: boolean) {
    if (!value) resetState()
    onOpenChange(value)
  }

  // Resolve a configuração efetiva para o cálculo
  function getConfigEfetiva(): Omit<ComissaoPeriodoConfig, "id" | "descricao"> {
    const [year, month] = periodo.split("-").map(Number)

    if (modalidadeOverride === "auto" && periodoConfig) {
      return periodoConfig
    }

    const modalidade =
      modalidadeOverride === "auto"
        ? "por_regra" // sem config de período: usa regras
        : modalidadeOverride

    return {
      mes: month,
      ano: year,
      modalidade,
      percentual_global:
        modalidade === "por_percentual_total"
          ? (modalidadeOverride === "auto" && periodoConfig
              ? periodoConfig.percentual_global
              : percentualOverride)
          : percentualOverride,
      filtro_status:
        modalidade === "por_percentual_total"
          ? (modalidadeOverride === "auto" && periodoConfig
              ? periodoConfig.filtro_status
              : filtroOverride)
          : filtroOverride,
    }
  }

  async function handleCalcular() {
    if (!periodo) {
      toast.error("Selecione o período de referência")
      return
    }

    try {
      setCalculating(true)
      setAviso("")
      setPreview([])

      const supabase = getSupabase()
      const { mes, ano } = getPeriodRange(periodo)

      // Busca configuração do período (se houver)
      const { data: configData } = await supabase
        .from("comissao_periodos")
        .select("*")
        .eq("mes", mes)
        .eq("ano", ano)
        .maybeSingle()

      setPeriodoConfig(configData as ComissaoPeriodoConfig | null)

      const config = configData
        ? (configData as ComissaoPeriodoConfig)
        : { mes, ano, modalidade: "por_regra" as const, percentual_global: 0.6, filtro_status: "aprovada" as const }

      // Resolve modalidade efetiva
      const modalidadeEfetiva =
        modalidadeOverride === "auto" ? config.modalidade : modalidadeOverride

      let result: { items: PreviewItem[]; aviso?: string; totalBase?: number }

      if (modalidadeEfetiva === "por_percentual_total") {
        const configEfetiva = {
          ...config,
          modalidade: "por_percentual_total" as const,
          percentual_global: modalidadeOverride === "auto" ? config.percentual_global : percentualOverride,
          filtro_status: modalidadeOverride === "auto" ? config.filtro_status : filtroOverride,
        }
        result = await calcularPorPercentualTotal(supabase, periodo, configEfetiva as ComissaoPeriodoConfig)
        setTotalBase(result.totalBase ?? 0)
      } else {
        result = await calcularPorRegras(supabase, periodo)
        setTotalBase(0)
      }

      if (result.aviso) setAviso(result.aviso)
      setPreview(result.items)
      setStep("preview")
    } catch (error) {
      console.error("[calcular] Erro:", error)
      toast.error("Erro ao calcular comissões")
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
        toast.error("Erro ao salvar comissões")
        return
      }

      toast.success(`${records.length} comissão(ões) gerada(s) com sucesso`)
      handleOpenChange(false)
      onComplete()
    } catch (error) {
      console.error("[calcular] Erro:", error)
      toast.error("Erro ao salvar comissões")
    } finally {
      setSaving(false)
    }
  }

  const totalComissao = preview.reduce((sum, item) => sum + item.valor_comissao, 0)
  const configEfetiva = periodo ? getConfigEfetiva() : null
  const modalidadeAtiva = configEfetiva?.modalidade ?? "por_regra"
  const [periodoAno, periodoMes] = periodo ? periodo.split("-").map(Number) : [0, 0]
  const periodoLabel = periodoMes
    ? `${MESES[periodoMes - 1]} ${periodoAno}`
    : ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Calcular Comissões
          </DialogTitle>
          <DialogDescription>
            Selecione o período para calcular as comissões. A modalidade de cálculo é definida na aba "Períodos".
          </DialogDescription>
        </DialogHeader>

        {/* ── Passo 1: Selecionar período ── */}
        {step === "select" && (
          <div className="space-y-5 py-2">
            {/* Período */}
            <div className="space-y-2">
              <Label htmlFor="periodo">Período de Referência</Label>
              <Input
                id="periodo"
                type="month"
                value={periodo}
                onChange={(e) => {
                  setPeriodo(e.target.value)
                  setPeriodoConfig(null)
                }}
                className="w-full sm:max-w-[220px]"
              />
            </div>

            {/* Override de modalidade */}
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Modalidade de Cálculo
                </p>
              </div>

              <Select
                value={modalidadeOverride}
                onValueChange={(v) => setModalidadeOverride(v as typeof modalidadeOverride)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Automático (usa configuração do período)
                  </SelectItem>
                  <SelectItem value="por_regra">
                    Por Regras (forçar)
                  </SelectItem>
                  <SelectItem value="por_percentual_total">
                    Por Percentual Total (forçar)
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Campos extras para percentual total (quando override manual) */}
              {modalidadeOverride === "por_percentual_total" && (
                <div className="space-y-3 animate-fade-in pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Percentual (%)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0.01"
                          max="100"
                          step="0.1"
                          value={percentualOverride}
                          onChange={(e) => setPercentualOverride(parseFloat(e.target.value) || 0)}
                          className="pr-8 h-9 text-sm"
                        />
                        <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Base de cálculo</Label>
                      <Select
                        value={filtroOverride}
                        onValueChange={(v) => setFiltroOverride(v as typeof filtroOverride)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aprovada">Aprovadas</SelectItem>
                          <SelectItem value="pago">Pagas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Indicador do modo automático */}
              {modalidadeOverride === "auto" && (
                <p className="text-xs text-muted-foreground">
                  {periodoConfig
                    ? periodoConfig.modalidade === "por_percentual_total"
                      ? `Período configurado: ${periodoConfig.percentual_global}% sobre propostas ${periodoConfig.filtro_status === "aprovada" ? "aprovadas" : "pagas"}`
                      : "Período configurado: Por Regras"
                    : "Sem configuração para este período → usará as Regras cadastradas."}
                </p>
              )}

              {/* Badge de modalidade */}
              <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                (modalidadeOverride === "por_percentual_total" ||
                  (modalidadeOverride === "auto" && periodoConfig?.modalidade === "por_percentual_total"))
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
              }`}>
                {(modalidadeOverride === "por_percentual_total" ||
                  (modalidadeOverride === "auto" && periodoConfig?.modalidade === "por_percentual_total"))
                  ? <><Percent className="w-3 h-3" /> Por Percentual Total</>
                  : <><BookOpen className="w-3 h-3" /> Por Regras</>
                }
              </div>
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
                    <ChevronRight className="w-4 h-4" />
                    Calcular
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Passo 2: Aviso (sem resultados) ── */}
        {step === "preview" && aviso && preview.length === 0 && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-500">Atenção</p>
                <p className="text-sm text-muted-foreground mt-1">{aviso}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>Voltar</Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Passo 2: Preview dos resultados ── */}
        {step === "preview" && preview.length > 0 && (
          <div className="space-y-4 py-2 animate-fade-in">

            {/* Header de contexto */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              modalidadeAtiva === "por_percentual_total"
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-blue-500/5 border-blue-500/20"
            }`}>
              {modalidadeAtiva === "por_percentual_total"
                ? <Percent className="w-4 h-4 text-amber-500 shrink-0" />
                : <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {modalidadeAtiva === "por_percentual_total"
                    ? `Cálculo por Percentual Total — ${configEfetiva?.percentual_global}%`
                    : "Cálculo por Regras"}
                </p>
                {modalidadeAtiva === "por_percentual_total" && totalBase > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Base: {formatCurrency(totalBase)} · {formatCurrency(totalBase)} × {configEfetiva?.percentual_global}% = {formatCurrency(totalComissao)}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{periodoLabel}</span>
            </div>

            {aviso && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {aviso}
              </div>
            )}

            {/* Tabela de preview */}
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="hidden sm:table-cell">Base</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Valor Base</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-foreground">
                        {item.profissional_nome}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {item.procedimento_nome}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-muted-foreground">
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

            {/* Resumo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                {preview.length} profissional(is) · {periodoLabel}
              </p>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Total de comissões</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalComissao)}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>Voltar</Button>
              <Button onClick={handleSalvar} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Comissões
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
