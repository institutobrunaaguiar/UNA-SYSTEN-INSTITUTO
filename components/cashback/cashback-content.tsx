"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CashbackLista } from "./cashback-lista"
import { CashbackForm } from "./cashback-form"
import type { CashbackCampanha } from "./cashback-lista"

export function CashbackContent() {
  const [campanhas, setCampanhas] = useState<CashbackCampanha[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [campanhaEdit, setCampanhaEdit] = useState<CashbackCampanha | null>(null)

  useEffect(() => {
    fetchCampanhas()
  }, [])

  async function fetchCampanhas() {
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("cashback_campanhas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCampanhas((data as CashbackCampanha[]) || [])
    } catch (err) {
      console.error("[cashback] Erro ao buscar campanhas:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAtiva(id: number, ativa: boolean) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from("cashback_campanhas")
        .update({ ativa })
        .eq("id", id)

      if (error) throw error
      await fetchCampanhas()
    } catch (err) {
      console.error("[cashback] Erro ao atualizar status:", err)
      toast.error("Erro ao atualizar status da campanha")
    }
  }

  function handleEditar(campanha: CashbackCampanha) {
    setCampanhaEdit(campanha)
    setFormOpen(true)
  }

  function handleNova() {
    setCampanhaEdit(null)
    setFormOpen(true)
  }

  async function handleSaved() {
    await fetchCampanhas()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={handleNova}>Nova Campanha</Button>
      </div>

      <CashbackLista
        campanhas={campanhas}
        onEditar={handleEditar}
        onToggleAtiva={handleToggleAtiva}
      />

      <CashbackForm
        open={formOpen}
        onOpenChange={setFormOpen}
        campanha={formOpen ? campanhaEdit : null}
        onSaved={handleSaved}
      />
    </div>
  )
}
