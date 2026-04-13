"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
  RotateCcw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@supabase/supabase-js"
import type { Proposta, PropostaStatus } from "./types"
import { STATUS_CONFIG, VALIDACAO_CONFIG } from "./types"
import { useUser } from "@/context/user-context"
import { ValidacaoReprovarDialog } from "./validacao-reprovar-dialog"

interface PropostasListaProps {
  onNovaProposta: () => void
  onEditarProposta: (proposta: Proposta) => void
  onVerDetalhes: (proposta: Proposta) => void
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function PropostasLista({ onNovaProposta, onEditarProposta, onVerDetalhes }: PropostasListaProps) {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<PropostaStatus | "todas">("todas")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const { user } = useUser()
  const isAdmin = user?.role === "admin"
  const [abaValidacao, setAbaValidacao] = useState(false)
  const [validacaoMes, setValidacaoMes] = useState<string>("todos")
  const [reprovarProposta, setReprovarProposta] = useState<Proposta | null>(null)
  const [reprovarSaving, setReprovarSaving] = useState(false)

  useEffect(() => {
    fetchPropostas()
  }, [])

  // Selecionar o dia de hoje por padrao
  useEffect(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    setSelectedDay(todayStr)
  }, [])

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  async function fetchPropostas() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("propostas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[propostas] Erro ao buscar:", error.message)
        return
      }
      if (data) setPropostas(data as Proposta[])
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDuplicar(proposta: Proposta) {
    try {
      const supabase = getSupabase()
      const { id, created_at, updated_at, ...rest } = proposta
      const { error } = await supabase.from("propostas").insert({
        ...rest,
        nome_cliente: `${proposta.nome_cliente} (copia)`,
        status: "em_negociacao",
      })
      if (error) {
        console.error("[propostas] Erro ao duplicar:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("propostas").delete().eq("id", deleteId)
      if (error) {
        console.error("[propostas] Erro ao excluir:", error.message)
        return
      }
      setDeleteId(null)
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleStatusChange(id: number, status: PropostaStatus) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("propostas").update({ status }).eq("id", id)
      if (error) {
        console.error("[propostas] Erro ao atualizar status:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleAprovar(proposta: Proposta) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from("propostas")
        .update({
          validacao_status: "aprovada",
          validado_em: new Date().toISOString(),
        })
        .eq("id", proposta.id)
      if (error) {
        console.error("[propostas] Erro ao aprovar:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleCancelarValidacao(proposta: Proposta) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from("propostas")
        .update({
          validacao_status: "pendente",
          validacao_motivo: null,
          validado_em: null,
        })
        .eq("id", proposta.id)
      if (error) {
        console.error("[propostas] Erro ao cancelar validação:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleReprovar(motivo: string) {
    if (!reprovarProposta) return
    try {
      setReprovarSaving(true)
      const supabase = getSupabase()
      const { error } = await supabase
        .from("propostas")
        .update({
          validacao_status: "reprovada",
          validacao_motivo: motivo,
          validado_em: new Date().toISOString(),
        })
        .eq("id", reprovarProposta.id)
      if (error) {
        console.error("[propostas] Erro ao reprovar:", error.message)
        return
      }
      setReprovarProposta(null)
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setReprovarSaving(false)
    }
  }

  // Filtrar propostas
  const filtered = propostas.filter((p) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      p.nome_cliente.toLowerCase().includes(term) ||
      (p.cpf_cliente && p.cpf_cliente.includes(term))
    const matchesStatus = filterStatus === "todas" || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Agrupar propostas por dia (YYYY-MM-DD)
  function getDateKey(dateStr: string): string {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const propostasPorDia: Record<string, Proposta[]> = {}
  filtered.forEach((p) => {
    const key = p.data_proposta
    if (!propostasPorDia[key]) propostasPorDia[key] = []
    propostasPorDia[key].push(p)
  })

  // Gerar dias do calendario
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startPad; i++) calendarDays.push(null)
  for (let d = 1; d <= totalDays; d++) calendarDays.push(d)

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  function goToToday() {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    setSelectedDay(todayStr)
  }

  function getDayKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
  })()

  // Propostas do dia selecionado
  const propostasDoDia = selectedDay ? (propostasPorDia[selectedDay] || []) : []

  const statusCounts = {
    todas: propostas.length,
    em_negociacao: propostas.filter((p) => p.status === "em_negociacao").length,
    aguardando_pagamento: propostas.filter((p) => p.status === "aguardando_pagamento").length,
    pago: propostas.filter((p) => p.status === "pago").length,
    recusada: propostas.filter((p) => p.status === "recusada").length,
  }

  const pendentesValidacaoAll = propostas.filter(
    (p) => p.status === "pago" && p.validacao_status === "pendente"
  )

  const validacaoMeses = (() => {
    const MESES_LABEL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    const set = new Set<string>()
    pendentesValidacaoAll.forEach((p) => {
      const d = new Date(p.data_proposta + "T12:00:00")
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
    })
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [ano, mes] = key.split("-")
        return { value: key, label: `${MESES_LABEL[parseInt(mes) - 1]} ${ano}` }
      })
  })()

  const pendentesValidacao = validacaoMes === "todos"
    ? pendentesValidacaoAll
    : pendentesValidacaoAll.filter((p) => {
        const d = new Date(p.data_proposta + "T12:00:00")
        const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        return mesAno === validacaoMes
      })

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  function formatSelectedDate(): string {
    if (!selectedDay) return ""
    const [y, m, d] = selectedDay.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header: busca + botao */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={onNovaProposta}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta
        </Button>
      </div>

      {/* Filtros de status */}
      {!abaValidacao && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-none">
          {(["todas", "em_negociacao", "aguardando_pagamento", "pago", "recusada"] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              size="sm"
              className="shrink-0 text-xs sm:text-sm"
            >
              {status === "todas" ? "Todas" : STATUS_CONFIG[status].label} ({statusCounts[status]})
            </Button>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="flex gap-2">
          <Button
            variant={!abaValidacao ? "default" : "outline"}
            size="sm"
            onClick={() => setAbaValidacao(false)}
          >
            Propostas
          </Button>
          <Button
            variant={abaValidacao ? "default" : "outline"}
            size="sm"
            onClick={() => setAbaValidacao(true)}
            className="gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Validação
            {pendentesValidacao.length > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendentesValidacao.length}
              </span>
            )}
          </Button>
        </div>
      )}

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Carregando propostas...</p>
          </div>
        </Card>
      ) : (
        <>
        {!abaValidacao && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 sm:gap-6">
          {/* Calendario */}
          <Card className="p-3 sm:p-4">
            {/* Navegacao do mes */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-10 w-10 sm:h-8 sm:w-8">
                <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {MESES[month]} {year}
                </h3>
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-6 px-2">
                  Hoje
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-10 w-10 sm:h-8 sm:w-8">
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DIAS_SEMANA.map((dia) => (
                <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {dia}
                </div>
              ))}
            </div>

            {/* Dias do mes */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="h-11 sm:h-10" />
                }
                const dayKey = getDayKey(day)
                const dayPropostas = propostasPorDia[dayKey] || []
                const count = dayPropostas.length
                const isToday = dayKey === todayStr
                const isSelected = dayKey === selectedDay

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDay(dayKey)}
                    className={`h-11 sm:h-10 rounded-lg text-sm relative transition-all duration-200 flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isToday
                          ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                          : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs">{day}</span>
                    {count > 0 && (
                      <div className={`flex gap-0.5 mt-0.5 ${isSelected ? "" : ""}`}>
                        {count <= 3 ? (
                          dayPropostas.slice(0, 3).map((p, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected
                                  ? "bg-primary-foreground"
                                  : p.status === "pago"
                                    ? "bg-green-500"
                                    : p.status === "em_negociacao"
                                      ? "bg-yellow-500"
                                      : p.status === "aguardando_pagamento"
                                        ? "bg-blue-500"
                                        : "bg-red-500"
                              }`}
                            />
                          ))
                        ) : (
                          <span className={`text-[9px] font-bold ${isSelected ? "text-primary-foreground" : "text-primary"}`}>
                            {count}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Propostas do dia selecionado */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground capitalize">
                  {formatSelectedDate()}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {propostasDoDia.length} {propostasDoDia.length === 1 ? "proposta" : "propostas"}
                  {propostasDoDia.length > 0 && (
                    <> • {formatCurrency(propostasDoDia.reduce((sum, p) => sum + p.valor_total, 0))} total</>
                  )}
                </p>
              </div>
            </div>

            {propostasDoDia.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma proposta neste dia.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {propostasDoDia.map((proposta) => (
                  <Card
                    key={proposta.id}
                    className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => onVerDetalhes(proposta)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">#{proposta.id}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CONFIG[proposta.status].color}`}>
                            {STATUS_CONFIG[proposta.status].label}
                          </span>
                          {proposta.validacao_status && proposta.validacao_status !== "pendente" && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${VALIDACAO_CONFIG[proposta.validacao_status].color}`}>
                              {VALIDACAO_CONFIG[proposta.validacao_status].label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">{proposta.nome_cliente}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {proposta.itens.map((i) => i.procedimentoNome).join(", ")}
                        </p>
                        <p className="text-sm font-bold text-foreground mt-1">
                          {formatCurrency(proposta.valor_total)}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVerDetalhes(proposta) }}>
                            <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditarProposta(proposta) }}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicar(proposta) }}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <RefreshCw className="w-4 h-4 mr-2" /> Alterar status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {(Object.keys(STATUS_CONFIG) as PropostaStatus[]).map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(proposta.id, s) }}
                                  disabled={proposta.status === s}
                                >
                                  {STATUS_CONFIG[s].label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          {isAdmin && proposta.status === "pago" && (
                            <>
                              <DropdownMenuSeparator />
                              {proposta.validacao_status !== "aprovada" && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAprovar(proposta) }}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Aprovar
                                </DropdownMenuItem>
                              )}
                              {proposta.validacao_status !== "reprovada" && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setReprovarProposta(proposta) }}>
                                  <XCircle className="w-4 h-4 mr-2 text-red-500" /> Reprovar
                                </DropdownMenuItem>
                              )}
                              {proposta.validacao_status !== "pendente" && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCancelarValidacao(proposta) }}>
                                  <RotateCcw className="w-4 h-4 mr-2 text-muted-foreground" /> Cancelar Validação
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteId(proposta.id) }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {abaValidacao && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Select value={validacaoMes} onValueChange={setValidacaoMes}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white border border-border rounded-lg text-xs">
                  <SelectValue placeholder="Filtrar por mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="text-xs">Todos os meses</SelectItem>
                  {validacaoMeses.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {pendentesValidacao.length} {pendentesValidacao.length === 1 ? "proposta" : "propostas"} pendente{pendentesValidacao.length !== 1 ? "s" : ""}
              </span>
            </div>
            {pendentesValidacao.length === 0 ? (
              <Card className="p-8 text-center">
                <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma proposta pendente de validação.</p>
              </Card>
            ) : (
              pendentesValidacao.map((proposta) => (
                <Card
                  key={proposta.id}
                  className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => onVerDetalhes(proposta)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">#{proposta.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CONFIG[proposta.status].color}`}>
                          {STATUS_CONFIG[proposta.status].label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{proposta.nome_cliente}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {proposta.itens.map((i) => i.procedimentoNome).join(", ")}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(proposta.valor_total)}</span>
                        {proposta.valor_desconto_protocolo > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Desconto: {formatCurrency(proposta.valor_desconto_protocolo)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-3 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
                        onClick={(e) => { e.stopPropagation(); handleAprovar(proposta) }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                        onClick={(e) => { e.stopPropagation(); setReprovarProposta(proposta) }}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reprovar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        </>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filtered.length} de {propostas.length} propostas</span>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ValidacaoReprovarDialog
        open={reprovarProposta !== null}
        onClose={() => setReprovarProposta(null)}
        onConfirm={handleReprovar}
        saving={reprovarSaving}
        nomeCliente={reprovarProposta?.nome_cliente ?? ""}
      />
    </div>
  )
}
