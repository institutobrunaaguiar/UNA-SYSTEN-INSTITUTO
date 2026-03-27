"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  MoreHorizontal,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Comissao {
  id: number
  proposta_id: number | null
  profissional_id: number | null
  profissional_nome: string
  procedimento_nome: string
  valor_base: number
  percentual: number
  valor_comissao: number
  regra_id: number | null
  status: "pendente" | "em_validacao" | "aprovado" | "pago"
  periodo_referencia: string
  observacoes: string | null
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<
  Comissao["status"],
  { label: string; className: string; icon: typeof Clock }
> = {
  pendente: {
    label: "Pendente",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: Clock,
  },
  em_validacao: {
    label: "Em Validacao",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: ShieldCheck,
  },
  aprovado: {
    label: "Aprovado",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircle2,
  },
  pago: {
    label: "Pago",
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    icon: Banknote,
  },
}

const PER_PAGE = 20

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

export function ComissaoLista() {
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<Comissao["status"] | "todas">("todas")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchComissoes = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()

      let query = supabase
        .from("comissoes")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })

      if (filterStatus !== "todas") {
        query = query.eq("status", filterStatus)
      }

      if (filterPeriodo) {
        query = query.eq("periodo_referencia", filterPeriodo)
      }

      const from = (currentPage - 1) * PER_PAGE
      const to = from + PER_PAGE - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error("[comissoes] Erro ao buscar:", error.message)
        toast.error("Erro ao carregar comissoes")
        return
      }

      setComissoes((data as Comissao[]) || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("[comissoes] Erro:", error)
      toast.error("Erro ao carregar comissoes")
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPeriodo, currentPage])

  useEffect(() => {
    fetchComissoes()
  }, [fetchComissoes])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
  }, [filterStatus, filterPeriodo])

  async function handleStatusChange(id: number, newStatus: Comissao["status"]) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from("comissoes")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        console.error("[comissoes] Erro ao atualizar:", error.message)
        toast.error("Erro ao atualizar status")
        return
      }

      toast.success(`Status atualizado para ${STATUS_CONFIG[newStatus].label}`)
      fetchComissoes()
    } catch (error) {
      console.error("[comissoes] Erro:", error)
      toast.error("Erro ao atualizar status")
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return

    try {
      const supabase = getSupabase()
      const ids = Array.from(selectedIds)

      const { error } = await supabase
        .from("comissoes")
        .update({ status: "aprovado", updated_at: new Date().toISOString() })
        .in("id", ids)

      if (error) {
        console.error("[comissoes] Erro ao aprovar em lote:", error.message)
        toast.error("Erro ao aprovar comissoes selecionadas")
        return
      }

      toast.success(`${ids.length} comissao(oes) aprovada(s) com sucesso`)
      setSelectedIds(new Set())
      fetchComissoes()
    } catch (error) {
      console.error("[comissoes] Erro:", error)
      toast.error("Erro ao aprovar comissoes")
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === comissoes.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(comissoes.map((c) => c.id)))
    }
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as Comissao["status"] | "todas")}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_validacao">Em Validacao</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 sm:max-w-[200px]">
          <Input
            type="month"
            placeholder="Periodo (YYYY-MM)"
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className="h-9"
          />
        </div>

        {selectedIds.size > 0 && (
          <Button
            onClick={handleBulkApprove}
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aprovar Selecionados ({selectedIds.size})
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Carregando comissoes...</p>
          </div>
        </Card>
      ) : comissoes.length === 0 ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <Banknote className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma comissao encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Use o botao "Calcular Comissoes" para gerar comissoes a partir das propostas pagas.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedIds.size === comissoes.length && comissoes.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead className="hidden md:table-cell">Procedimento</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Valor Base</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">%</TableHead>
                  <TableHead className="text-right">Comissao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Periodo</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoes.map((comissao) => {
                  const statusConfig = STATUS_CONFIG[comissao.status]
                  const StatusIcon = statusConfig.icon

                  return (
                    <TableRow
                      key={comissao.id}
                      className="transition-colors duration-200"
                      data-state={selectedIds.has(comissao.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(comissao.id)}
                          onCheckedChange={() => toggleSelect(comissao.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {comissao.profissional_nome}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {comissao.procedimento_nome}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                        {formatCurrency(comissao.valor_base)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                        {comissao.percentual}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(comissao.valor_comissao)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {comissao.periodo_referencia}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {comissao.status !== "em_validacao" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(comissao.id, "em_validacao")}
                              >
                                <ShieldCheck className="w-4 h-4 mr-2 text-blue-500" />
                                Validar
                              </DropdownMenuItem>
                            )}
                            {comissao.status !== "aprovado" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(comissao.id, "aprovado")}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                Aprovar
                              </DropdownMenuItem>
                            )}
                            {comissao.status !== "pago" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(comissao.id, "pago")}
                                >
                                  <Banknote className="w-4 h-4 mr-2 text-purple-500" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {(currentPage - 1) * PER_PAGE + 1} a{" "}
              {Math.min(currentPage * PER_PAGE, totalCount)} de {totalCount} comissoes
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium">
                {currentPage} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
