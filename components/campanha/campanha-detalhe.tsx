"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Pencil,
  CalendarDays,
  Tag,
  Megaphone,
  Zap,
  Clock,
  Power,
  PowerOff,
  Percent,
  DollarSign,
  Package,
  Gift,
  Loader2,
} from "lucide-react"
import type { Campanha } from "./campanha-lista"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

interface CampanhaItem {
  id: number
  procedimento_nome: string
  procedimento_id: number | null
  desconto_tipo: string | null
  desconto_valor: number | null
  combo_com: string | null
  beneficio_descricao: string | null
}

interface CampanhaDetalheProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campanha: Campanha | null
  onEdit: () => void
}

const TIPO_CONFIG: Record<Campanha["tipo"], { label: string; className: string; icon: React.ReactNode }> = {
  desconto: {
    label: "Desconto",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    icon: <Percent className="w-4 h-4" />,
  },
  combo: {
    label: "Combo",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
    icon: <Package className="w-4 h-4" />,
  },
  beneficio: {
    label: "Beneficio",
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20",
    icon: <Gift className="w-4 h-4" />,
  },
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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CampanhaDetalhe({ open, onOpenChange, campanha, onEdit }: CampanhaDetalheProps) {
  const [itens, setItens] = useState<CampanhaItem[]>([])
  const [loadingItens, setLoadingItens] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [currentAtiva, setCurrentAtiva] = useState(false)

  useEffect(() => {
    if (open && campanha) {
      setCurrentAtiva(campanha.ativa)
      fetchItens(campanha.id)
    } else {
      setItens([])
    }
  }, [open, campanha])

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
      setItens((data as CampanhaItem[]) || [])
    } catch (err) {
      console.error("[campanha] Erro ao buscar itens:", err)
    } finally {
      setLoadingItens(false)
    }
  }

  async function handleToggleAtiva() {
    if (!campanha) return
    setToggling(true)
    try {
      const supabase = getSupabase()
      const newAtiva = !currentAtiva
      const { error } = await supabase
        .from("campanhas")
        .update({ ativa: newAtiva })
        .eq("id", campanha.id)

      if (error) throw error
      setCurrentAtiva(newAtiva)
      toast.success(newAtiva ? "Campanha ativada!" : "Campanha desativada!")
    } catch (err) {
      console.error("[campanha] Erro ao alterar status:", err)
      toast.error("Erro ao alterar status da campanha.")
    } finally {
      setToggling(false)
    }
  }

  if (!campanha) return null

  const status = derivarStatus({ ...campanha, ativa: currentAtiva })
  const tipoConfig = TIPO_CONFIG[campanha.tipo]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-primary" />
            {campanha.nome}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          {/* Status + Tipo badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${status.dotClass}`} />
              <span className="text-sm font-medium">{status.label}</span>
            </div>
            <Badge variant="outline" className={tipoConfig.className}>
              {tipoConfig.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {campanha.aplicacao === "automatica" ? "Automatica" : "Manual"}
            </Badge>
          </div>

          {/* Descricao */}
          {campanha.descricao && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Tag className="w-4 h-4 text-primary" />
                Descricao
              </div>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                {campanha.descricao}
              </p>
            </div>
          )}

          {/* Periodo */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="w-4 h-4 text-primary" />
              Periodo
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm pl-6">
              <div>
                <p className="text-muted-foreground">Inicio</p>
                <p className="font-medium">{formatDate(campanha.data_inicio)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fim</p>
                <p className="font-medium">{formatDate(campanha.data_fim)}</p>
              </div>
            </div>
          </div>

          {/* Aplicacao */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Zap className="w-4 h-4 text-primary" />
              Aplicacao
            </div>
            <p className="text-sm pl-6">
              {campanha.aplicacao === "automatica"
                ? "Aplicada automaticamente nas propostas"
                : "Aplicacao manual pelo operador"}
            </p>
          </div>

          <Separator />

          {/* Procedimentos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {tipoConfig.icon}
              <span className="text-primary">{" "}</span>
              Procedimentos ({loadingItens ? "..." : itens.length})
            </div>

            {loadingItens && (
              <div className="pl-6 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!loadingItens && itens.length === 0 && (
              <div className="pl-6 text-sm text-muted-foreground">
                Nenhum procedimento vinculado a esta campanha.
              </div>
            )}

            {!loadingItens && itens.length > 0 && (
              <div className="pl-6 space-y-2">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-lg p-3 bg-muted/30 space-y-1"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {item.procedimento_nome}
                    </p>

                    {/* Desconto details */}
                    {campanha.tipo === "desconto" && item.desconto_tipo && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.desconto_tipo === "percentual" ? (
                          <Percent className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span>
                          {item.desconto_tipo === "percentual"
                            ? `${item.desconto_valor}% de desconto`
                            : `R$ ${item.desconto_valor?.toFixed(2)} de desconto`}
                        </span>
                      </div>
                    )}

                    {/* Combo details */}
                    {campanha.tipo === "combo" && item.combo_com && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Package className="w-3.5 h-3.5 text-blue-500" />
                        <span>Combo com: {item.combo_com}</span>
                      </div>
                    )}

                    {/* Beneficio details */}
                    {campanha.tipo === "beneficio" && item.beneficio_descricao && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Gift className="w-3.5 h-3.5 text-purple-500" />
                        <span>{item.beneficio_descricao}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Criado em: {formatDateTime(campanha.created_at)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                onOpenChange(false)
                onEdit()
              }}
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
            <Button
              variant={currentAtiva ? "destructive" : "default"}
              className="flex-1 gap-2"
              onClick={handleToggleAtiva}
              disabled={toggling}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentAtiva ? (
                <PowerOff className="w-4 h-4" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              {currentAtiva ? "Desativar" : "Ativar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
