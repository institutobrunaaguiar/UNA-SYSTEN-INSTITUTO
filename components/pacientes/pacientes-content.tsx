// components/pacientes/pacientes-content.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { algoliasearch } from "algoliasearch"
import { PacienteDetalhe, type Paciente } from "./paciente-detalhe"

const PAGE_SIZE = 50

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

const algolia = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
)

function avatarColor(nome: string) {
  const colors = [
    "bg-indigo-600", "bg-cyan-600", "bg-violet-600",
    "bg-emerald-600", "bg-amber-600", "bg-rose-600",
  ]
  return colors[nome.charCodeAt(0) % colors.length]
}

function getInitials(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("")
}

function formatCpf(cpf: string | null) {
  if (!cpf) return null
  const d = cpf.replace(/\D/g, "")
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  return cpf
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    const now = new Date()
    let age = now.getFullYear() - date.getFullYear()
    const m = now.getMonth() - date.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--
    return `${date.toLocaleDateString("pt-BR")} · ${age} anos`
  } catch {
    return dateStr
  }
}

type FilterStatus = "all" | "ativo" | "inativo"

export function PacientesContent() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Paciente | null>(null)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on filter change
  useEffect(() => { setPage(0) }, [filterStatus])

  const fetchPacientes = useCallback(async () => {
    setLoading(true)

    // When searching: use Algolia (typo tolerance + fuzzy)
    if (debouncedSearch) {
      try {
        const filters =
          filterStatus === "ativo" ? "ativo:true"
          : filterStatus === "inativo" ? "ativo:false"
          : undefined

        const { results } = await algolia.search({
          requests: [{
            indexName: "pacientes",
            query: debouncedSearch,
            hitsPerPage: PAGE_SIZE,
            page,
            ...(filters ? { filters } : {}),
          }],
        })

        const result = results[0] as { hits: Paciente[]; nbHits: number; nbPages: number }
        setPacientes(result.hits ?? [])
        setTotal(result.nbHits ?? 0)
      } catch (e) {
        console.error("[pacientes-algolia]", e)
      } finally {
        setLoading(false)
      }
      return
    }

    // No search: use Supabase with server-side pagination
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = getSupabase()
      .from("pacientes")
      .select("*", { count: "exact" })
      .order("nome")
      .range(from, to)

    if (filterStatus === "ativo") query = query.eq("ativo", true)
    if (filterStatus === "inativo") query = query.eq("ativo", false)

    const { data, count } = await query
    if (data) setPacientes(data as Paciente[])
    if (count != null) setTotal(count)
    setLoading(false)
  }, [page, filterStatus, debouncedSearch])

  useEffect(() => { fetchPacientes() }, [fetchPacientes])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF, telefone ou e-mail..."
          className="pl-9 h-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(["all", "ativo", "inativo"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={[
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              filterStatus === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {f === "all" ? "Todos" : f === "ativo" ? "Ativos" : "Inativos"}
            {!debouncedSearch && f === "all" && total > 0 && ` (${total})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">CPF</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Nascimento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pacientes.length > 0 ? (
                pacientes.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(p.nome)}`}>
                          {getInitials(p.nome)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{p.nome}</p>
                          {p.nome_social && (
                            <p className="text-xs text-muted-foreground">({p.nome_social})</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {p.telefone_celular && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />{p.telefone_celular}
                          </p>
                        )}
                        {p.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 shrink-0" />{p.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell font-mono">
                      {formatCpf(p.cpf_cnpj) ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatDate(p.data_nascimento) ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.ativo ? "default" : "secondary"} className="text-[10px] py-0 h-5">
                        {p.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total === 0 ? "Nenhum resultado" : `${from}–${to} de ${total} pacientes`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[80px] text-center">
            Pág. {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <PacienteDetalhe paciente={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
