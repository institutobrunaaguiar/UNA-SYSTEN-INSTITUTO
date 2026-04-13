"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  MoreHorizontal,
  TrendingUp,
  Users,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
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

interface Meta {
  id: number
  nome: string
  tipo: "individual" | "coletiva"
  profissional_id: number | null
  profissional_nome: string | null
  valor_meta: number
  valor_atingido: number
  periodo: string
  bonus_percentual: number | null
  ativo: boolean
  created_at: string
}

const EMPTY_FORM: Omit<Meta, "id" | "created_at"> = {
  nome: "",
  tipo: "individual",
  profissional_id: null,
  profissional_nome: "",
  valor_meta: 0,
  valor_atingido: 0,
  periodo: "",
  bonus_percentual: null,
  ativo: true,
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

export function ComissaoMetas() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchMetas = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[metas] Erro ao buscar:", error.message)
        toast.error("Erro ao carregar metas")
        return
      }

      setMetas((data as Meta[]) || [])
    } catch (error) {
      console.error("[metas] Erro:", error)
      toast.error("Erro ao carregar metas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetas()
  }, [fetchMetas])

  function openNewMeta() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setSheetOpen(true)
  }

  function openEditMeta(meta: Meta) {
    setEditingId(meta.id)
    setForm({
      nome: meta.nome,
      tipo: meta.tipo,
      profissional_id: meta.profissional_id,
      profissional_nome: meta.profissional_nome || "",
      valor_meta: meta.valor_meta,
      valor_atingido: meta.valor_atingido,
      periodo: meta.periodo,
      bonus_percentual: meta.bonus_percentual,
      ativo: meta.ativo,
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da meta")
      return
    }

    if (form.valor_meta <= 0) {
      toast.error("Informe um valor de meta valido")
      return
    }

    if (!form.periodo) {
      toast.error("Informe o periodo da meta")
      return
    }

    try {
      setSaving(true)
      const supabase = getSupabase()

      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        profissional_id: form.profissional_id,
        profissional_nome: form.profissional_nome || null,
        valor_meta: form.valor_meta,
        valor_atingido: form.valor_atingido,
        periodo: form.periodo,
        bonus_percentual: form.bonus_percentual || null,
        ativo: form.ativo,
      }

      if (editingId) {
        const { error } = await supabase
          .from("metas")
          .update(payload)
          .eq("id", editingId)

        if (error) {
          console.error("[metas] Erro ao atualizar:", error.message)
          toast.error("Erro ao atualizar meta")
          return
        }

        toast.success("Meta atualizada com sucesso")
      } else {
        const { error } = await supabase.from("metas").insert(payload)

        if (error) {
          console.error("[metas] Erro ao criar:", error.message)
          toast.error("Erro ao criar meta")
          return
        }

        toast.success("Meta criada com sucesso")
      }

      setSheetOpen(false)
      fetchMetas()
    } catch (error) {
      console.error("[metas] Erro:", error)
      toast.error("Erro ao salvar meta")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("metas").delete().eq("id", deleteId)

      if (error) {
        console.error("[metas] Erro ao excluir:", error.message)
        toast.error("Erro ao excluir meta")
        return
      }

      toast.success("Meta excluida com sucesso")
      setDeleteId(null)
      fetchMetas()
    } catch (error) {
      console.error("[metas] Erro:", error)
      toast.error("Erro ao excluir meta")
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Acompanhe as metas individuais e coletivas da equipe.
        </p>
        <Button
          onClick={openNewMeta}
          size="sm"
          className="gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Carregando metas...</p>
          </div>
        </Card>
      ) : metas.length === 0 ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma meta cadastrada
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Crie metas para acompanhar o desempenho da equipe.
            </p>
            <Button onClick={openNewMeta} size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeira Meta
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metas.map((meta) => {
            const progress =
              meta.valor_meta > 0
                ? Math.min((meta.valor_atingido / meta.valor_meta) * 100, 100)
                : 0
            const isCompleted = progress >= 100

            return (
              <Card
                key={meta.id}
                className={`p-3 sm:p-4 hover:shadow-lg transition-all duration-300 relative ${
                  !meta.ativo ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          meta.tipo === "individual"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : "bg-violet-500/10 text-violet-500 border-violet-500/20"
                        }`}
                      >
                        {meta.tipo === "individual" ? (
                          <User className="w-2.5 h-2.5" />
                        ) : (
                          <Users className="w-2.5 h-2.5" />
                        )}
                        {meta.tipo === "individual" ? "Individual" : "Coletiva"}
                      </span>
                      {!meta.ativo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                          Inativa
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {meta.nome}
                    </h3>
                    {meta.profissional_nome && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {meta.profissional_nome}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditMeta(meta)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(meta.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-base sm:text-lg font-bold text-foreground">
                        {formatCurrency(meta.valor_atingido)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        de {formatCurrency(meta.valor_meta)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold ${
                          isCompleted ? "text-green-500" : "text-foreground"
                        }`}
                      >
                        {progress.toFixed(1)}%
                      </span>
                      {isCompleted && (
                        <TrendingUp className="w-4 h-4 text-green-500 inline-block ml-1" />
                      )}
                    </div>
                  </div>

                  <Progress
                    value={progress}
                    className={`h-2 ${isCompleted ? "[&>div]:bg-green-500" : ""}`}
                  />
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Periodo: {meta.periodo}
                  </span>
                  {meta.bonus_percentual && (
                    <span className="text-xs font-medium text-amber-500">
                      Bonus: {meta.bonus_percentual}%
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sheet - Form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Meta" : "Nova Meta"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Altere os dados da meta."
                : "Preencha os dados para criar uma nova meta."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="meta-nome">Nome</Label>
              <Input
                id="meta-nome"
                placeholder="Ex: Meta Mensal Equipe"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-tipo">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, tipo: v as Meta["tipo"] }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="coletiva">Coletiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-profissional">Nome do Profissional</Label>
              <Input
                id="meta-profissional"
                placeholder="Ex: Dr. Joao Silva"
                value={form.profissional_nome || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, profissional_nome: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="meta-valor">Valor da Meta (R$)</Label>
                <Input
                  id="meta-valor"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.valor_meta || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      valor_meta: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-atingido">Valor Atingido (R$)</Label>
                <Input
                  id="meta-atingido"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.valor_atingido || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      valor_atingido: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-periodo">Periodo</Label>
              <Input
                id="meta-periodo"
                type="month"
                placeholder="YYYY-MM"
                value={form.periodo}
                onChange={(e) => setForm((f) => ({ ...f, periodo: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-bonus">Bonus Percentual (%)</Label>
              <Input
                id="meta-bonus"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="Ex: 5"
                value={form.bonus_percentual ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bonus_percentual: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="meta-ativo" className="text-sm font-medium">
                  Meta Ativa
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Metas inativas nao aparecerao no acompanhamento.
                </p>
              </div>
              <Switch
                id="meta-ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, ativo: checked }))}
              />
            </div>
          </div>

          <SheetFooter>
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
            <AlertDialogTitle>Excluir meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta acao nao pode ser desfeita.
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
