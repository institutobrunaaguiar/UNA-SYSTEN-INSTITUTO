// components/painel/painel-kpis.tsx
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface PainelKpisData {
  recebidoMes: number
  recebidoMesAnterior: number
  aReceber: number
  aReceberCount: number
  ticketMedio: number
  totalPropostasPagas: number
  conversao: number
  propostasMes: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  const abs = Math.abs(pct).toFixed(0)
  if (pct > 0)
    return (
      <span className="flex items-center gap-0.5 text-green-500 text-[11px]">
        <TrendingUp className="w-3 h-3" />+{abs}% vs mês ant.
      </span>
    )
  if (pct < 0)
    return (
      <span className="flex items-center gap-0.5 text-red-500 text-[11px]">
        <TrendingDown className="w-3 h-3" />-{abs}% vs mês ant.
      </span>
    )
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground text-[11px]">
      <Minus className="w-3 h-3" />estável
    </span>
  )
}

export function PainelKpis({ data }: { data: PainelKpisData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      <Card className="p-3 sm:p-4 bg-card border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recebido (mês)</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.recebidoMes)}</p>
        <Trend current={data.recebidoMes} previous={data.recebidoMesAnterior} />
        <p className="text-[11px] text-muted-foreground mt-1">{data.totalPropostasPagas} propostas pagas</p>
      </Card>

      <Card className="p-3 sm:p-4 bg-card border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">A Receber</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.aReceber)}</p>
        <p className="text-[11px] text-blue-500 mt-1">{data.aReceberCount} aguardando</p>
      </Card>

      <Card className="p-3 sm:p-4 bg-card border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ticket Médio</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{formatCurrency(data.ticketMedio)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">propostas pagas</p>
      </Card>

      <Card className="p-3 sm:p-4 bg-card border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Conversão</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{data.conversao.toFixed(0)}%</p>
        <p className="text-[11px] text-muted-foreground mt-1">ganhas / total</p>
      </Card>

      <Card className="p-3 sm:p-4 bg-card border border-border rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Propostas (mês)</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{data.propostasMes}</p>
        <p className="text-[11px] text-muted-foreground mt-1">criadas este mês</p>
      </Card>
    </div>
  )
}
