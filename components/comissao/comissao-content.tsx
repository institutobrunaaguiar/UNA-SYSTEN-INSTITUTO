"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calculator, ListChecks, BookOpen, Target } from "lucide-react"
import { ComissaoLista } from "./comissao-lista"
import { ComissaoRegras } from "./comissao-regras"
import { ComissaoMetas } from "./comissao-metas"
import { ComissaoCalcular } from "./comissao-calcular"

export function ComissaoContent() {
  const [calcularOpen, setCalcularOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleCalcularComplete() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action header */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setCalcularOpen(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Calculator className="w-4 h-4" />
          Calcular Comissoes
        </Button>
      </div>

      <Tabs defaultValue="comissoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comissoes" className="gap-1.5">
            <ListChecks className="w-4 h-4" />
            Comissoes
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-1.5">
            <BookOpen className="w-4 h-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-1.5">
            <Target className="w-4 h-4" />
            Metas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comissoes">
          <ComissaoLista key={refreshKey} />
        </TabsContent>

        <TabsContent value="regras">
          <ComissaoRegras />
        </TabsContent>

        <TabsContent value="metas">
          <ComissaoMetas />
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
