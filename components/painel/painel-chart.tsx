// components/painel/painel-chart.tsx
"use client"

import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

export interface MesData {
  mes: string
  recebido: number | null
  previsao: number | null
}

function formatCurrencyAxis(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return `R$ ${value}`
}

function formatCurrencyTooltip(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function PainelChart({ dados }: { dados: MesData[] }) {
  const mesAtual = new Date().getMonth()
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

  const chartData = dados.map((d, idx) => ({
    mes: d.mes,
    valor: d.recebido ?? d.previsao ?? 0,
    tipo: idx < mesAtual ? "recebido" : idx === mesAtual ? "atual" : "previsao",
  }))

  return (
    <Card className="p-5 bg-white border border-border rounded-xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Receita Mensal</p>
          <p className="text-xs text-muted-foreground">Recebido vs Previsão — {new Date().getFullYear()}</p>
        </div>
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-foreground rounded-sm" />
            Recebido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-muted-foreground/20 rounded-sm" />
            Previsão
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={({ x, y, payload }) => {
              const idx = MESES.indexOf(payload.value)
              const isAtual = idx === mesAtual
              return (
                <text
                  x={x}
                  y={y + 12}
                  textAnchor="middle"
                  fontSize={11}
                  fill={isAtual ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  fontWeight={isAtual ? 600 : 400}
                >
                  {payload.value}
                </text>
              )
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrencyAxis}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrencyTooltip(value), "Valor"]}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  entry.tipo === "recebido"
                    ? "hsl(var(--foreground))"
                    : entry.tipo === "atual"
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground) / 0.2)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
