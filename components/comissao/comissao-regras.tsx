"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  created_at: string
}

interface Profissional {
  id: number
  nome: string
}

const TIPO_CONFIG: Record<ComissaoRegra["tipo"], { label: string; className: string }> = {
  procedimento: {
    label: "Procedimento",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  profissional: {
    label: "Profissional",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  meta: {
    label: "Meta",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
}

const EMPTY_FORM: Omit<ComissaoRegra, "id" | "created_at"> = {
  nome: "",
  tipo: "procedimento",
  procedimento_nome: "",
  profissional_id: null,
  percentual: 0,
  meta_minima: null,
  meta_maxima: null,
  bonus_percentual: null,
  ativo: true,
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

export function ComissaoRegras() {
  const [regras, setRegras] = useState<ComissaoRegra[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchRegras = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("comissao_regras")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[comissao_regras] Erro ao buscar:", error.message)
        toast.error("Erro ao carregar regras")
        return
      }

      setRegras((data as ComissaoRegra[]) || [])
    } catch (error) {
      console.error("[comissao_regras] Erro:", error)
      toast.error("Erro ao carregar regras")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProfissionais = useCallback(async () => {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from("profissionais")
        .select("id, nome")
        .order("nome")

      if (data) setProfissionais(data as Profissional[])
    } catch (error) {
      console.error("[profissionais] Erro:", error)
    }
  }, [])

  useEffect(() => {
    fetchRegras()
    fetchProfissionais()
  }, [fetchRegras, fetchProfissionais])

  function openNewRegra() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setSheetOpen(true)
  }

  function openEditRegra(regra: ComissaoRegra) {
    setEditingId(regra.id)
    setForm({
      nome: regra.nome,
      tipo: regra.tipo,
      procedimento_nome: regra.procedimento_nome || "",
      profissional_id: regra.profissional_id,
      percentual: regra.percentual,
      meta_minima: regra.meta_minima,
      meta_maxima: regra.meta_maxima,
      bonus_percentual: regra.bonus_percentual,
      ativo: regra.ativo,
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da regra")
      return
    }

    if (form.percentual <= 0) {
      toast.error("Informe um percentual valido")
      return
    }

    try {
      setSaving(true)
      const supabase = getSupabase()

      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        procedimento_nome: form.tipo === "procedimento" ? form.procedimento_nome : null,
        profissional_id: form.tipo === "profissional" ? form.profissional_id : null,
        percentual: form.percentual,
        meta_minima: form.tipo === "meta" ? form.meta_minima : null,
        meta_maxima: form.tipo === "meta" ? form.meta_maxima : null,
        bonus_percentual: form.bonus_percentual || null,
        ativo: form.ativo,
      }

      if (editingId) {
        const { error } = await supabase
          .from("comissao_regras")
          .update(payload)
          .eq("id", editingId)

        if (error) {
          console.error("[comissao_regras] Erro ao atualizar:", error.message)
          toast.error("Erro ao atualizar regra")
          return
        }

        toast.success("Regra atualizada com sucesso")
      } else {
        const { error } = await supabase.from("comissao_regras").insert(payload)

        if (error) {
          console.error("[comissao_regras] Erro ao criar:", error.message)
          toast.error("Erro ao criar regra")
          return
        }

        toast.success("Regra criada com sucesso")
      }

      setSheetOpen(false)
      fetchRegras()
    } catch (error) {
      console.error("[comissao_regras] Erro:", error)
      toast.error("Erro ao salvar regra")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("comissao_regras").delete().eq("id", deleteId)

      if (error) {
        console.error("[comissao_regras] Erro ao excluir:", error.message)
        toast.error("Erro ao excluir regra")
        return
      }

      toast.success("Regra excluida com sucesso")
      setDeleteId(null)
      fetchRegras()
    } catch (error) {
      console.error("[comissao_regras] Erro:", error)
      toast.error("Erro ao excluir regra")
    }
  }

  function getProfissionalNome(id: number | null): string {
    if (!id) return "-"
    const p = profissionais.find((prof) => prof.id === id)
    return p ? p.nome : `ID ${id}`
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure as regras de calculo de comissao por procedimento, profissional ou meta.
        </p>
        <Button
          onClick={openNewRegra}
          size="sm"
          className="gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Nova Regra
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Carregando regras...</p>
          </div>
        </Card>
      ) : regras.length === 0 ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma regra de comissao cadastrada
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Crie regras para calcular as comissoes automaticamente.
            </p>
            <Button onClick={openNewRegra} size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeira Regra
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Procedimento / Profissional</TableHead>
                <TableHead className="text-right">Percentual</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {regras.map((regra) => {
                const tipoConfig = TIPO_CONFIG[regra.tipo]

                return (
                  <TableRow
                    key={regra.id}
                    className="cursor-pointer transition-colors duration-200"
                    onClick={() => openEditRegra(regra)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {regra.nome}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${tipoConfig.className}`}
                      >
                        {tipoConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {regra.tipo === "procedimento"
                        ? regra.procedimento_nome || "-"
                        : regra.tipo === "profissional"
                          ? getProfissionalNome(regra.profissional_id)
                          : "-"}
                    </TableCell>
                    <TableCell className="text-right text-foreground font-medium">
                      {regra.percentual}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {regra.bonus_percentual ? `${regra.bonus_percentual}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          regra.ativo
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {regra.ativo ? "Sim" : "Nao"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditRegra(regra)
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(regra.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Sheet - Form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Regra" : "Nova Regra"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Altere os dados da regra de comissao."
                : "Preencha os dados para criar uma nova regra."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Ex: Comissao Harmonizacao"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    tipo: v as ComissaoRegra["tipo"],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.tipo === "procedimento" && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="procedimento_nome">Nome do Procedimento</Label>
                <Input
                  id="procedimento_nome"
                  placeholder="Ex: Harmonizacao Facial"
                  value={form.procedimento_nome || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, procedimento_nome: e.target.value }))
                  }
                />
              </div>
            )}

            {form.tipo === "profissional" && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="profissional_id">Profissional</Label>
                <Select
                  value={form.profissional_id?.toString() || ""}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, profissional_id: Number(v) }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="percentual">Percentual (%)</Label>
              <Input
                id="percentual"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="Ex: 10"
                value={form.percentual || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, percentual: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>

            {form.tipo === "meta" && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="meta_minima">Meta Minima (R$)</Label>
                  <Input
                    id="meta_minima"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={form.meta_minima ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        meta_minima: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_maxima">Meta Maxima (R$)</Label>
                  <Input
                    id="meta_maxima"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={form.meta_maxima ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        meta_maxima: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bonus_percentual">Bonus Percentual (%)</Label>
              <Input
                id="bonus_percentual"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="Ex: 5"
                value={form.bonus_percentual ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bonus_percentual: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="ativo" className="text-sm font-medium">
                  Regra Ativa
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Regras inativas nao serao usadas no calculo.
                </p>
              </div>
              <Switch
                id="ativo"
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
            <AlertDialogTitle>Excluir regra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra de comissao? Esta acao nao pode ser
              desfeita.
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
