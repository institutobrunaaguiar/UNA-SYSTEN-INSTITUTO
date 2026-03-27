// components/painel/painel-pipeline.tsx
import { Card } from "@/components/ui/card"

export interface PainelPipelineData {
  ganhas: { count: number; valor: number }
  emAberto: { count: number; valor: number }
  perdidas: { count: number; valor: number }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

export function PainelPipeline({ data }: { data: PainelPipelineData }) {
  const total = data.ganhas.valor + data.emAberto.valor + data.perdidas.valor

  const items = [
    {
      label: "Ganhas",
      count: data.ganhas.count,
      valor: data.ganhas.valor,
      pct: total > 0 ? (data.ganhas.valor / total) * 100 : 0,
      barColor: "bg-green-500",
      textColor: "text-green-500",
      badgeBg: "bg-green-500/10",
      badgeText: "text-green-500",
    },
    {
      label: "Em Aberto",
      count: data.emAberto.count,
      valor: data.emAberto.valor,
      pct: total > 0 ? (data.emAberto.valor / total) * 100 : 0,
      barColor: "bg-blue-400",
      textColor: "text-blue-400",
      badgeBg: "bg-blue-400/10",
      badgeText: "text-blue-400",
      sub: "Em negociação + aguardando",
    },
    {
      label: "Perdidas",
      count: data.perdidas.count,
      valor: data.perdidas.valor,
      pct: total > 0 ? (data.perdidas.valor / total) * 100 : 0,
      barColor: "bg-destructive",
      textColor: "text-destructive",
      badgeBg: "bg-destructive/10",
      badgeText: "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.badgeBg} ${item.badgeText}`}>
              {item.count} proposta{item.count !== 1 ? "s" : ""}
            </span>
          </div>
          <p className={`text-lg font-bold mb-2 ${item.textColor}`}>{formatCurrency(item.valor)}</p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full ${item.barColor} transition-all duration-500`} style={{ width: `${item.pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground">{item.sub ?? `${item.pct.toFixed(0)}% do total`}</p>
        </Card>
      ))}
    </div>
  )
}
