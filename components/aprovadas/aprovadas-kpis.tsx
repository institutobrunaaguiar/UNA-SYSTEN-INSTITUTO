import { Card } from "@/components/ui/card"
import type { KpisData } from "./aprovadas-content"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

export function AprovadasKpis({ data }: { data: KpisData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Aprovado</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.totalAprovado)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">no período</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Quantidade</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{data.quantidade}</p>
        <p className="text-[11px] text-muted-foreground mt-1">propostas aprovadas</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ticket Médio</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.ticketMedio)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">por proposta</p>
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Top Consultora</p>
        <p className="text-2xl font-bold text-foreground leading-tight truncate">
          {data.topConsultora ? data.topConsultora.nome.split(" ").slice(0, 2).join(" ") : "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {data.topConsultora ? formatCurrency(data.topConsultora.valor) : "sem dados"}
        </p>
      </Card>
    </div>
  )
}
