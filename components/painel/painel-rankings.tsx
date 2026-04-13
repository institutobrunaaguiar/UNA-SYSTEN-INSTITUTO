// components/painel/painel-rankings.tsx
import { Card } from "@/components/ui/card"
import type { RankingProfissional, RankingProcedimento } from "./painel-content"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

interface PainelRankingsProps {
  profissionais: RankingProfissional[]
  procedimentos: RankingProcedimento[]
}

export function PainelRankings({ profissionais, procedimentos }: PainelRankingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 bg-white border border-border rounded-xl flex-1">
        <p className="text-[13px] font-semibold text-foreground mb-3">Top Profissionais</p>
        {profissionais.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profissionais.map((prof) => (
              <div key={prof.nome} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
                    {prof.iniciais}
                  </div>
                  <span className="text-xs text-foreground">{prof.nome.split(" ").slice(0, 2).join(" ")}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{formatCurrency(prof.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-white border border-border rounded-xl flex-1">
        <p className="text-[13px] font-semibold text-foreground mb-3">Top Procedimentos</p>
        {procedimentos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
        ) : (
          <div className="flex flex-col gap-3">
            {procedimentos.map((proc) => (
              <div key={proc.nome} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{proc.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {proc.count}x
                  </span>
                  <span className="text-xs font-semibold text-foreground">{formatCurrency(proc.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
