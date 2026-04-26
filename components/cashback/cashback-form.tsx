"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Search, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { CashbackCampanha } from "./cashback-lista"

interface CashbackFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campanha: CashbackCampanha | null
  onSaved: () => void
}

export function CashbackForm({ open, onOpenChange, campanha, onSaved }: CashbackFormProps) {
  const isEditing = !!campanha

  const [nome, setNome] = useState("")
  const [percentual, setPercentual] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [ativa, setAtiva] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exclusivo, setExclusivo] = useState(false)
  const [pacientes, setPacientes] = useState<{ id: number; nome: string; cpf_cnpj: string | null }[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [buscaPaciente, setBuscaPaciente] = useState("")
  const [loadingPacientes, setLoadingPacientes] = useState(false)

  useEffect(() => {
    if (!open) return

    async function init() {
      if (campanha) {
        setNome(campanha.nome)
        setPercentual(String(campanha.percentual))
        setDataInicio(campanha.data_inicio)
        setDataFim(campanha.data_fim)
        setAtiva(campanha.ativa)
        setExclusivo(campanha.exclusivo)
      } else {
        setNome("")
        setPercentual("")
        setDataInicio("")
        setDataFim("")
        setAtiva(true)
        setExclusivo(false)
        setSelectedIds(new Set())
      }
      setBuscaPaciente("")

      setSelectedIds(new Set())
      setLoadingPacientes(true)
      try {
        const supabase = getSupabase()
        const { data: pacs } = await supabase
          .from("pacientes")
          .select("id, nome, cpf_cnpj")
          .order("nome")
          .range(0, 9999)
        setPacientes(pacs ?? [])

        if (campanha?.exclusivo) {
          const { data: vinculos } = await supabase
            .from("cashback_campanha_clientes")
            .select("paciente_id")
            .eq("campanha_id", campanha.id)
          setSelectedIds(new Set((vinculos ?? []).map((v) => v.paciente_id)))
        }
      } finally {
        setLoadingPacientes(false)
      }
    }

    init()
  }, [open, campanha])

  async function handleSave() {
    if (!nome.trim() || !percentual || Number(percentual) <= 0 || !dataInicio || !dataFim) {
      toast.error("Preencha todos os campos corretamente.")
      return
    }
    if (dataFim < dataInicio) {
      toast.error("A data fim deve ser posterior à data início.")
      return
    }
    if (exclusivo && selectedIds.size === 0) {
      toast.error("Selecione ao menos um cliente para a campanha exclusiva.")
      return
    }

    setSaving(true)
    try {
      const supabase = getSupabase()
      const payload = {
        nome: nome.trim(),
        percentual: Number(percentual),
        data_inicio: dataInicio,
        data_fim: dataFim,
        ativa,
        exclusivo,
      }

      let campanhaId: number

      if (isEditing && campanha) {
        const { error } = await supabase
          .from("cashback_campanhas")
          .update(payload)
          .eq("id", campanha.id)
        if (error) throw error
        campanhaId = campanha.id
      } else {
        const { data, error } = await supabase
          .from("cashback_campanhas")
          .insert(payload)
          .select("id")
          .single()
        if (error) throw error
        campanhaId = data.id
      }

      const { error: errDel } = await supabase
        .from("cashback_campanha_clientes")
        .delete()
        .eq("campanha_id", campanhaId)
      if (errDel) throw errDel

      if (exclusivo && selectedIds.size > 0) {
        const { error: errVinculos } = await supabase
          .from("cashback_campanha_clientes")
          .insert([...selectedIds].map((paciente_id) => ({ campanha_id: campanhaId, paciente_id })))
        if (errVinculos) throw errVinculos
      }

      toast.success("Campanha salva!")
      onSaved()
      onOpenChange(false)
    } catch (err) {
      console.error("[cashback] Erro ao salvar:", err)
      toast.error("Erro ao salvar campanha")
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
              ? "Altere os dados da campanha de cashback."
              : "Preencha os dados para criar uma nova campanha de cashback."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 px-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="cashback-nome">Nome da campanha</Label>
            <Input
              id="cashback-nome"
              placeholder="Nome da campanha"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          {/* Percentual */}
          <div className="space-y-2">
            <Label htmlFor="cashback-percentual">Percentual de cashback (%)</Label>
            <Input
              id="cashback-percentual"
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              placeholder="Ex: 5"
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cashback-inicio">Data inicio</Label>
              <Input
                id="cashback-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashback-fim">Data fim</Label>
              <Input
                id="cashback-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Ativa */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Campanha ativa</Label>
              <p className="text-xs text-muted-foreground">
                Campanhas inativas nao serao aplicadas.
              </p>
            </div>
            <Switch checked={ativa} onCheckedChange={setAtiva} />
          </div>

          {/* Exclusivo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Campanha Exclusiva</Label>
              <p className="text-xs text-muted-foreground">
                Restringir esta campanha a clientes selecionados.
              </p>
            </div>
            <Switch checked={exclusivo} onCheckedChange={setExclusivo} />
          </div>

          {/* Seleção de clientes */}
          {exclusivo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Clientes elegíveis
                </Label>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} de {pacientes.length} selecionados
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={buscaPaciente}
                  onChange={(e) => setBuscaPaciente(e.target.value)}
                  className="pl-9 text-sm h-9"
                />
              </div>

              {loadingPacientes ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-y-auto max-h-56 divide-y divide-border">
                  {pacientes
                    .filter((p) => {
                      const q = buscaPaciente.toLowerCase()
                      return (
                        p.nome.toLowerCase().includes(q) ||
                        (p.cpf_cnpj ?? "").toLowerCase().includes(q)
                      )
                    })
                    .map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev)
                              if (checked) next.add(p.id)
                              else next.delete(p.id)
                              return next
                            })
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                          {p.cpf_cnpj && (
                            <p className="text-[11px] text-muted-foreground">{p.cpf_cnpj}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  {pacientes.filter((p) => {
                    const q = buscaPaciente.toLowerCase()
                    return p.nome.toLowerCase().includes(q) || (p.cpf_cnpj ?? "").toLowerCase().includes(q)
                  }).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum cliente encontrado.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="px-4 mt-6">
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
              Salvar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
