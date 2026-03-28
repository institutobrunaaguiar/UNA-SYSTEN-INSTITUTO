"use client"

import { BuscaGlobal } from "@/components/busca/busca-global"
import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <BuscaGlobal />
        </div>

        <div className="flex items-center gap-3">
          <img
            src="https://institutobrunaaguiar.com.br/images/logo-1.png"
            alt="Instituto Bruna Aguiar"
            className="h-7 w-auto object-contain opacity-70"
          />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 tracking-wide">
            {description}
          </p>
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">{actions}</div>
        )}
      </div>

      <div className="border-b border-border" />
    </header>
  )
}
