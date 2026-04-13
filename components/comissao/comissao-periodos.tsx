"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  MoreHorizontal,
  Calculator,
  Percent,
  BookOpen,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ComissaoPeriodo {
  id: string
  mes: number
  ano: number
  modalidade: "por_regra" | "por_percentual_total"
  percentual_global: number
  filtro_status: "pago" | "aprovada"
  descricao: string | null
  created_at: string
  updated_at: string
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const EMPTY_FORM = {
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  modalidade: "por_regra" as const,
  percentual_global: 0.6,
  filtro_status: "aprovada" as const,
  descricao: "",
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function getMesLabel(mes: number, ano: number) {
  return `${MESES[mes - 1]} ${ano}`
}

// Simulador de comissão por percentual
function Simulador({ percentual }: { percentual: number }) {
  const [valorTotal, setValorTotal] = useState("57907")

  const comissaoCalculada = useMemo(() => {
    const v = parseFloat(valorTotal.replace(/\./g, "").replace(",", ".")) || 0
    return v * (percentual / 100)
  }, [valorTotal, percentual])

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Simulador</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sim-total" className="text-xs text-muted-foreground">
          Valor total das propostas aprovadas (R$)
        </Label>
        <Input
          id="sim-total"
          placeholder="Ex: 57907"
          value={valorTotal}
          onChange={(e) => setValorTotal(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-primary/20">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{percentual}%</span> sobre {formatBRL(parseFloat(valorTotal.replace(/\./g, "").replace(",", ".")) || 0)}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Comissão estimada</p>
          <p className="text-lg font-bold text-primary">{formatBRL(comissaoCalculada)}</p>
        </div>
      </div>
    </div>
  )
}

export function ComissaoPeriodos() {
  const [periodos, setPeriodos] = useState<ComissaoPeriodo[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchPeriodos = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("comissao_periodos")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false })

      if (error) {
        console.error("[comissao_periodos] Erro ao buscar:", error.message)
        toast.error("Erro ao carregar configurações de períodos")
        return
      }

      setPeriodos((data as ComissaoPeriodo[]) || [])
    } catch (error) {
      console.error("[comissao_periodos] Erro:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

  function openNew() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setSheetOpen(true)
  }

  function openEdit(p: ComissaoPeriodo) {
    setEditingId(p.id)
    setForm({
      mes: p.mes,
      ano: p.ano,
      modalidade: p.modalidade,
      percentual_global: p.percentual_global,
      filtro_status: p.filtro_status,
      descricao: p.descricao || "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.mes || !form.ano) {
      toast.error("Informe o mês e ano")
      return
    }

    if (form.modalidade === "por_percentual_total" && (!form.percentual_global || form.percentual_global <= 0)) {
      toast.error("Informe um percentual válido maior que 0")
      return
    }

    try {
      setSaving(true)
      const supabase = getSupabase()

      const payload = {
        mes: form.mes,
        ano: form.ano,
        modalidade: form.modalidade,
        percentual_global: form.percentual_global,
        filtro_status: form.filtro_status,
        descricao: form.descricao?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase
          .from("comissao_periodos")
          .update(payload)
          .eq("id", editingId)

        if (error) {
          if (error.code === "23505") {
            toast.error("Já existe uma configuração para este mês/ano. Edite a existente.")
          } else {
            toast.error("Erro ao atualizar configuração")
          }
          console.error("[comissao_periodos] Erro ao atualizar:", error.message)
          return
        }
        toast.success("Configuração atualizada com sucesso")
      } else {
        const { error } = await supabase.from("comissao_periodos").insert(payload)

        if (error) {
          if (error.code === "23505") {
            toast.error("Já existe uma configuração para este mês/ano. Edite a existente.")
          } else {
            toast.error("Erro ao criar configuração")
          }
          console.error("[comissao_periodos] Erro ao criar:", error.message)
          return
        }
        toast.success("Configuração criada com sucesso")
      }

      setSheetOpen(false)
      fetchPeriodos()
    } catch (error) {
      console.error("[comissao_periodos] Erro:", error)
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("comissao_periodos").delete().eq("id", deleteId)

      if (error) {
        console.error("[comissao_periodos] Erro ao excluir:", error.message)
        toast.error("Erro ao excluir configuração")
        return
      }

      toast.success("Configuração excluída")
      setDeleteId(null)
      fetchPeriodos()
    } catch (error) {
      console.error("[comissao_periodos] Erro:", error)
      toast.error("Erro ao excluir configuração")
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure a modalidade de cálculo de comissão para cada mês.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Sem configuração: usa as regras da aba "Regras" (padrão).
          </p>
        </div>
        <Button
          onClick={openNew}
          size="sm"
          className="gap-2 shrink-0 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Novo Período
        </Button>
      </div>

      {/* Info card */}
      <Card className="p-3 sm:p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-500">Como funciona</p>
            <p className="text-xs text-muted-foreground">
              <strong>Por Regras</strong>: aplica as regras cadastradas (percentual por procedimento/profissional) sobre propostas com status "pago".
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Por Percentual Total</strong>: aplica um percentual único sobre a soma de todas as propostas aprovadas do período. Ideal para bonificações mensais globais.
            </p>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </Card>
      ) : periodos.length === 0 ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum período configurado</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Sem configuração, o cálculo usa as regras padrão da aba "Regras".
            </p>
            <Button onClick={openNew} size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Configurar Primeiro Período
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {periodos.map((p) => {
            const isPercentual = p.modalidade === "por_percentual_total"
            return (
              <Card key={p.id} className="p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                        isPercentual
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      }`}>
                        {isPercentual ? <Percent className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                        {isPercentual ? "% Total" : "Por Regras"}
                      </span>
                    </div>
                    <p className="text-base font-bold text-foreground">{getMesLabel(p.mes, p.ano)}</p>
                    {p.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.descricao}</p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isPercentual ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Percentual</span>
                      <span className="text-xl font-bold text-foreground">{p.percentual_global}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Base de cálculo</span>
                      <span className="text-xs font-medium text-foreground">
                        {p.filtro_status === "aprovada" ? "Propostas aprovadas" : "Propostas pagas"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Usa as regras cadastradas na aba Regras
                    </span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Sheet - Form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Período" : "Novo Período"}</SheetTitle>
            <SheetDescription>
              Configure a modalidade de cálculo para o mês/ano selecionado.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 p-4">
            {/* Mês e Ano */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select
                  value={String(form.mes)}
                  onValueChange={(v) => setForm((f) => ({ ...f, mes: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  type="number"
                  min="2024"
                  max="2030"
                  value={form.ano}
                  onChange={(e) => setForm((f) => ({ ...f, ano: parseInt(e.target.value) || 2025 }))}
                />
              </div>
            </div>

            {/* Modalidade */}
            <div className="space-y-2">
              <Label>Modalidade de Cálculo</Label>
              <Select
                value={form.modalidade}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, modalidade: v as typeof f.modalidade }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="por_regra">
                    Por Regras (padrão — usa as regras cadastradas)
                  </SelectItem>
                  <SelectItem value="por_percentual_total">
                    Por Percentual Total (% sobre soma das propostas)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.modalidade === "por_regra"
                  ? "Calcula comissão individual por procedimento/profissional usando as regras configuradas."
                  : "Aplica um percentual único sobre a soma de todas as propostas do período."}
              </p>
            </div>

            {/* Campos para percentual total */}
            {form.modalidade === "por_percentual_total" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="percentual">
                    Percentual Global (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="percentual"
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.1"
                      placeholder="Ex: 0.6"
                      value={form.percentual_global}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          percentual_global: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="pr-8"
                    />
                    <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ex: 0.6 = 0,6% · 1 = 1% · 5 = 5%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Base de Cálculo</Label>
                  <Select
                    value={form.filtro_status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, filtro_status: v as typeof f.filtro_status }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprovada">
                        Propostas aprovadas (validação admin)
                      </SelectItem>
                      <SelectItem value="pago">
                        Propostas pagas (status = pago)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Simulador ao vivo */}
                <Simulador percentual={form.percentual_global} />
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Observação (opcional)</Label>
              <Input
                id="descricao"
                placeholder="Ex: Regra especial de abril — bonificação agressiva"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter className="px-4 pb-4">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir configuração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta configuração de período? O cálculo voltará a usar as regras padrão para este mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
