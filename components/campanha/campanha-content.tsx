"use client"

import { useState } from "react"
import { CampanhaLista } from "./campanha-lista"
import { CampanhaForm } from "./campanha-form"
import { CampanhaDetalhe } from "./campanha-detalhe"
import type { Campanha } from "./campanha-lista"

export function CampanhaContent() {
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSelect(campanha: Campanha) {
    setSelectedCampanha(campanha)
    setDetalheOpen(true)
  }

  function handleNew() {
    setSelectedCampanha(null)
    setFormOpen(true)
  }

  function handleEditFromDetalhe() {
    setDetalheOpen(false)
    setFormOpen(true)
  }

  function handleSaved() {
    setSelectedCampanha(null)
    setRefreshKey((k) => k + 1)
  }

  function handleDetalheClose(open: boolean) {
    setDetalheOpen(open)
    if (!open) {
      // Refresh list in case ativa status was toggled from detail view
      setRefreshKey((k) => k + 1)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CampanhaLista
        onSelect={handleSelect}
        onNew={handleNew}
        refreshKey={refreshKey}
      />

      <CampanhaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        campanha={formOpen ? selectedCampanha : null}
        onSaved={handleSaved}
      />

      <CampanhaDetalhe
        open={detalheOpen}
        onOpenChange={handleDetalheClose}
        campanha={selectedCampanha}
        onEdit={handleEditFromDetalhe}
      />
    </div>
  )
}
