"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Plus, Megaphone, CalendarDays } from "lucide-react"

export interface Campanha {
  id: number
  nome: string
  descricao: string | null
  tipo: "desconto" | "combo" | "beneficio"
  data_inicio: string
  data_fim: string
  aplicacao: "automatica" | "manual"
  ativa: boolean
  created_at: string
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

type FilterTab = "todas" | "ativas" | "encerradas" | "programadas"

const TIPO_CONFIG: Record<Campanha["tipo"], { label: string; className: string }> = {
  desconto: { label: "Desconto", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  combo: { label: "Combo", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  beneficio: { label: "Beneficio", className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20" },
}

interface CampanhaListaProps {
  onSelect: (campanha: Campanha) => void
  onNew: () => void
  refreshKey: number
}

function derivarStatus(campanha: Campanha): { label: string; dotClass: string } {
  if (!campanha.ativa) {
    return { label: "Inativa", dotClass: "bg-red-500" }
  }
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicio = new Date(campanha.data_inicio + "T00:00:00")
  const fim = new Date(campanha.data_fim + "T00:00:00")

  if (hoje < inicio) {
    return { label: "Programada", dotClass: "bg-yellow-500" }
  }
  if (hoje > fim) {
    return { label: "Encerrada", dotClass: "bg-gray-400" }
  }
  return { label: "Ativa", dotClass: "bg-emerald-500" }
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function CampanhaLista({ onSelect, onNew, refreshKey }: CampanhaListaProps) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>("todas")

  useEffect(() => {
    fetchCampanhas()
  }, [refreshKey])

  async function fetchCampanhas() {
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCampanhas((data as Campanha[]) || [])
    } catch (err) {
      console.error("[campanha] Erro ao buscar campanhas:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = campanhas.filter((c) => {
    if (filter === "todas") return true
    const status = derivarStatus(c)
    if (filter === "ativas") return status.label === "Ativa"
    if (filter === "encerradas") return status.label === "Encerrada"
    if (filter === "programadas") return status.label === "Programada"
    return true
  })

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header with filter tabs and button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="ativas">Ativas</TabsTrigger>
            <TabsTrigger value="encerradas">Encerradas</TabsTrigger>
            <TabsTrigger value="programadas">Programadas</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={onNew}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Empty className="mt-8 border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Megaphone className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>
              {filter === "todas"
                ? "Nenhuma campanha cadastrada"
                : `Nenhuma campanha ${filter === "ativas" ? "ativa" : filter === "encerradas" ? "encerrada" : "programada"}`}
            </EmptyTitle>
            <EmptyDescription>
              {filter === "todas"
                ? "Crie sua primeira campanha para oferecer descontos, combos ou beneficios aos pacientes."
                : "Tente mudar o filtro ou crie uma nova campanha."}
            </EmptyDescription>
          </EmptyHeader>
          {filter === "todas" && (
            <Button onClick={onNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Campanha
            </Button>
          )}
        </Empty>
      )}

      {/* Campaign grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((campanha, index) => {
            const status = derivarStatus(campanha)
            const tipoConfig = TIPO_CONFIG[campanha.tipo]

            return (
              <Card
                key={campanha.id}
                className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-slide-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onSelect(campanha)}
              >
                <div className="space-y-3">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {campanha.nome}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
                      <span className="text-xs text-muted-foreground">{status.label}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {campanha.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{campanha.descricao}</p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={tipoConfig.className}>
                      {tipoConfig.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {campanha.aplicacao === "automatica" ? "Automatica" : "Manual"}
                    </Badge>
                  </div>

                  {/* Period */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{formatDate(campanha.data_inicio)} &rarr; {formatDate(campanha.data_fim)}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
