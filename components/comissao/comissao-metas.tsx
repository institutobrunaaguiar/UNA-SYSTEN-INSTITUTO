"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Settings2,
  Sparkles,
  Target,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  nome_cliente: string
  cpf_cliente: string
  valor_total: number
  validacao_status: "pendente" | "aprovada" | "reprovada"
  data_proposta: string
  validado_em: string | null
  itens: PropostaItem[]
}

interface PeriodoConfig {
  percentual_global: number
  filtro_status: string
  modalidade: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v)
}

function getPeriodMesAno(periodo: string): { mes: number; ano: number } {
  const [ano, mes] = periodo.split("-").map(Number)
  return { mes, ano }
}

function getPeriodRange(periodo: string) {
  const { mes, ano } = getPeriodMesAno(periodo)
  const lastDay = new Date(ano, mes, 0).getDate()
  return {
    start: `${periodo}-01`,
    end: `${periodo}-${String(lastDay).padStart(2, "0")}`,
  }
}

// ─── Card de proposta individual ──────────────────────────────────────────────

function PropostaRow({
  proposta,
  percentual,
  tipo,
}: {
  proposta: Proposta
  percentual: number
  tipo: "aprovada" | "pendente" | "reprovada"
}) {
  const comissao = proposta.valor_total * (percentual / 100)
  const profissionais = [...new Set(proposta.itens?.map((i) => i.profissionalNome).filter(Boolean))]

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        tipo === "aprovada"
          ? "bg-green-500/10"
          : tipo === "pendente"
          ? "bg-yellow-500/10"
          : "bg-destructive/10"
      }`}>
        {tipo === "aprovada" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
        {tipo === "pendente" && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
        {tipo === "reprovada" && <XCircle className="w-3.5 h-3.5 text-destructive" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{proposta.nome_cliente}</p>
        {profissionais.length > 0 && (
          <p className="text-[10px] text-muted-foreground truncate">
            {profissionais.join(", ")}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${tipo === "reprovada" ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {formatBRL(proposta.valor_total)}
        </p>
        {tipo !== "reprovada" && (
          <p className={`text-[10px] font-medium ${tipo === "aprovada" ? "text-green-600" : "text-yellow-600"}`}>
            +{formatBRL(comissao)}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Seção recolhível ─────────────────────────────────────────────────────────

function SecaoPropostas({
  titulo,
  propostas,
  percentual,
  tipo,
  totalValor,
  totalComissao,
  corBadge,
  icone: Icone,
}: {
  titulo: string
  propostas: Proposta[]
  percentual: number
  tipo: "aprovada" | "pendente" | "reprovada"
  totalValor: number
  totalComissao: number
  corBadge: string
  icone: typeof CheckCircle2
}) {
  const [expanded, setExpanded] = useState(tipo === "pendente")

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-muted/50 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${corBadge}`}>
          <Icone className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{titulo}</p>
          <p className="text-xs text-muted-foreground">
            {propostas.length} proposta{propostas.length !== 1 ? "s" : ""} · {formatBRL(totalValor)}
          </p>
        </div>
        <div className="text-right mr-2 shrink-0">
          <p className="text-base font-bold text-foreground">{formatBRL(totalComissao)}</p>
          <p className="text-[10px] text-muted-foreground">comissão</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        }
      </button>

      {expanded && propostas.length > 0 && (
        <div className="px-4 border-t border-border">
          {propostas.map((p) => (
            <PropostaRow key={p.id} proposta={p} percentual={percentual} tipo={tipo} />
          ))}
        </div>
      )}

      {expanded && propostas.length === 0 && (
        <div className="px-4 py-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">Nenhuma proposta neste status</p>
        </div>
      )}
    </Card>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ComissaoMetas() {
  const hoje = new Date()
  const defaultPeriodo = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`

  const [periodo, setPeriodo] = useState(defaultPeriodo)
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(false)
  const [periodoConfig, setPeriodoConfig] = useState<PeriodoConfig | null>(null)

  // Configurações ajustáveis
  const [percentual, setPercentual] = useState(0.6)
  const [valorMinimo, setValorMinimo] = useState(5000)
  const [showConfig, setShowConfig] = useState(false)

  const { mes, ano } = getPeriodMesAno(periodo)
  const mesLabel = `${MESES[mes - 1]} ${ano}`

  // Busca config do período e propostas
  const fetchData = useCallback(async () => {
    if (!periodo) return
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { start, end } = getPeriodRange(periodo)

      const [configRes, propostasRes] = await Promise.all([
        supabase
          .from("comissao_periodos")
          .select("percentual_global, filtro_status, modalidade")
          .eq("mes", mes)
          .eq("ano", ano)
          .maybeSingle(),
        supabase
          .from("propostas")
          .select("id, nome_cliente, cpf_cliente, valor_total, validacao_status, data_proposta, validado_em, itens")
          .gte("data_proposta", start)
          .lte("data_proposta", end)
          .order("data_proposta", { ascending: false }),
      ])

      if (configRes.data) {
        const cfg = configRes.data as PeriodoConfig
        setPeriodoConfig(cfg)
        // Usa o percentual configurado no período se modalidade for por_percentual_total
        if (cfg.modalidade === "por_percentual_total") {
          setPercentual(cfg.percentual_global)
        }
      } else {
        setPeriodoConfig(null)
      }

      setPropostas((propostasRes.data as Proposta[]) || [])
    } catch (e) {
      console.error("[comissao-metas]", e)
    } finally {
      setLoading(false)
    }
  }, [periodo, mes, ano])

  useEffect(() => { fetchData() }, [fetchData])

  // Filtra por valor mínimo e separa por status
  const propostasFiltradas = useMemo(() =>
    propostas.filter((p) => p.valor_total >= valorMinimo),
    [propostas, valorMinimo]
  )

  const aprovadas  = useMemo(() => propostasFiltradas.filter((p) => p.validacao_status === "aprovada"), [propostasFiltradas])
  const pendentes  = useMemo(() => propostasFiltradas.filter((p) => p.validacao_status === "pendente"), [propostasFiltradas])
  const reprovadas = useMemo(() => propostasFiltradas.filter((p) => p.validacao_status === "reprovada"), [propostasFiltradas])

  const totalAprovado  = useMemo(() => aprovadas.reduce((s, p) => s + p.valor_total, 0), [aprovadas])
  const totalPendente  = useMemo(() => pendentes.reduce((s, p) => s + p.valor_total, 0), [pendentes])
  const totalReprovado = useMemo(() => reprovadas.reduce((s, p) => s + p.valor_total, 0), [reprovadas])

  const comissaoAtual     = totalAprovado * (percentual / 100)
  const comissaoPotencial = totalPendente * (percentual / 100)
  const comissaoTotal     = comissaoAtual + comissaoPotencial
  const totalPropostas    = propostasFiltradas.length
  const progressPct       = totalPropostas > 0 ? (aprovadas.length / totalPropostas) * 100 : 0

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header: seletor de período + config */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Select
            value={periodo}
            onValueChange={setPeriodo}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
                return (
                  <SelectItem key={key} value={key}>
                    {MESES[d.getMonth()]} {d.getFullYear()}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowConfig((v) => !v)}
        >
          <Settings2 className="w-4 h-4" />
          {showConfig ? "Fechar" : "Ajustar Regra"}
        </Button>
      </div>

      {/* Painel de configuração da regra */}
      {showConfig && (
        <Card className="p-4 space-y-4 border-primary/30 bg-primary/5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Regra de Comissão — {mesLabel}
            </p>
            {periodoConfig && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                Configuração salva no período
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Percentual de comissão (%)</Label>
              <Input
                type="number"
                min="0.01"
                max="100"
                step="0.1"
                value={percentual}
                onChange={(e) => setPercentual(parseFloat(e.target.value) || 0)}
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Ex: 0.6 = 0,6% sobre o valor das propostas
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor mínimo da proposta (R$)</Label>
              <Input
                type="number"
                min="0"
                step="500"
                value={valorMinimo}
                onChange={(e) => setValorMinimo(parseFloat(e.target.value) || 0)}
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Só conta propostas acima deste valor
              </p>
            </div>
          </div>

          {/* Preview da regra */}
          <div className="rounded-lg bg-card border border-border px-3 py-2.5 text-xs text-muted-foreground">
            Regra ativa: <strong className="text-foreground">{percentual}%</strong> sobre propostas aprovadas acima de{" "}
            <strong className="text-foreground">{formatBRL(valorMinimo)}</strong>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!loading && (
        <>
          {/* Projeção principal */}
          <Card className="overflow-hidden">
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Projeção de Comissão — {mesLabel}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Propostas acima de {formatBRL(valorMinimo)} · {percentual}% de comissão
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">Potencial total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{formatBRL(comissaoTotal)}</p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {aprovadas.length} de {totalPropostas} propostas aprovadas
                  </span>
                  <span className="font-semibold text-foreground">{progressPct.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* 3 métricas */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="rounded-xl bg-green-500/8 border border-green-500/20 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-0.5">Confirmado</p>
                  <p className="text-base font-bold text-foreground">{formatBRL(comissaoAtual)}</p>
                  <p className="text-[10px] text-muted-foreground">{aprovadas.length} aprovadas</p>
                </div>
                <div className="rounded-xl bg-yellow-500/8 border border-yellow-500/20 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wide mb-0.5">Potencial</p>
                  <p className="text-base font-bold text-foreground">{formatBRL(comissaoPotencial)}</p>
                  <p className="text-[10px] text-muted-foreground">{pendentes.length} pendentes</p>
                </div>
                <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-0.5">Perdido</p>
                  <p className="text-base font-bold text-muted-foreground">{formatBRL(totalReprovado * percentual / 100)}</p>
                  <p className="text-[10px] text-muted-foreground">{reprovadas.length} reprovadas</p>
                </div>
              </div>
            </div>

            {/* Banner de incentivo */}
            {pendentes.length > 0 && (
              <div className="bg-primary/5 border-t border-primary/20 px-4 sm:px-5 py-3">
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">
                    Se as <strong>{pendentes.length} proposta{pendentes.length !== 1 ? "s" : ""} pendente{pendentes.length !== 1 ? "s" : ""}</strong> ({formatBRL(totalPendente)}) forem aprovadas,
                    sua comissão sobe de{" "}
                    <strong className="text-green-600">{formatBRL(comissaoAtual)}</strong> para{" "}
                    <strong className="text-primary">{formatBRL(comissaoTotal)}</strong>
                    {comissaoPotencial > 0 && (
                      <> (+{formatBRL(comissaoPotencial)})</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Sem propostas */}
          {totalPropostas === 0 && !loading && (
            <Card className="p-10 flex flex-col items-center text-center">
              <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma proposta acima de {formatBRL(valorMinimo)} em {mesLabel}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Ajuste o valor mínimo ou selecione outro período.
              </p>
            </Card>
          )}

          {/* Seções de propostas */}
          {totalPropostas > 0 && (
            <div className="space-y-3">
              <SecaoPropostas
                titulo="Aprovadas"
                propostas={aprovadas}
                percentual={percentual}
                tipo="aprovada"
                totalValor={totalAprovado}
                totalComissao={comissaoAtual}
                corBadge="bg-green-500/10 text-green-500"
                icone={CheckCircle2}
              />
              <SecaoPropostas
                titulo="Pendentes (potencial)"
                propostas={pendentes}
                percentual={percentual}
                tipo="pendente"
                totalValor={totalPendente}
                totalComissao={comissaoPotencial}
                corBadge="bg-yellow-500/10 text-yellow-500"
                icone={Clock}
              />
              {reprovadas.length > 0 && (
                <SecaoPropostas
                  titulo="Reprovadas"
                  propostas={reprovadas}
                  percentual={percentual}
                  tipo="reprovada"
                  totalValor={totalReprovado}
                  totalComissao={0}
                  corBadge="bg-destructive/10 text-destructive"
                  icone={XCircle}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
