// components/painel/painel-contratos.tsx
"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"
import Link from "next/link"

interface Contrato {
  id: string
  titulo: string
  status: "rascunho" | "pendente" | "assinado" | "recusado" | "expirado" | "cancelado"
  nome_paciente: string | null
  created_at: string
  signed_at: string | null
}

const STATUS_LABEL: Record<Contrato["status"], string> = {
  rascunho: "Rascunho",
  pendente: "Pendente",
  assinado: "Assinado",
  recusado: "Recusado",
  expirado: "Expirado",
  cancelado: "Cancelado",
}

const STATUS_CLASS: Record<Contrato["status"], string> = {
  rascunho: "bg-gray-100 text-gray-700",
  pendente: "bg-yellow-100 text-yellow-700",
  assinado: "bg-green-100 text-green-700",
  recusado: "bg-red-100 text-red-700",
  expirado: "bg-orange-100 text-orange-700",
  cancelado: "bg-red-100 text-red-700",
}

export function PainelContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const { data, error } = await getSupabase()
          .from("contratos")
          .select("id, titulo, status, nome_paciente, created_at, signed_at")
          .gte("created_at", ninetyDaysAgo.toISOString())
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[painel-contratos] erro Supabase:", error)
          setError(true)
          return
        }

        setContratos((data as Contrato[]) || [])
      } catch (e) {
        console.error("[painel-contratos] erro ao buscar dados:", e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <p className="text-xs text-destructive text-center py-6">
        Erro ao carregar contratos. Tente recarregar a página.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // KPI calculations
  const total = contratos.length
  const assinados = contratos.filter((c) => c.status === "assinado").length
  const pendentes = contratos.filter((c) => c.status === "pendente").length
  const rascunhos = contratos.filter((c) => c.status === "rascunho").length
  const denominador = total - rascunhos
  const taxaAssinatura = denominador > 0 ? `${Math.round((assinados / denominador) * 100)}%` : "—"

  // Recent contracts list (last 8)
  const recentes = contratos.slice(0, 8)

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-border rounded-xl space-y-1">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">Total</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{total}</p>
          <p className="text-xs text-muted-foreground">últimos 90 dias</p>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl space-y-1">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">Assinados</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{assinados}</p>
          <p className="text-xs text-muted-foreground">contratos</p>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl space-y-1">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">Pendentes</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{pendentes}</p>
          <p className="text-xs text-muted-foreground">aguardando assinatura</p>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl space-y-1">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">Taxa de Assinatura</p>
          <p className="text-2xl font-bold text-foreground leading-tight">{taxaAssinatura}</p>
          <p className="text-xs text-muted-foreground">conversão</p>
        </Card>
      </div>

      {/* Recent Contracts List */}
      <Card className="p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Contratos Recentes</p>
        </div>

        {recentes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhum contrato nos últimos 90 dias.
          </p>
        ) : (
          <div>
            {recentes.map((contrato) => (
              <div
                key={contrato.id}
                className="flex items-center justify-between border-b border-border last:border-0 py-3 gap-3"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-foreground truncate max-w-[200px]">{contrato.titulo}</span>
                  <span className="text-xs text-muted-foreground">
                    {contrato.nome_paciente ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[contrato.status]}`}
                  >
                    {STATUS_LABEL[contrato.status]}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(contrato.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 8 && (
          <div className="mt-3 pt-3 border-t border-border">
            <Link href="/contratos" className="text-xs text-primary hover:underline">
              Ver todos em Contratos →
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
