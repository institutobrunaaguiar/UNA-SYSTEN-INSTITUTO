// components/admin/modulos-selector.tsx
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Stethoscope,
  Settings,
  FileSignature,
} from "lucide-react"

export const MODULOS = [
  { key: "painel",      label: "Painel",      icon: LayoutDashboard },
  { key: "proposta",    label: "Proposta",    icon: CheckSquare },
  { key: "calendario",  label: "Calendário",  icon: Calendar },
  { key: "relatorios",  label: "Relatórios",  icon: BarChart3 },
  { key: "pacientes",   label: "Pacientes",   icon: Stethoscope },
  { key: "contratos",   label: "Contratos",   icon: FileSignature },
  { key: "admin",       label: "Admin",       icon: Settings },
] as const

export type ModuloKey = (typeof MODULOS)[number]["key"]

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

export function ModulosSelector({ value, onChange }: Props) {
  function toggle(key: string) {
    onChange(
      value.includes(key) ? value.filter((k) => k !== key) : [...value, key]
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Módulos permitidos
      </p>
      <div className="grid grid-cols-3 gap-2">
        {MODULOS.map(({ key, label, icon: Icon }) => {
          const active = value.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={[
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
