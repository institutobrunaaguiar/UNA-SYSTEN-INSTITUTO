"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, CheckSquare, Calendar, BarChart3,
  Stethoscope, DollarSign, Megaphone, Settings, MoreHorizontal, X, FileSignature, LogOut,
} from "lucide-react"
import { FloatingDock } from "@/components/ui/floating-dock"
import { getSupabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"

const mainItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/painel" },
  { icon: CheckSquare, label: "Proposta", href: "/proposta" },
  { icon: Calendar, label: "Agenda", href: "/calendar" },
  { icon: BarChart3, label: "Relatórios", href: "/analytics" },
  { icon: Stethoscope, label: "Pacientes", href: "/pacientes" },
]

const moreItems = [
  { icon: DollarSign,    label: "Comissão",  href: "/comissao" },
  { icon: Megaphone,     label: "Campanha",  href: "/campanha" },
  { icon: FileSignature, label: "Contratos", href: "/contratos" },
  { icon: Settings,      label: "Admin",     href: "/settings" },
]

const hiddenPaths = ["/login", "/logout"]

export function MobileDock() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => setMounted(true), [])

  async function handleLogout() {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Hide dock on login/logout pages
  if (mounted && hiddenPaths.includes(pathname)) return null

  const isMoreActive = mounted && moreItems.some((item) => pathname === item.href)

  return (
    <>
      {/* Expanded menu overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] lg:hidden"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More menu panel */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-[68px] left-3 right-3 bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 z-[999] lg:hidden shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
                Mais opções
              </span>
              <button
                onClick={() => setShowMore(false)}
                className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => {
                const isActive = mounted && pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground active:bg-secondary"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <button
              onClick={() => { setShowMore(false); handleLogout() }}
              className="flex items-center gap-2 w-full mt-3 pt-3 border-t border-border text-destructive active:bg-destructive/10 rounded-lg px-3 py-2.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium">Sair da conta</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom dock bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[999] lg:hidden">
        <div className="bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
          <div className="flex items-center justify-around px-2 h-[60px]">
            {mainItems.map((item) => {
              const isActive = mounted && pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-all active:scale-95",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-medium tracking-wide",
                    isActive && "font-semibold"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* More button */}
            <button
              onClick={() => setShowMore((v) => !v)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-all active:scale-95",
                showMore || isMoreActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <MoreHorizontal className={cn("w-5 h-5", (showMore || isMoreActive) && "stroke-[2.5]")} />
                {isMoreActive && !showMore && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-medium tracking-wide",
                (showMore || isMoreActive) && "font-semibold"
              )}>
                Mais
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
