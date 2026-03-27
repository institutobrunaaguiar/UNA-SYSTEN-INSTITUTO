"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Percent, DollarSign } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { PropostaItem, ProcedimentoClinica, Profissional } from "../types"

interface StepProcedimentosProps {
  itens: PropostaItem[]
  onChange: (itens: PropostaItem[]) => void
}

export function StepProcedimentos({ itens, onChange }: StepProcedimentosProps) {
  const [procedimentos, setProcedimentos] = useState<ProcedimentoClinica[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const supabase = getSupabase()
        const [procRes, profRes] = await Promise.all([
          supabase
            .from("procedimentos_clinica")
            .select("*")
            .eq("ativo", true)
            .order("relevante", { ascending: false })
            .order("tipo")
            .order("nome"),
          supabase.from("profissionais").select("*").eq("ativo", true).order("nome"),
        ])
        if (procRes.data) setProcedimentos(procRes.data as ProcedimentoClinica[])
        if (profRes.data) setProfissionais(profRes.data as Profissional[])
      } catch (error) {
        console.error("[propostas] Erro ao carregar procedimentos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function addItem() {
    onChange([
      ...itens,
      {
        procedimentoId: "",
        procedimentoNome: "",
        profissionalId: null,
        profissionalNome: "",
        valor: 0,
        desconto_tipo: null,
        desconto_valor: null,
        valor_final: 0,
      },
    ])
  }

  function removeItem(index: number) {
    onChange(itens.filter((_, i) => i !== index))
  }

  function updateItem(index: number, updates: Partial<PropostaItem>) {
    const newItens = itens.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, ...updates }
      updated.valor_final = calcularValorFinal(updated)
      return updated
    })
    onChange(newItens)
  }

  function handleProfissionalChange(index: number, profissionalId: string) {
    const prof = profissionais.find((p) => String(p.id) === profissionalId)
    updateItem(index, {
      profissionalId: prof?.id ?? null,
      profissionalNome: prof?.nome ?? "",
      procedimentoId: "",
      procedimentoNome: "",
      valor: 0,
    })
  }

  function handleProcedimentoChange(index: number, procedimentoId: string) {
    const proc = procedimentos.find((p) => String(p.id) === procedimentoId)
    updateItem(index, {
      procedimentoId,
      procedimentoNome: proc?.nome ?? "",
      valor: proc?.valor ?? 0,
    })
  }

  function calcularValorFinal(item: PropostaItem): number {
    if (!item.desconto_tipo || !item.desconto_valor) return item.valor
    if (item.desconto_tipo === "percentual") {
      return item.valor - (item.valor * item.desconto_valor) / 100
    }
    return item.valor - item.desconto_valor
  }

  function toggleDesconto(index: number) {
    const item = itens[index]
    if (item.desconto_tipo) {
      updateItem(index, { desconto_tipo: null, desconto_valor: null })
    } else {
      updateItem(index, { desconto_tipo: "percentual", desconto_valor: 0 })
    }
  }

  function getProcsByProfissional(profissionalId: number | null): ProcedimentoClinica[] {
    if (!profissionalId) return []
    return procedimentos.filter((p) => p.profissional_id === profissionalId)
  }

  function groupByTipo(procs: ProcedimentoClinica[]): Record<string, ProcedimentoClinica[]> {
    return procs.reduce((acc, proc) => {
      if (!acc[proc.tipo]) acc[proc.tipo] = []
      acc[proc.tipo].push(proc)
      return acc
    }, {} as Record<string, ProcedimentoClinica[]>)
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {itens.map((item, index) => {
        const procsFiltrados = getProcsByProfissional(item.profissionalId)
        const grupos = groupByTipo(procsFiltrados)

        return (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Item {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeItem(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Profissional</Label>
                <Select
                  value={item.profissionalId ? String(item.profissionalId) : ""}
                  onValueChange={(value) => handleProfissionalChange(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((prof) => (
                      <SelectItem key={prof.id} value={String(prof.id)}>
                        {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Procedimento</Label>
                <Select
                  value={item.procedimentoId}
                  onValueChange={(value) => handleProcedimentoChange(index, value)}
                  disabled={!item.profissionalId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        item.profissionalId
                          ? "Selecione o procedimento"
                          : "Selecione o profissional primeiro"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(grupos).map(([tipo, procs]) => (
                      <SelectGroup key={tipo}>
                        <SelectLabel className="font-semibold text-muted-foreground">{tipo}</SelectLabel>
                        {procs.map((proc) => (
                          <SelectItem key={proc.id} value={String(proc.id)}>
                            <span>{proc.nome}</span>
                            {proc.descricao && (
                              <span className="text-muted-foreground text-xs ml-1">— {proc.descricao}</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="text-xs mb-1 block">Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.valor || ""}
                  onChange={(e) => updateItem(index, { valor: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant={item.desconto_tipo ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => toggleDesconto(index)}
                >
                  <Percent className="w-3 h-3" />
                  {item.desconto_tipo ? "Remover Desconto" : "Adicionar Desconto"}
                </Button>
              </div>
              <div className="text-right">
                <Label className="text-xs mb-1 block text-muted-foreground">Valor Final</Label>
                <p className="text-lg font-bold text-foreground">{formatCurrency(item.valor_final)}</p>
              </div>
            </div>

            {item.desconto_tipo && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={item.desconto_tipo === "percentual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateItem(index, { desconto_tipo: "percentual" })}
                  >
                    <Percent className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant={item.desconto_tipo === "valor" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateItem(index, { desconto_tipo: "valor" })}
                  >
                    <DollarSign className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-28"
                  value={item.desconto_valor || ""}
                  onChange={(e) =>
                    updateItem(index, { desconto_valor: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={item.desconto_tipo === "percentual" ? "%" : "R$"}
                />
                <span className="text-xs text-muted-foreground">
                  {item.desconto_tipo === "percentual"
                    ? `- ${formatCurrency((item.valor * (item.desconto_valor || 0)) / 100)}`
                    : `- ${formatCurrency(item.desconto_valor || 0)}`}
                </span>
              </div>
            )}
          </Card>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-dashed"
        onClick={addItem}
      >
        <Plus className="w-4 h-4" />
        Adicionar Procedimento
      </Button>

      {itens.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">
            Subtotal ({itens.length} {itens.length === 1 ? "item" : "itens"})
          </span>
          <span className="text-xl font-bold text-foreground">{formatCurrency(subtotal)}</span>
        </div>
      )}
    </div>
  )
}
