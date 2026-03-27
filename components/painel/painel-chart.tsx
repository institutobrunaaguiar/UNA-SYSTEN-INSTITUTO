// components/painel/painel-chart.tsx
"use client"

import { Card } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

export interface MesData {
  mes: string
  recebido: number | null
  previsao: number | null
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function formatCurrency(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return `R$ ${value}`
}

export function PainelChart({ dados }: { dados: MesData[] }) {
  const mesAtual = new Date().getMonth() // 0-indexed
  const labelMesAtual = MESES[mesAtual]

  return (
    <Card className="p-4 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Jornada do Caixa — {new Date().getFullYear()}</p>
          <p className="text-xs text-muted-foreground">Receita recebida · meses futuros = previsão</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-indigo-500 rounded" />
            Recebido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-indigo-400 opacity-50 rounded border-t border-dashed border-indigo-400" />
            Previsão
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={dados} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRecebido" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPrevisao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
            }
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
          />
          <ReferenceLine x={labelMesAtual} stroke="hsl(var(--warning, #f59e0b))" strokeDasharray="4 3" label={{ value: "hoje", fontSize: 10, fill: "#f59e0b", position: "top" }} />
          <Area type="monotone" dataKey="recebido" stroke="#6366f1" strokeWidth={2} fill="url(#gradRecebido)" connectNulls={false} dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="previsao" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="5 4" fill="url(#gradPrevisao)" connectNulls={false} dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
