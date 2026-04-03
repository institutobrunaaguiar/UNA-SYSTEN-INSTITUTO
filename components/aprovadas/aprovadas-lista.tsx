import { Card } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"
import type { Proposta } from "@/components/propostas/types"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function AprovadasLista({ propostas }: { propostas: Proposta[] }) {
  if (propostas.length === 0) {
    return (
      <Card className="p-8 text-center bg-white border border-border rounded-xl">
        <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhuma proposta aprovada encontrada para os filtros selecionados.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {propostas.map((p) => {
        const profissional = p.itens.length > 0 ? p.itens[0].profissionalNome : "—"
        const procedimentosTexto = p.itens.map((i) => i.procedimentoNome).join(", ")

        return (
          <Card key={p.id} className="p-4 bg-white border border-border rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">#{p.id}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">
                    Aprovada
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{p.nome_cliente}</p>
                {p.cpf_cliente && (
                  <p className="text-[10px] text-muted-foreground">{p.cpf_cliente}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate">{procedimentosTexto || "Sem procedimentos"}</p>
              </div>

              <div className="text-right ml-4 shrink-0">
                <p className="text-sm font-bold text-foreground">{formatCurrency(p.valor_total)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{profissional}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
              <span>Proposta: {formatDate(p.data_proposta)}</span>
              <span>Aprovada: {formatDate(p.validado_em)}</span>
            </div>
          </Card>
        )
      })}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Mostrando {propostas.length} {propostas.length === 1 ? "proposta" : "propostas"}
      </p>
    </div>
  )
}
