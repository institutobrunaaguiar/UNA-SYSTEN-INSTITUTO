"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react"
import type { RelatorioFilters } from "./relatorios-filters"
import type { Proposta, PropostaItem } from "@/components/propostas/types"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const PAGE_SIZE = 50

interface RelatoriosAnaliticoProps {
  filters: RelatorioFilters
}

export function RelatoriosAnalitico({ filters }: RelatoriosAnaliticoProps) {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = getSupabase()

      let query = supabase
        .from("propostas")
        .select("*")
        .eq("status", "pago")
        .order("created_at", { ascending: false })

      if (filters.dataInicial) {
        query = query.gte("created_at", `${filters.dataInicial}T00:00:00`)
      }
      if (filters.dataFinal) {
        query = query.lte("created_at", `${filters.dataFinal}T23:59:59`)
      }

      const res = await query
      setPropostas((res.data as Proposta[]) ?? [])
      setLoading(false)
    }

    fetchData()
  }, [filters.dataInicial, filters.dataFinal])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.profissional, filters.procedimento, filters.dataInicial, filters.dataFinal])

  // Apply profissional/procedimento filters client-side
  const filteredPropostas = useMemo(() => {
    let result = propostas

    if (filters.profissional) {
      result = result.filter((p) => {
        const itens: PropostaItem[] = Array.isArray(p.itens) ? p.itens : []
        return itens.some((item) => item.profissionalNome === filters.profissional)
      })
    }

    if (filters.procedimento) {
      result = result.filter((p) => {
        const itens: PropostaItem[] = Array.isArray(p.itens) ? p.itens : []
        return itens.some((item) => item.procedimentoNome === filters.procedimento)
      })
    }

    return result
  }, [propostas, filters.profissional, filters.procedimento])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPropostas.length / PAGE_SIZE))
  const paginatedPropostas = filteredPropostas.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function getProcedimentos(itens: PropostaItem[]): string {
    if (!Array.isArray(itens) || itens.length === 0) return "-"
    const names = [...new Set(itens.map((i) => i.procedimentoNome).filter(Boolean))]
    return names.join(", ") || "-"
  }

  function getProfissionais(itens: PropostaItem[]): string {
    if (!Array.isArray(itens) || itens.length === 0) return "-"
    const names = [...new Set(itens.map((i) => i.profissionalNome).filter(Boolean))]
    return names.join(", ") || "-"
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Card className="p-0 overflow-hidden">
          <div className="p-4">
            <Skeleton className="h-5 w-48 mb-4" />
          </div>
          <div className="px-4 pb-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (filteredPropostas.length === 0) {
    return (
      <div className="animate-fade-in">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-base font-medium mb-1">Nenhum fechamento encontrado</p>
            <p className="text-sm opacity-70">
              Ajuste os filtros para visualizar os dados analiticos.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-0 overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="hidden md:table-cell">Procedimentos</TableHead>
              <TableHead className="hidden lg:table-cell">Profissional</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Entrada</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Parcelas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPropostas.map((proposta, index) => {
              const itens: PropostaItem[] = Array.isArray(proposta.itens) ? proposta.itens : []
              return (
                <TableRow
                  key={proposta.id}
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <TableCell className="font-medium text-sm">
                    {formatDate(proposta.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[180px]">
                      <p className="text-sm font-medium truncate">{proposta.nome_cliente}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-muted-foreground max-w-[250px] truncate" title={getProcedimentos(itens)}>
                      {getProcedimentos(itens)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-sm text-muted-foreground max-w-[180px] truncate" title={getProfissionais(itens)}>
                      {getProfissionais(itens)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm tabular-nums">
                    {formatCurrency(proposta.valor_total)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground tabular-nums hidden sm:table-cell">
                    {formatCurrency(proposta.valor_entrada)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground tabular-nums hidden sm:table-cell">
                    {proposta.num_parcelas}x
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {(currentPage - 1) * PAGE_SIZE + 1}
          </span>
          {" - "}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * PAGE_SIZE, filteredPropostas.length)}
          </span>
          {" de "}
          <span className="font-medium text-foreground">{filteredPropostas.length}</span>
          {" fechamentos"}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Anterior</span>
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 transition-all duration-200"
          >
            <span className="hidden sm:inline mr-1">Proximo</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
