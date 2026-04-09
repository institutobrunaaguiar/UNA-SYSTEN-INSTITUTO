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
import { Loader2 } from "lucide-react"
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

  useEffect(() => {
    if (open) {
      if (campanha) {
        setNome(campanha.nome)
        setPercentual(String(campanha.percentual))
        setDataInicio(campanha.data_inicio)
        setDataFim(campanha.data_fim)
        setAtiva(campanha.ativa)
      } else {
        setNome("")
        setPercentual("")
        setDataInicio("")
        setDataFim("")
        setAtiva(true)
      }
    }
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

    setSaving(true)
    try {
      const supabase = getSupabase()
      const payload = {
        nome: nome.trim(),
        percentual: Number(percentual),
        data_inicio: dataInicio,
        data_fim: dataFim,
        ativa,
      }

      if (isEditing && campanha) {
        const { error } = await supabase
          .from("cashback_campanhas")
          .update(payload)
          .eq("id", campanha.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("cashback_campanhas")
          .insert(payload)
        if (error) throw error
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
