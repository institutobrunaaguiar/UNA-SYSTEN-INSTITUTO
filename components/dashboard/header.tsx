"use client"

import { Button } from "@/components/ui/button"
import { MobileNav } from "./mobile-nav"
import { BuscaGlobal } from "@/components/busca/busca-global"
import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="space-y-3 md:space-y-4 animate-slide-in-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <MobileNav />
          <BuscaGlobal />
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
<div className="flex items-center pl-2 md:pl-3 border-l border-border">
            <img
              src="https://institutobrunaaguiar.com.br/images/logo-1.png"
              alt="Instituto Bruna Aguiar"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-xs md:text-sm text-muted-foreground">{description}</p>
      </div>

      {actions && <div className="flex flex-col sm:flex-row gap-2">{actions}</div>}
    </header>
  )
}
