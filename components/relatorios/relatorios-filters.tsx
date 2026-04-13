"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { CalendarDays, Filter, X } from "lucide-react"

export interface RelatorioFilters {
  dataInicial: string
  dataFinal: string
  profissional: string
  procedimento: string
}

interface Profissional {
  id: number
  nome: string
}

interface Procedimento {
  id: number
  nome: string
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

interface RelatoriosFiltersProps {
  filters: RelatorioFilters
  onFiltersChange: (filters: RelatorioFilters) => void
}

export function RelatoriosFilters({ filters, onFiltersChange }: RelatoriosFiltersProps) {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOptions() {
      setLoading(true)
      const supabase = getSupabase()

      const [profRes, procRes] = await Promise.all([
        supabase
          .from("profissionais")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("procedimentos_clinica")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome"),
      ])

      if (profRes.data) setProfissionais(profRes.data)
      if (procRes.data) {
        const unique = Array.from(
          new Map(procRes.data.map((p) => [p.nome, p])).values()
        )
        setProcedimentos(unique)
      }

      setLoading(false)
    }

    fetchOptions()
  }, [])

  function handleChange(field: keyof RelatorioFilters, value: string) {
    onFiltersChange({ ...filters, [field]: value })
  }

  function handleClear() {
    onFiltersChange({
      dataInicial: "",
      dataFinal: "",
      profissional: "",
      procedimento: "",
    })
  }

  const hasActiveFilters =
    filters.dataInicial || filters.dataFinal || filters.profissional || filters.procedimento

  return (
    <Card className="p-3 sm:p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-primary/10 rounded-full">
          <Filter className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="ml-auto h-7 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" />
            Data Inicial
          </label>
          <Input
            type="date"
            value={filters.dataInicial}
            onChange={(e) => handleChange("dataInicial", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" />
            Data Final
          </label>
          <Input
            type="date"
            value={filters.dataFinal}
            onChange={(e) => handleChange("dataFinal", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Profissional</label>
          <Select
            value={filters.profissional}
            onValueChange={(value) => handleChange("profissional", value === "__all__" ? "" : value)}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder={loading ? "Carregando..." : "Todos"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {profissionais.map((p) => (
                <SelectItem key={p.id} value={p.nome}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Procedimento</label>
          <Select
            value={filters.procedimento}
            onValueChange={(value) => handleChange("procedimento", value === "__all__" ? "" : value)}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder={loading ? "Carregando..." : "Todos"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {procedimentos.map((p) => (
                <SelectItem key={p.id} value={p.nome}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}
