import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { FiltroMeses, type OpcaoMes } from "@/components/filtros/filtro-meses"
import { FiltroValor } from "@/components/filtros/filtro-valor"
import type { FiltrosState } from "./aprovadas-content"

interface AprovadasFiltrosProps {
  filtros: FiltrosState
  onChange: (filtros: FiltrosState) => void
  meses: OpcaoMes[]
  profissionais: string[]
  procedimentos: string[]
}

export function AprovadasFiltros({ filtros, onChange, meses, profissionais, procedimentos }: AprovadasFiltrosProps) {
  function update(partial: Partial<FiltrosState>) {
    onChange({ ...filtros, ...partial })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <FiltroMeses
        selecionados={filtros.meses}
        onChange={(v) => update({ meses: v })}
        opcoes={meses}
        className="w-full sm:w-[200px] shrink-0"
      />

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

      <FiltroValor
        value={filtros.valorMin}
        onChange={(v) => update({ valorMin: v })}
        className="w-full sm:w-[190px] shrink-0"
      />

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
