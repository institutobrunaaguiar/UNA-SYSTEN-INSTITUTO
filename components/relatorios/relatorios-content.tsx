"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, FileSpreadsheet } from "lucide-react"
import { RelatoriosFilters, type RelatorioFilters } from "./relatorios-filters"
import { RelatoriosGerencial } from "./relatorios-gerencial"
import { RelatoriosAnalitico } from "./relatorios-analitico"

const initialFilters: RelatorioFilters = {
  dataInicial: "",
  dataFinal: "",
  profissional: "",
  procedimento: "",
}

export function RelatoriosContent() {
  const [filters, setFilters] = useState<RelatorioFilters>(initialFilters)

  return (
    <div className="space-y-6 animate-fade-in">
      <RelatoriosFilters filters={filters} onFiltersChange={setFilters} />

      <Tabs defaultValue="gerencial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gerencial" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Gerencial
          </TabsTrigger>
          <TabsTrigger value="analitico" className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            Analitico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerencial">
          <RelatoriosGerencial filters={filters} />
        </TabsContent>

        <TabsContent value="analitico">
          <RelatoriosAnalitico filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
