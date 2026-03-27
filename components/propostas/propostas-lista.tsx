"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  RefreshCw,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@supabase/supabase-js"
import type { Proposta, PropostaStatus } from "./types"
import { STATUS_CONFIG } from "./types"

interface PropostasListaProps {
  onNovaProposta: () => void
  onEditarProposta: (proposta: Proposta) => void
  onVerDetalhes: (proposta: Proposta) => void
}

export function PropostasLista({ onNovaProposta, onEditarProposta, onVerDetalhes }: PropostasListaProps) {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<PropostaStatus | "todas">("todas")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    fetchPropostas()
  }, [])

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  async function fetchPropostas() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("propostas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[propostas] Erro ao buscar:", error.message)
        return
      }
      if (data) setPropostas(data as Proposta[])
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDuplicar(proposta: Proposta) {
    try {
      const supabase = getSupabase()
      const { id, created_at, updated_at, ...rest } = proposta
      const { error } = await supabase.from("propostas").insert({
        ...rest,
        nome_cliente: `${proposta.nome_cliente} (copia)`,
        status: "em_negociacao",
      })
      if (error) {
        console.error("[propostas] Erro ao duplicar:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("propostas").delete().eq("id", deleteId)
      if (error) {
        console.error("[propostas] Erro ao excluir:", error.message)
        return
      }
      setDeleteId(null)
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  async function handleStatusChange(id: number, status: PropostaStatus) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("propostas").update({ status }).eq("id", id)
      if (error) {
        console.error("[propostas] Erro ao atualizar status:", error.message)
        return
      }
      fetchPropostas()
    } catch (error) {
      console.error("[propostas] Erro:", error)
    }
  }

  const filtered = propostas.filter((p) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      p.nome_cliente.toLowerCase().includes(term) ||
      (p.cpf_cliente && p.cpf_cliente.includes(term))
    const matchesStatus = filterStatus === "todas" || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    todas: propostas.length,
    em_negociacao: propostas.filter((p) => p.status === "em_negociacao").length,
    aguardando_pagamento: propostas.filter((p) => p.status === "aguardando_pagamento").length,
    pago: propostas.filter((p) => p.status === "pago").length,
    recusada: propostas.filter((p) => p.status === "recusada").length,
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={onNovaProposta}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["todas", "em_negociacao", "aguardando_pagamento", "pago", "recusada"] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            onClick={() => setFilterStatus(status)}
            size="sm"
          >
            {status === "todas" ? "Todas" : STATUS_CONFIG[status].label} ({statusCounts[status]})
          </Button>
        ))}
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Carregando propostas...</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Card className="border border-border">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">CPF</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Procedimentos</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Valor Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((proposta) => (
                    <tr
                      key={proposta.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{proposta.id}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{proposta.nome_cliente}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{proposta.cpf_cliente || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {proposta.itens.map((i) => i.procedimentoNome).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {formatCurrency(proposta.valor_total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[proposta.status].color}`}>
                          {STATUS_CONFIG[proposta.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(proposta.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onVerDetalhes(proposta)}>
                              <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditarProposta(proposta)}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(proposta)}>
                              <Copy className="w-4 h-4 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <RefreshCw className="w-4 h-4 mr-2" /> Alterar status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {(Object.keys(STATUS_CONFIG) as PropostaStatus[]).map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() => handleStatusChange(proposta.id, s)}
                                    disabled={proposta.status === s}
                                  >
                                    {STATUS_CONFIG[s].label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(proposta.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhuma proposta encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filtered.length} de {propostas.length} propostas</span>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
