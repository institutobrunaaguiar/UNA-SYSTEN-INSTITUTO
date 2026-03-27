"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Plus, X, Loader2 } from "lucide-react"
import type { Campanha } from "./campanha-lista"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

interface CampanhaItem {
  id?: number
  procedimento_nome: string
  procedimento_id: number | null
  desconto_tipo: "percentual" | "valor" | null
  desconto_valor: number | null
  combo_com: string | null
  beneficio_descricao: string | null
}

interface CampanhaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campanha: Campanha | null
  onSaved: () => void
}

const EMPTY_ITEM: CampanhaItem = {
  procedimento_nome: "",
  procedimento_id: null,
  desconto_tipo: null,
  desconto_valor: null,
  combo_com: null,
  beneficio_descricao: null,
}

export function CampanhaForm({ open, onOpenChange, campanha, onSaved }: CampanhaFormProps) {
  const isEditing = !!campanha

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [tipo, setTipo] = useState<Campanha["tipo"]>("desconto")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [aplicacao, setAplicacao] = useState<Campanha["aplicacao"]>("manual")
  const [ativa, setAtiva] = useState(true)
  const [itens, setItens] = useState<CampanhaItem[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingItens, setLoadingItens] = useState(false)
  const [procedimentos, setProcedimentos] = useState<{ id: number; nome: string }[]>([])

  // Populate form when opening
  useEffect(() => {
    if (open) {
      if (campanha) {
        setNome(campanha.nome)
        setDescricao(campanha.descricao || "")
        setTipo(campanha.tipo)
        setDataInicio(campanha.data_inicio)
        setDataFim(campanha.data_fim)
        setAplicacao(campanha.aplicacao)
        setAtiva(campanha.ativa)
        fetchItens(campanha.id)
      } else {
        resetForm()
      }
      fetchProcedimentos()
    }
  }, [open, campanha])

  function resetForm() {
    setNome("")
    setDescricao("")
    setTipo("desconto")
    setDataInicio("")
    setDataFim("")
    setAplicacao("manual")
    setAtiva(true)
    setItens([])
  }

  async function fetchProcedimentos() {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from("procedimentos_clinica")
        .select("id, nome")
        .order("nome")
      if (data) setProcedimentos(data)
    } catch {
      // Silently fail - user can type manually
    }
  }

  async function fetchItens(campanhaId: number) {
    setLoadingItens(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("campanha_itens")
        .select("*")
        .eq("campanha_id", campanhaId)
        .order("created_at")

      if (error) throw error
      setItens(
        (data || []).map((d: any) => ({
          id: d.id,
          procedimento_nome: d.procedimento_nome || "",
          procedimento_id: d.procedimento_id,
          desconto_tipo: d.desconto_tipo,
          desconto_valor: d.desconto_valor,
          combo_com: d.combo_com,
          beneficio_descricao: d.beneficio_descricao,
        }))
      )
    } catch (err) {
      console.error("[campanha] Erro ao buscar itens:", err)
    } finally {
      setLoadingItens(false)
    }
  }

  function addItem() {
    setItens((prev) => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, updates: Partial<CampanhaItem>) {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    )
  }

  function handleProcedimentoSelect(index: number, procedimentoId: string) {
    const proc = procedimentos.find((p) => p.id === Number(procedimentoId))
    if (proc) {
      updateItem(index, { procedimento_id: proc.id, procedimento_nome: proc.nome })
    }
  }

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("Informe o nome da campanha.")
      return
    }
    if (!dataInicio || !dataFim) {
      toast.error("Informe as datas de inicio e fim.")
      return
    }
    if (new Date(dataFim) < new Date(dataInicio)) {
      toast.error("Data fim deve ser igual ou posterior a data inicio.")
      return
    }

    setSaving(true)
    try {
      const supabase = getSupabase()

      const campanhaData = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        aplicacao,
        ativa,
      }

      let campanhaId: number

      if (isEditing && campanha) {
        const { error } = await supabase
          .from("campanhas")
          .update(campanhaData)
          .eq("id", campanha.id)
        if (error) throw error
        campanhaId = campanha.id
      } else {
        const { data, error } = await supabase
          .from("campanhas")
          .insert(campanhaData)
          .select("id")
          .single()
        if (error) throw error
        campanhaId = data.id
      }

      // Delete old items and insert new ones
      if (isEditing && campanha) {
        const { error: deleteError } = await supabase
          .from("campanha_itens")
          .delete()
          .eq("campanha_id", campanha.id)
        if (deleteError) throw deleteError
      }

      if (itens.length > 0) {
        const itensToInsert = itens.map((item) => ({
          campanha_id: campanhaId,
          procedimento_nome: item.procedimento_nome,
          procedimento_id: item.procedimento_id,
          desconto_tipo: tipo === "desconto" ? item.desconto_tipo : null,
          desconto_valor: tipo === "desconto" ? item.desconto_valor : null,
          combo_com: tipo === "combo" ? item.combo_com : null,
          beneficio_descricao: tipo === "beneficio" ? item.beneficio_descricao : null,
        }))

        const { error: insertError } = await supabase
          .from("campanha_itens")
          .insert(itensToInsert)
        if (insertError) throw insertError
      }

      toast.success(isEditing ? "Campanha atualizada com sucesso!" : "Campanha criada com sucesso!")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      console.error("[campanha] Erro ao salvar:", err)
      toast.error("Erro ao salvar campanha. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Campanha" : "Nova Campanha"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Altere os dados da campanha e seus procedimentos."
              : "Preencha os dados para criar uma nova campanha."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="campanha-nome">Nome da campanha</Label>
            <Input
              id="campanha-nome"
              placeholder="Ex: Promocao de Verao"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          {/* Descricao */}
          <div className="space-y-2">
            <Label htmlFor="campanha-descricao">Descricao</Label>
            <Textarea
              id="campanha-descricao"
              placeholder="Descreva a campanha..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo da campanha</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as Campanha["tipo"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desconto">Desconto</SelectItem>
                <SelectItem value="combo">Combo</SelectItem>
                <SelectItem value="beneficio">Beneficio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="campanha-inicio">Data inicio</Label>
              <Input
                id="campanha-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campanha-fim">Data fim</Label>
              <Input
                id="campanha-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Aplicacao */}
          <div className="space-y-2">
            <Label>Aplicacao</Label>
            <Select value={aplicacao} onValueChange={(v) => setAplicacao(v as Campanha["aplicacao"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatica">Automatica</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ativa switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Campanha ativa</Label>
              <p className="text-xs text-muted-foreground">
                Campanhas inativas nao serao aplicadas.
              </p>
            </div>
            <Switch checked={ativa} onCheckedChange={setAtiva} />
          </div>

          <Separator />

          {/* Procedimentos da Campanha */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Procedimentos da Campanha</h4>
                <p className="text-xs text-muted-foreground">
                  Adicione os procedimentos vinculados a esta campanha.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addItem}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </div>

            {loadingItens && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Carregando itens...</span>
              </div>
            )}

            {!loadingItens && itens.length === 0 && (
              <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                Nenhum procedimento adicionado.
              </div>
            )}

            <div className="space-y-3">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3 space-y-3 bg-muted/30 animate-fade-in relative group"
                >
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remover procedimento"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Procedimento */}
                  <div className="space-y-1.5 pr-8">
                    <Label className="text-xs">Procedimento</Label>
                    {procedimentos.length > 0 ? (
                      <Select
                        value={item.procedimento_id?.toString() || ""}
                        onValueChange={(v) => handleProcedimentoSelect(index, v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o procedimento" />
                        </SelectTrigger>
                        <SelectContent>
                          {procedimentos.map((proc) => (
                            <SelectItem key={proc.id} value={proc.id.toString()}>
                              {proc.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Nome do procedimento"
                        value={item.procedimento_nome}
                        onChange={(e) => updateItem(index, { procedimento_nome: e.target.value })}
                      />
                    )}
                  </div>

                  {/* Type-specific fields */}
                  {tipo === "desconto" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tipo desconto</Label>
                        <Select
                          value={item.desconto_tipo || ""}
                          onValueChange={(v) =>
                            updateItem(index, { desconto_tipo: v as "percentual" | "valor" })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentual">Percentual (%)</SelectItem>
                            <SelectItem value="valor">Valor (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Valor</Label>
                        <Input
                          type="number"
                          min={0}
                          step={item.desconto_tipo === "percentual" ? 1 : 0.01}
                          placeholder={item.desconto_tipo === "percentual" ? "10" : "50.00"}
                          value={item.desconto_valor ?? ""}
                          onChange={(e) =>
                            updateItem(index, {
                              desconto_valor: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {tipo === "combo" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Combo com (procedimento incluso)</Label>
                      <Input
                        placeholder="Ex: Limpeza de Pele"
                        value={item.combo_com || ""}
                        onChange={(e) => updateItem(index, { combo_com: e.target.value })}
                      />
                    </div>
                  )}

                  {tipo === "beneficio" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Descricao do beneficio</Label>
                      <Input
                        placeholder="Ex: Sessao gratuita de avaliacao"
                        value={item.beneficio_descricao || ""}
                        onChange={(e) =>
                          updateItem(index, { beneficio_descricao: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="px-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Salvar Alteracoes" : "Criar Campanha"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
