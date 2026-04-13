"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  MoreHorizontal,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Configuração de status ───────────────────────────────────────────────────

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
    label: "Em Validação",
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Form de lançamento manual ────────────────────────────────────────────────

interface FormState {
  profissional_nome: string
  procedimento_nome: string
  valor_base: number
  percentual: number
  valor_comissao: number
  periodo_referencia: string
  observacoes: string
}

const EMPTY_FORM: FormState = {
  profissional_nome: "",
  procedimento_nome: "",
  valor_base: 0,
  percentual: 0,
  valor_comissao: 0,
  periodo_referencia: "",
  observacoes: "",
}

interface LancamentoSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editingId: number | null
  initialForm: FormState
  onSaved: () => void
}

function LancamentoSheet({
  open,
  onOpenChange,
  editingId,
  initialForm,
  onSaved,
}: LancamentoSheetProps) {
  const [profissional, setProfissional] = useState("")
  const [descricao, setDescricao] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [valorBase, setValorBase] = useState("")
  const [percentual, setPercentual] = useState("")
  const [valorComissao, setValorComissao] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [saving, setSaving] = useState(false)

  // Sincroniza ao abrir
  useEffect(() => {
    if (open) {
      setProfissional(initialForm.profissional_nome)
      setDescricao(initialForm.procedimento_nome)
      setPeriodo(initialForm.periodo_referencia)
      setValorBase(initialForm.valor_base > 0 ? String(initialForm.valor_base) : "")
      setPercentual(initialForm.percentual > 0 ? String(initialForm.percentual) : "")
      setValorComissao(initialForm.valor_comissao > 0 ? String(initialForm.valor_comissao) : "")
      setObservacoes(initialForm.observacoes)
      setSaving(false)
    }
  }, [open]) // só depende de open para não resetar ao editar

  // Sugestão de cálculo (base × %)
  const sugestao = useMemo(() => {
    const b = parseFloat(valorBase) || 0
    const p = parseFloat(percentual) || 0
    if (b > 0 && p > 0) return Math.round(b * p / 100 * 100) / 100
    return 0
  }, [valorBase, percentual])

  async function handleSave() {
    if (!profissional.trim()) { toast.error("Informe o profissional/colaborador"); return }
    if (!descricao.trim())    { toast.error("Informe a descrição da comissão"); return }
    if (!periodo)             { toast.error("Selecione o período de referência"); return }

    const vc = parseFloat(valorComissao.replace(",", "."))
    if (!vc || vc <= 0)       { toast.error("Informe o valor da comissão (campo obrigatório)"); return }

    try {
      setSaving(true)
      const supabase = getSupabase()

      const payload = {
        profissional_id: null,
        profissional_nome: profissional.trim(),
        procedimento_nome: descricao.trim(),
        valor_base: parseFloat(valorBase.replace(",", ".")) || 0,
        percentual: parseFloat(percentual.replace(",", ".")) || 0,
        valor_comissao: vc,
        regra_id: null,
        proposta_id: null,
        status: "pendente",
        periodo_referencia: periodo,
        observacoes: observacoes.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase
          .from("comissoes")
          .update(payload)
          .eq("id", editingId)

        if (error) {
          toast.error("Erro ao atualizar: " + error.message)
          console.error("[comissoes]", error)
          return
        }
        toast.success("Comissão atualizada")
      } else {
        const { error } = await supabase.from("comissoes").insert(payload)

        if (error) {
          toast.error("Erro ao registrar: " + error.message)
          console.error("[comissoes]", error)
          return
        }
        toast.success("Comissão registrada com sucesso")
      }

      onOpenChange(false)
      onSaved()
    } catch (err) {
      console.error("[comissoes] Erro:", err)
      toast.error("Erro ao salvar comissão")
    } finally {
      setSaving(false)
    }
  }

  const vcNum = parseFloat(valorComissao.replace(",", ".")) || 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingId ? "Editar Comissão" : "Nova Comissão"}</SheetTitle>
          <SheetDescription>
            {editingId
              ? "Altere os dados da comissão."
              : "Registre manualmente uma comissão — bonificação, meta, cross-selling, etc."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          {/* Profissional */}
          <div className="space-y-2">
            <Label htmlFor="lc-prof">Profissional / Colaborador *</Label>
            <Input
              id="lc-prof"
              placeholder="Ex: Giovanna Recepção"
              value={profissional}
              onChange={(e) => setProfissional(e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="lc-proc">Descrição da Comissão *</Label>
            <Input
              id="lc-proc"
              placeholder="Ex: Bonificação Meta Cross-Selling — 9 agendamentos"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="lc-periodo">Período de Referência *</Label>
            <Input
              id="lc-periodo"
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            />
          </div>

          {/* Valor da comissão — campo principal, sempre editável */}
          <div className="space-y-2">
            <Label htmlFor="lc-comissao">
              Valor da Comissão (R$) *
            </Label>
            <Input
              id="lc-comissao"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 266.67"
              value={valorComissao}
              onChange={(e) => setValorComissao(e.target.value)}
              className="font-semibold text-base"
            />
            {/* Sugestão de cálculo quando base+% preenchidos */}
            {sugestao > 0 && Math.abs(sugestao - vcNum) > 0.01 && (
              <button
                type="button"
                className="text-xs text-primary underline text-left"
                onClick={() => setValorComissao(String(sugestao))}
              >
                Usar cálculo automático: {formatCurrency(sugestao)}
              </button>
            )}
          </div>

          {/* Valor base + percentual (opcionais — para referência) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lc-base" className="text-xs text-muted-foreground">
                Valor Base (R$) — opcional
              </Label>
              <Input
                id="lc-base"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 800"
                value={valorBase}
                onChange={(e) => setValorBase(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lc-pct" className="text-xs text-muted-foreground">
                Percentual (%) — opcional
              </Label>
              <Input
                id="lc-pct"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Ex: 33.33"
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          {sugestao > 0 && (
            <p className="text-xs text-muted-foreground -mt-2">
              {formatCurrency(parseFloat(valorBase) || 0)} × {percentual}% = <strong>{formatCurrency(sugestao)}</strong>
            </p>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="lc-obs">Observações (opcional)</Label>
            <Input
              id="lc-obs"
              placeholder="Ex: 9 de 27 agendamentos — 33% da meta"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          {/* Resumo do registro */}
          {profissional && vcNum > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Resumo</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{profissional}</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(vcNum)}</span>
              </div>
              {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
              {periodo && <p className="text-[10px] text-muted-foreground">Período: {periodo}</p>}
            </div>
          )}
        </div>

        <SheetFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Atualizar" : "Registrar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ComissaoLista() {
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<Comissao["status"] | "todas">("todas")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Sheet de lançamento
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sheetForm, setSheetForm] = useState(EMPTY_FORM)

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
        toast.error("Erro ao carregar comissões")
        return
      }

      setComissoes((data as Comissao[]) || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("[comissoes] Erro:", error)
      toast.error("Erro ao carregar comissões")
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
        toast.error("Erro ao atualizar status")
        return
      }

      toast.success(`Status: ${STATUS_CONFIG[newStatus].label}`)
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
      const { error } = await supabase
        .from("comissoes")
        .update({ status: "aprovado", updated_at: new Date().toISOString() })
        .in("id", Array.from(selectedIds))

      if (error) {
        toast.error("Erro ao aprovar em lote")
        return
      }

      toast.success(`${selectedIds.size} comissão(ões) aprovada(s)`)
      setSelectedIds(new Set())
      fetchComissoes()
    } catch (error) {
      console.error("[comissoes] Erro:", error)
      toast.error("Erro ao aprovar comissões")
    }
  }

  function openNew() {
    setEditingId(null)
    setSheetForm({ ...EMPTY_FORM })
    setSheetOpen(true)
  }

  function openEdit(c: Comissao) {
    setEditingId(c.id)
    setSheetForm({
      profissional_nome: c.profissional_nome,
      procedimento_nome: c.procedimento_nome,
      valor_base: c.valor_base,
      percentual: c.percentual,
      valor_comissao: c.valor_comissao,
      periodo_referencia: c.periodo_referencia,
      observacoes: c.observacoes ?? "",
    })
    setSheetOpen(true)
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(
      selectedIds.size === comissoes.length
        ? new Set()
        : new Set(comissoes.map((c) => c.id))
    )
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filtros + ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
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
              <SelectItem value="em_validacao">Em Validação</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          type="month"
          value={filterPeriodo}
          onChange={(e) => setFilterPeriodo(e.target.value)}
          className="h-9 w-full sm:max-w-[200px]"
        />

        <div className="flex items-center gap-2 sm:ml-auto">
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBulkApprove}
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprovar ({selectedIds.size})
            </Button>
          )}
          <Button onClick={openNew} size="sm" className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nova Comissão
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3" />
            <p className="text-sm text-muted-foreground">Carregando comissões...</p>
          </div>
        </Card>
      ) : comissoes.length === 0 ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <Banknote className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma comissão encontrada
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Use "Calcular Comissões" ou "Nova Comissão" para registrar.
            </p>
            <Button onClick={openNew} size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Registrar Manualmente
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
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
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Base</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">%</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Período</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoes.map((c) => {
                    const sc = STATUS_CONFIG[c.status]
                    const Icon = sc.icon

                    return (
                      <TableRow
                        key={c.id}
                        data-state={selectedIds.has(c.id) ? "selected" : undefined}
                        className="transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {c.profissional_nome}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs max-w-[200px] truncate">
                          {c.procedimento_nome}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                          {c.valor_base > 0 ? formatCurrency(c.valor_base) : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                          {c.percentual > 0 ? `${c.percentual}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(c.valor_comissao)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.className}`}>
                            <Icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {c.periodo_referencia}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {c.status !== "em_validacao" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(c.id, "em_validacao")}>
                                  <ShieldCheck className="w-4 h-4 mr-2 text-blue-500" />
                                  Validar
                                </DropdownMenuItem>
                              )}
                              {c.status !== "aprovado" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(c.id, "aprovado")}>
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                  Aprovar
                                </DropdownMenuItem>
                              )}
                              {c.status !== "pago" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleStatusChange(c.id, "pago")}>
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
            </div>
          </Card>

          {/* Paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, totalCount)} de {totalCount}
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

      {/* Sheet de lançamento manual */}
      <LancamentoSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingId={editingId}
        initialForm={sheetForm}
        onSaved={fetchComissoes}
      />
    </div>
  )
}
