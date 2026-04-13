import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import type { FiltrosState } from "./aprovadas-content"

interface AprovadasFiltrosProps {
  filtros: FiltrosState
  onChange: (filtros: FiltrosState) => void
  meses: { value: string; label: string }[]
  profissionais: string[]
  procedimentos: string[]
}

export function AprovadasFiltros({ filtros, onChange, meses, profissionais, procedimentos }: AprovadasFiltrosProps) {
  function update(partial: Partial<FiltrosState>) {
    onChange({ ...filtros, ...partial })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={filtros.mesAno} onValueChange={(v) => update({ mesAno: v })}>
        <SelectTrigger className="w-full sm:w-[180px] bg-card border border-border rounded-lg text-xs">
          <SelectValue placeholder="Mês/Ano" />
        </SelectTrigger>
        <SelectContent>
          {meses.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.profissional} onValueChange={(v) => update({ profissional: v })}>
        <SelectTrigger className="w-full sm:w-[180px] bg-card border border-border rounded-lg text-xs">
          <SelectValue placeholder="Profissional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos" className="text-xs">Todos</SelectItem>
          {profissionais.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.procedimento} onValueChange={(v) => update({ procedimento: v })}>
        <SelectTrigger className="w-full sm:w-[180px] bg-card border border-border rounded-lg text-xs">
          <SelectValue placeholder="Procedimento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos" className="text-xs">Todos</SelectItem>
          {procedimentos.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.faixaValor} onValueChange={(v) => update({ faixaValor: v })}>
        <SelectTrigger className="w-full sm:w-[180px] bg-card border border-border rounded-lg text-xs">
          <SelectValue placeholder="Faixa de valor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas" className="text-xs">Todas</SelectItem>
          <SelectItem value="ate_1000" className="text-xs">Até R$ 1.000</SelectItem>
          <SelectItem value="1000_5000" className="text-xs">R$ 1.000 - R$ 5.000</SelectItem>
          <SelectItem value="5000_10000" className="text-xs">R$ 5.000 - R$ 10.000</SelectItem>
          <SelectItem value="acima_10000" className="text-xs">Acima de R$ 10.000</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do paciente..."
          className="pl-9 bg-card border border-border rounded-lg text-xs"
          value={filtros.busca}
          onChange={(e) => update({ busca: e.target.value })}
        />
      </div>
    </div>
  )
}
