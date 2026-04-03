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
      countColor: "text-green-500",
    },
    {
      label: "Em Aberto",
      count: data.emAberto.count,
      valor: data.emAberto.valor,
      pct: total > 0 ? (data.emAberto.valor / total) * 100 : 0,
      barColor: "bg-blue-500",
      countColor: "text-blue-500",
    },
    {
      label: "Perdidas",
      count: data.perdidas.count,
      valor: data.perdidas.valor,
      pct: total > 0 ? (data.perdidas.valor / total) * 100 : 0,
      barColor: "bg-red-500",
      countColor: "text-red-500",
    },
  ]

  return (
    <Card className="p-5 bg-white border border-border rounded-xl">
      <p className="text-sm font-semibold text-foreground mb-4">Pipeline</p>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(item.valor)}{" "}
                <span className={`font-normal ${item.countColor}`}>{item.count}</span>
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                style={{ width: `${Math.max(item.pct, 1)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
