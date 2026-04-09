"use client"

import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export interface CashbackCampanha {
  id: number
  nome: string
  percentual: number
  data_inicio: string
  data_fim: string
  ativa: boolean
  created_at: string
}

interface CashbackListaProps {
  campanhas: CashbackCampanha[]
  onEditar: (campanha: CashbackCampanha) => void
  onToggleAtiva: (id: number, ativa: boolean) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR")
}

function derivarStatus(campanha: CashbackCampanha) {
  if (!campanha.ativa) {
    return { label: "Inativa", className: "bg-red-50 text-red-700" }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inicio = new Date(campanha.data_inicio + "T12:00:00")
  const fim = new Date(campanha.data_fim + "T12:00:00")

  if (today < inicio) {
    return { label: "Programada", className: "bg-blue-50 text-blue-700" }
  }
  if (today > fim) {
    return { label: "Encerrada", className: "bg-gray-100 text-gray-600" }
  }
  return { label: "Ativa", className: "bg-green-50 text-green-700" }
}

export function CashbackLista({ campanhas, onEditar, onToggleAtiva }: CashbackListaProps) {
  if (campanhas.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Nenhuma campanha de cashback cadastrada.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {campanhas.map((campanha) => {
        const status = derivarStatus(campanha)

        return (
          <div
            key={campanha.id}
            className="border border-border rounded-xl bg-white p-4 space-y-3"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-foreground leading-tight">
                {campanha.nome}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            {/* Percentual */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">{campanha.percentual}%</span>
              <span className="text-xs text-muted-foreground">cashback</span>
            </div>

            {/* Period */}
            <p className="text-xs text-muted-foreground">
              {formatDate(campanha.data_inicio)} &rarr; {formatDate(campanha.data_fim)}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Switch
                  checked={campanha.ativa}
                  onCheckedChange={(checked) => onToggleAtiva(campanha.id, checked)}
                />
                <span className="text-xs text-muted-foreground">
                  {campanha.ativa ? "Ativa" : "Inativa"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditar(campanha)}
              >
                Editar
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
