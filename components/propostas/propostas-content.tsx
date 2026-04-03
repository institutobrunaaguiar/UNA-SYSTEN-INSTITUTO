"use client"

import { useState } from "react"
import { PropostasLista } from "./propostas-lista"
import { PropostaForm } from "./proposta-form"
import { PropostaDetalhes } from "./proposta-detalhes"
import { createClient } from "@supabase/supabase-js"
import type { Proposta } from "./types"

type View = "lista" | "nova" | "editar"

export function PropostasContent() {
  const [view, setView] = useState<View>("lista")
  const [editProposta, setEditProposta] = useState<Proposta | null>(null)
  const [detalheProposta, setDetalheProposta] = useState<Proposta | null>(null)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [listKey, setListKey] = useState(0)

  function handleNovaProposta() {
    setEditProposta(null)
    setView("nova")
  }

  function handleEditarProposta(proposta: Proposta) {
    setEditProposta(proposta)
    setView("editar")
  }

  function handleVerDetalhes(proposta: Proposta) {
    setDetalheProposta(proposta)
    setDetalheOpen(true)
  }

  function handleSave() {
    setView("lista")
    setEditProposta(null)
    setListKey((k) => k + 1)
  }

  function handleCancel() {
    setView("lista")
    setEditProposta(null)
  }

  async function handleDuplicar(proposta: Proposta) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
      if (!url || !key) return
      const supabase = createClient(url, key)
      const { id, created_at, updated_at, ...rest } = proposta
      await supabase.from("propostas").insert({
        ...rest,
        nome_cliente: `${proposta.nome_cliente} (copia)`,
        status: "em_negociacao",
        validacao_status: "pendente",
        validacao_motivo: null,
        validado_em: null,
      })
      setListKey((k) => k + 1)
    } catch (error) {
      console.error("[propostas] Erro ao duplicar:", error)
    }
  }

  return (
    <div>
      {view === "lista" && (
        <PropostasLista
          key={listKey}
          onNovaProposta={handleNovaProposta}
          onEditarProposta={handleEditarProposta}
          onVerDetalhes={handleVerDetalhes}
        />
      )}

      {(view === "nova" || view === "editar") && (
        <PropostaForm
          proposta={view === "editar" ? editProposta : null}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <PropostaDetalhes
        proposta={detalheProposta}
        open={detalheOpen}
        onClose={() => setDetalheOpen(false)}
        onEditar={handleEditarProposta}
        onDuplicar={handleDuplicar}
      />
    </div>
  )
}
