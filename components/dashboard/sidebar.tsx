"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, CheckSquare, Calendar, BarChart3, Settings,
  HelpCircle, LogOut, Stethoscope, DollarSign, Megaphone, UserCircle,
} from "lucide-react"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { motion } from "motion/react"
import Link from "next/link"
import { useUser } from "@/context/user-context"

const menuItems = [
  { icon: LayoutDashboard, label: "Painel",     href: "/",          modulo: "painel" },
  { icon: CheckSquare,    label: "Proposta",    href: "/proposta",  modulo: "proposta" },
  { icon: Calendar,       label: "Calendário",  href: "/calendar",  modulo: "calendario" },
  { icon: BarChart3,      label: "Relatórios",  href: "/analytics", modulo: "relatorios" },
  { icon: Stethoscope,    label: "Pacientes",   href: "/pacientes", modulo: "pacientes" },
  { icon: DollarSign,     label: "Comissão",    href: "/comissao",  modulo: "comissao" },
  { icon: Megaphone,      label: "Campanha",    href: "/campanha",  modulo: "campanha" },
]

const systemItems = [
  { icon: Settings,    label: "Admin",   href: "/settings", modulo: "admin" },
  { icon: UserCircle,  label: "Perfil",  href: "/perfil",   modulo: null },
  { icon: HelpCircle,  label: "Ajuda",   href: "/help",     modulo: null },
  { icon: LogOut,      label: "Sair",    href: "/logout",   modulo: null },
]

function Logo({ open }: { open: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group px-1 py-2">
      <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-primary/20 group-hover:border-primary/50">
        <span className="text-primary font-bold text-sm">U</span>
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden"
        >
          <span className="text-sm font-bold tracking-[0.2em] uppercase text-foreground">
            UNA
          </span>
          <span className="block text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
            SYSTEM
          </span>
        </motion.div>
      )}
    </Link>
  )
}

export function AppSidebar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user } = useUser()

  useEffect(() => setMounted(true), [])

  const modulos = user?.modulos ?? []

  const mainLinks = menuItems
    .filter((item) => modulos.includes(item.modulo))
    .map((item) => ({
      label: item.label,
      href: item.href,
      active: mounted && pathname === item.href,
      icon: (
        <item.icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover/sidebar:text-foreground transition-colors" />
      ),
    }))

  const sysLinks = systemItems
    .filter((item) => item.modulo === null || modulos.includes(item.modulo))
    .map((item) => ({
      label: item.label,
      href: item.href,
      active: mounted && pathname === item.href,
      icon: (
        <item.icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover/sidebar:text-foreground transition-colors" />
      ),
    }))

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6 border-r border-border bg-card h-screen fixed top-0 left-0 z-40">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <Logo open={open} />

          {/* Operações */}
          <div className="mt-6">
            {open && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] font-medium text-muted-foreground mb-2 uppercase tracking-[0.2em] px-2"
              >
                Operações
              </motion.p>
            )}
            <div className="flex flex-col gap-0.5">
              {mainLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Sistema */}
          <div className="mt-6">
            {open && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] font-medium text-muted-foreground mb-2 uppercase tracking-[0.2em] px-2"
              >
                Sistema
              </motion.p>
            )}
            <div className="flex flex-col gap-0.5">
              {sysLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-3 px-1">
          {open ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em]"
            >
              UNA System v1.0
            </motion.p>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            </div>
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  )
}
