"use client"

import {
  LayoutDashboard, CheckSquare, Calendar, BarChart3, Settings,
  HelpCircle, LogOut, Stethoscope, DollarSign, Megaphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/", num: "01" },
  { icon: CheckSquare, label: "Proposta", href: "/proposta", num: "02" },
  { icon: Calendar, label: "Calendário", href: "/calendar", num: "03" },
  { icon: BarChart3, label: "Relatórios", href: "/analytics", num: "04" },
  { icon: Stethoscope, label: "Pacientes", href: "/pacientes", num: "05" },
  { icon: DollarSign, label: "Comissão", href: "/comissao", num: "06" },
  { icon: Megaphone, label: "Campanha", href: "/campanha", num: "07" },
]

const generalItems = [
  { icon: Settings, label: "Admin", href: "/settings" },
  { icon: HelpCircle, label: "Ajuda", href: "/help" },
  { icon: LogOut, label: "Sair", href: "/logout" },
]

export function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])

  return (
    <aside className="fixed top-0 left-0 w-64 bg-card border-r border-border h-screen overflow-y-auto hidden lg:flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:border-primary/50">
            <span className="text-primary font-bold text-sm">U</span>
          </div>
          <div>
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-foreground">UNA</span>
            <span className="block text-[9px] tracking-[0.15em] uppercase text-muted-foreground">SYSTEM</span>
          </div>
        </Link>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 px-3 py-5 space-y-6">
        <div>
          <p className="text-[9px] font-medium text-muted-foreground mb-3 uppercase tracking-[0.2em] px-2">
            Operações
          </p>
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = mounted && pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded text-[13px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent",
                    hoveredItem === item.label && !isActive && "translate-x-0.5",
                  )}
                >
                  <span className={cn(
                    "font-mono text-[10px] w-5 text-right",
                    isActive ? "text-primary" : "text-muted-foreground/50"
                  )}>
                    {item.num}
                  </span>
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="tracking-wide">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <p className="text-[9px] font-medium text-muted-foreground mb-3 uppercase tracking-[0.2em] px-2">
            Sistema
          </p>
          <nav className="space-y-0.5">
            {generalItems.map((item) => {
              const isActive = mounted && pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded text-[13px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent",
                    hoveredItem === item.label && !isActive && "translate-x-0.5",
                  )}
                >
                  <span className="font-mono text-[10px] w-5 text-right text-muted-foreground/50">—</span>
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em]">
          UNA System v1.0
        </p>
      </div>
    </aside>
  )
}
