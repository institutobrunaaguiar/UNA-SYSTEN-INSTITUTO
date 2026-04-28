"use client"

import { useEffect, useState, useMemo } from "react"
import { getSupabase } from "@/lib/supabase/client"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Loader2,
  Search,
  Users,
  ArrowLeft,
  Percent,
  Calendar,
  Tag,
  CheckCircle2,
  X,
} from "lucide-react"
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
        const PAGE = 1000
        let all: { id: number; nome: string; cpf_cnpj: string | null }[] = []
        let from = 0
        while (true) {
          const { data: page } = await supabase
            .from("pacientes")
            .select("id, nome, cpf_cnpj")
            .order("nome")
            .range(from, from + PAGE - 1)
          if (!page || page.length === 0) break
          all = all.concat(page)
          if (page.length < PAGE) break
          from += PAGE
        }
        setPacientes(all)

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

  const pacientesFiltrados = useMemo(() => {
    const q = buscaPaciente.trim().toLowerCase()
    if (!q) return pacientes
    return pacientes.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.cpf_cnpj ?? "").toLowerCase().includes(q)
    )
  }, [pacientes, buscaPaciente])

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const visibleIds = pacientesFiltrados.map((p) => p.id)
      const allSelected = visibleIds.every((id) => prev.has(id))
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

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

  const todosVisiveisSelecionados =
    pacientesFiltrados.length > 0 &&
    pacientesFiltrados.every((p) => selectedIds.has(p.id))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col"
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground transition-colors mr-1"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-muted-foreground">
              {isEditing ? `Campanha #${campanha?.id}` : "Nova Campanha"}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xl font-bold text-foreground leading-tight truncate">
            {nome.trim() || (isEditing ? "Editar Campanha" : "Criar Campanha")}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing
              ? "Altere os dados da campanha de cashback."
              : "Preencha os dados para criar uma nova campanha."}
          </p>
        </div>

        {/* Conteúdo scrollável */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        >
          {/* Identificação */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="w-4 h-4 text-primary" />
              Identificação
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashback-nome" className="text-xs">
                Nome da campanha
              </Label>
              <Input
                id="cashback-nome"
                placeholder="Ex: Mês das Mães"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </section>

          {/* Percentual */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Percent className="w-4 h-4 text-primary" />
              Percentual de cashback
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashback-percentual" className="text-xs">
                Percentual (%)
              </Label>
              <div className="relative">
                <Input
                  id="cashback-percentual"
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  max={100}
                  step={0.01}
                  placeholder="Ex: 5"
                  value={percentual}
                  onChange={(e) => setPercentual(e.target.value)}
                  className="h-11 text-base pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </section>

          {/* Vigência */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              Vigência
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cashback-inicio" className="text-xs">
                  Início
                </Label>
                <Input
                  id="cashback-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashback-fim" className="text-xs">
                  Fim
                </Label>
                <Input
                  id="cashback-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
            </div>
          </section>

          {/* Configurações */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Configurações
            </div>

            <label
              htmlFor="cashback-ativa"
              className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="space-y-0.5 pr-3">
                <p className="text-sm font-medium text-foreground">Campanha ativa</p>
                <p className="text-xs text-muted-foreground">
                  Campanhas inativas não serão aplicadas.
                </p>
              </div>
              <Switch id="cashback-ativa" checked={ativa} onCheckedChange={setAtiva} />
            </label>

            <label
              htmlFor="cashback-exclusiva"
              className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="space-y-0.5 pr-3">
                <p className="text-sm font-medium text-foreground">Campanha exclusiva</p>
                <p className="text-xs text-muted-foreground">
                  Restringir esta campanha a clientes selecionados.
                </p>
              </div>
              <Switch
                id="cashback-exclusiva"
                checked={exclusivo}
                onCheckedChange={setExclusivo}
              />
            </label>
          </section>

          {/* Seleção de clientes */}
          {exclusivo && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  Clientes elegíveis
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {selectedIds.size} de {pacientes.length}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={buscaPaciente}
                  onChange={(e) => setBuscaPaciente(e.target.value)}
                  className="pl-9 h-11 text-base"
                />
              </div>

              {pacientesFiltrados.length > 0 && (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={toggleAllVisible}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {todosVisiveisSelecionados
                      ? "Desmarcar todos"
                      : `Selecionar todos (${pacientesFiltrados.length})`}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>
              )}

              {loadingPacientes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-y-auto max-h-72 divide-y divide-border">
                    {pacientesFiltrados.map((p) => {
                      const checked = selectedIds.has(p.id)
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                            checked ? "bg-primary/5" : "hover:bg-muted/40"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev)
                                if (c) next.add(p.id)
                                else next.delete(p.id)
                                return next
                              })
                            }}
                            className="h-5 w-5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {p.nome}
                            </p>
                            {p.cpf_cnpj && (
                              <p className="text-xs text-muted-foreground truncate">
                                {p.cpf_cnpj}
                              </p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                    {pacientesFiltrados.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Nenhum cliente encontrado.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer sticky */}
        <div
          className="sticky bottom-0 z-10 bg-card border-t border-border px-4 sm:px-6 py-3 shrink-0"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Salvar alterações" : "Criar campanha"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
