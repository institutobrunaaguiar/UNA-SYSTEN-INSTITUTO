"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Calculator, ListChecks, BookOpen, Target, CalendarDays, LayoutDashboard,
} from "lucide-react"
import { ComissaoPainel } from "./comissao-painel"
import { ComissaoLista } from "./comissao-lista"
import { ComissaoRegras } from "./comissao-regras"
import { ComissaoMetas } from "./comissao-metas"
import { ComissaoCalcular } from "./comissao-calcular"
import { ComissaoPeriodos } from "./comissao-periodos"

export function ComissaoContent() {
  const [calcularOpen, setCalcularOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleCalcularComplete() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Botão calcular */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setCalcularOpen(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Calculator className="w-4 h-4" />
          Calcular Comissões
        </Button>
      </div>

      <Tabs defaultValue="painel" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="painel" className="gap-1.5">
            <LayoutDashboard className="w-4 h-4" />
            Painel
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-1.5">
            <Target className="w-4 h-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="comissoes" className="gap-1.5">
            <ListChecks className="w-4 h-4" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-1.5">
            <BookOpen className="w-4 h-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="periodos" className="gap-1.5">
            <CalendarDays className="w-4 h-4" />
            Períodos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="painel">
          <ComissaoPainel key={refreshKey} />
        </TabsContent>

        <TabsContent value="metas">
          <ComissaoMetas />
        </TabsContent>

        <TabsContent value="comissoes">
          <ComissaoLista key={refreshKey} />
        </TabsContent>

        <TabsContent value="regras">
          <ComissaoRegras />
        </TabsContent>

        <TabsContent value="periodos">
          <ComissaoPeriodos />
        </TabsContent>
      </Tabs>

      <ComissaoCalcular
        open={calcularOpen}
        onOpenChange={setCalcularOpen}
        onComplete={handleCalcularComplete}
      />
    </div>
  )
}
