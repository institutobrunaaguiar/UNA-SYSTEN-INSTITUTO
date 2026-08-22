"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Wallet } from "lucide-react"

export const VALOR_MIN_OPCOES = [
  { value: "0", label: "Todos os valores" },
  { value: "2000", label: "Acima de R$ 2 mil" },
  { value: "4000", label: "Acima de R$ 4 mil" },
  { value: "5000", label: "Acima de R$ 5 mil" },
  { value: "10000", label: "Acima de R$ 10 mil" },
]

interface FiltroValorProps {
  /** Valor minimo em reais. 0 = sem filtro. */
  value: number
  onChange: (valorMin: number) => void
  className?: string
}

/**
 * Filtro de valor minimo ("acima de X"). Usado na lista de propostas e na
 * tela de validacoes para isolar negocios acima de um corte de valor.
 */
export function FiltroValor({ value, onChange, className = "w-full sm:w-[190px] shrink-0" }: FiltroValorProps) {
  const ativo = value > 0

  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger
        className={[
          className,
          "rounded-lg border text-xs",
          ativo
            ? "bg-primary/10 dark:bg-primary/15 border-primary/40 text-primary font-medium"
            : "bg-card dark:bg-card border-border",
        ].join(" ")}
      >
        <div className="flex items-center gap-1.5 min-w-0 line-clamp-1">
          <Wallet className={`w-3.5 h-3.5 shrink-0 ${ativo ? "text-primary" : "text-muted-foreground"}`} />
          <SelectValue placeholder="Valor" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {VALOR_MIN_OPCOES.map((opcao) => (
          <SelectItem key={opcao.value} value={opcao.value} className="text-xs">
            {opcao.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
