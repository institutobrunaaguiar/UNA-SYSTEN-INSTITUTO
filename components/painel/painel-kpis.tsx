// components/painel/painel-kpis.tsx
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface PainelKpisData {
  recebidoMes: number
  recebidoMesAnterior: number
  aReceber: number
  aReceberCount: number
  ticketMedio: number
  totalPropostas: number
  conversao: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  const abs = Math.abs(pct).toFixed(0)
  if (pct > 0) return <span className="flex items-center gap-0.5 text-green-500 text-xs"><TrendingUp className="w-3 h-3" />+{abs}% vs mês ant.</span>
  if (pct < 0) return <span className="flex items-center gap-0.5 text-destructive text-xs"><TrendingDown className="w-3 h-3" />-{abs}% vs mês ant.</span>
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="w-3 h-3" />estável</span>
}

export function PainelKpis({ data }: { data: PainelKpisData }) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recebido (mês)</p>
        <p className="text-2xl font-extrabold text-green-500 leading-tight">{formatCurrency(data.recebidoMes)}</p>
        <Trend current={data.recebidoMes} previous={data.recebidoMesAnterior} />
        <p className="text-[10px] text-muted-foreground mt-1">{data.totalPropostas} propostas pagas</p>
      </Card>

      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">A Receber</p>
        <p className="text-2xl font-extrabold text-blue-400 leading-tight">{formatCurrency(data.aReceber)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{data.aReceberCount} aguardando pagamento</p>
      </Card>

      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ticket Médio</p>
        <p className="text-2xl font-extrabold text-foreground leading-tight">{formatCurrency(data.ticketMedio)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">propostas pagas</p>
      </Card>

      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Conversão</p>
        <p className="text-2xl font-extrabold text-foreground leading-tight">{data.conversao.toFixed(0)}%</p>
        <p className="text-[10px] text-muted-foreground mt-1">ganhas / (total − perdidas)</p>
      </Card>
    </div>
  )
}
