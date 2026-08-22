"use client"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarDays, ChevronDown } from "lucide-react"

const MESES_LABEL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export interface OpcaoMes {
  /** Chave no formato "YYYY-MM" */
  value: string
  label: string
  count: number
}

/** Monta a lista de meses a partir de duas fontes: o universo de meses que
 *  deve sempre aparecer no filtro e os itens que alimentam a contagem. */
export function montarOpcoesMeses(
  universo: (string | null | undefined)[],
  itensContados: (string | null | undefined)[]
): OpcaoMes[] {
  const contagem = new Map<string, number>()
  universo.forEach((d) => {
    if (!d) return
    const key = d.slice(0, 7)
    if (!contagem.has(key)) contagem.set(key, 0)
  })
  itensContados.forEach((d) => {
    if (!d) return
    const key = d.slice(0, 7)
    contagem.set(key, (contagem.get(key) ?? 0) + 1)
  })
  return Array.from(contagem.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, count]) => {
      const [ano, mes] = key.split("-")
      return { value: key, label: `${MESES_LABEL[parseInt(mes) - 1]} ${ano}`, count }
    })
}

interface FiltroMesesProps {
  /** Meses selecionados ("YYYY-MM"). Lista vazia = todos os meses. */
  selecionados: string[]
  onChange: (meses: string[]) => void
  opcoes: OpcaoMes[]
  className?: string
}

/**
 * Filtro de meses com multi-selecao. Nenhum mes marcado significa
 * "todos os meses" — o menu nao fecha a cada clique.
 */
export function FiltroMeses({
  selecionados,
  onChange,
  opcoes,
  className = "w-full sm:w-[220px] shrink-0",
}: FiltroMesesProps) {
  const ativo = selecionados.length > 0

  function toggle(mes: string) {
    onChange(selecionados.includes(mes) ? selecionados.filter((m) => m !== mes) : [...selecionados, mes])
  }

  const label = (() => {
    if (selecionados.length === 0) return "Todos os meses"
    if (selecionados.length === 1) {
      return opcoes.find((m) => m.value === selecionados[0])?.label ?? "1 mês"
    }
    return `${selecionados.length} meses selecionados`
  })()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={[
            className,
            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs h-9 transition-colors",
            ativo
              ? "bg-primary/10 dark:bg-primary/15 border-primary/40 text-primary font-medium"
              : "bg-card border-border text-foreground",
          ].join(" ")}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${ativo ? "text-primary" : "text-muted-foreground"}`} />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] max-h-[320px] overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Selecione um ou mais meses
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opcoes.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">Nenhum mês disponível.</div>
        )}
        {opcoes.map((m) => (
          <DropdownMenuCheckboxItem
            key={m.value}
            checked={selecionados.includes(m.value)}
            onCheckedChange={() => toggle(m.value)}
            onSelect={(e) => e.preventDefault()}
            className="text-xs"
          >
            <span className="flex-1">{m.label}</span>
            <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">{m.count}</span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs" disabled={!ativo} onSelect={() => onChange([])}>
          Limpar seleção (ver todos)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
