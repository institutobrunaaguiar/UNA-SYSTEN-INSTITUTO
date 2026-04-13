// components/painel/painel-recentes.tsx
import Link from "next/link"
import { Card } from "@/components/ui/card"
import type { PropostaRecente } from "./painel-content"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  em_negociacao: { label: "Em Negociação", className: "bg-yellow-50 text-yellow-700" },
  aguardando_pagamento: { label: "Aguardando", className: "bg-blue-50 text-blue-700" },
  pago: { label: "Pago", className: "bg-green-50 text-green-700" },
  recusada: { label: "Recusada", className: "bg-red-50 text-red-700" },
}

export function PainelRecentes({ propostas }: { propostas: PropostaRecente[] }) {
  return (
    <Card className="p-3 sm:p-5 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">Propostas Recentes</p>
        <Link href="/proposta" className="text-[11px] text-blue-500 hover:underline">
          Ver todas →
        </Link>
      </div>

      {propostas.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhuma proposta encontrada</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {propostas.map((p) => {
            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.em_negociacao
            return (
              <div key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{p.nomeCliente}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.procedimentos || "Sem procedimentos"}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-xs font-semibold text-foreground">{formatCurrency(p.valorTotal)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
