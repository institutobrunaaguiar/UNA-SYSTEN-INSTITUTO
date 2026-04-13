import { Card } from "@/components/ui/card"
import { ShieldCheck, ShieldX } from "lucide-react"
import type { Proposta } from "@/components/propostas/types"
import type { TabValidacao } from "./aprovadas-content"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function AprovadasLista({ propostas, tab }: { propostas: Proposta[]; tab: TabValidacao }) {
  const isReprovadas = tab === "reprovadas"

  if (propostas.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border border-border rounded-xl">
        {isReprovadas ? (
          <ShieldX className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        ) : (
          <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        )}
        <p className="text-sm text-muted-foreground">
          Nenhuma proposta {isReprovadas ? "reprovada" : "aprovada"} encontrada para os filtros selecionados.
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
          <Card key={p.id} className="p-3 sm:p-4 bg-card border border-border rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">#{p.id}</span>
                  {isReprovadas ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Reprovada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Aprovada
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">{p.nome_cliente}</p>
                {p.cpf_cliente && (
                  <p className="text-[10px] text-muted-foreground">{p.cpf_cliente}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{procedimentosTexto || "Sem procedimentos"}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">{formatCurrency(p.valor_total)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{profissional}</p>
              </div>
            </div>

            {/* Motivo de reprovação */}
            {isReprovadas && p.validacao_motivo && (
              <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-0.5">Motivo da reprovação</p>
                <p className="text-xs text-red-800 dark:text-red-300 break-words">{p.validacao_motivo}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
              <span>Proposta: {formatDate(p.data_proposta)}</span>
              <span>{isReprovadas ? "Reprovada" : "Aprovada"}: {formatDate(p.validado_em)}</span>
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
