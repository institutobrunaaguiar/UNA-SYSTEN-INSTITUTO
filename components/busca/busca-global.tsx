// components/busca/busca-global.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { STATUS_CONFIG } from "@/components/propostas/types"
import type { PropostaStatus } from "@/components/propostas/types"

interface PacienteResult {
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone_celular: string | null
}

interface PropostaResult {
  id: number
  nome_cliente: string
  valor_total: number
  status: PropostaStatus
  itens: Array<{ procedimentoNome: string }>
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

function getInitials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

function avatarColor(nome: string) {
  const colors = ["bg-indigo-600", "bg-cyan-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600"]
  const idx = nome.charCodeAt(0) % colors.length
  return colors[idx]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function formatCpf(cpf: string | null) {
  if (!cpf) return ""
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function BuscaGlobal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [pacientes, setPacientes] = useState<PacienteResult[]>([])
  const [propostas, setPropostas] = useState<PropostaResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // ⌘K / Ctrl+K opens the modal
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  // Debounced search
  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setPacientes([])
      setPropostas([])
      return
    }
    setLoading(true)
    try {
      const supabase = getSupabase()
      const [pacRes, propRes] = await Promise.all([
        supabase
          .from("pacientes")
          .select("id, nome, cpf_cnpj, telefone_celular")
          .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%`)
          .eq("ativo", true)
          .limit(5),
        supabase
          .from("propostas")
          .select("id, nome_cliente, valor_total, status, itens")
          .or(`nome_cliente.ilike.%${term}%,cpf_cliente.ilike.%${term}%`)
          .limit(5),
      ])
      if (pacRes.data) setPacientes(pacRes.data as PacienteResult[])
      if (propRes.data) setPropostas(propRes.data as PropostaResult[])
    } catch (e) {
      console.error("[busca] erro:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  function handleClose() {
    setOpen(false)
    setQuery("")
    setPacientes([])
    setPropostas([])
  }

  function goToPaciente(id: number) {
    handleClose()
    router.push(`/pacientes?id=${id}`)
  }

  function goToProposta(id: number) {
    handleClose()
    router.push(`/proposta?id=${id}`)
  }

  const hasResults = pacientes.length > 0 || propostas.length > 0
  const searched = query.length >= 2

  return (
    <>
      {/* Trigger button — looks like an input */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 flex-1 max-w-md h-9 px-3 rounded-md border border-border bg-card text-sm text-muted-foreground hover:border-primary/40 transition-colors"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">Buscar paciente ou proposta...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted rounded border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Command palette modal */}
      <CommandDialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <CommandInput
          placeholder="Buscar por nome ou CPF..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!searched && (
            <CommandEmpty>Digite para buscar pacientes ou propostas.</CommandEmpty>
          )}
          {searched && !hasResults && !loading && (
            <CommandEmpty>Nenhum resultado para &quot;{query}&quot;.</CommandEmpty>
          )}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin h-5 w-5 border-b-2 border-primary rounded-full" />
            </div>
          )}

          {pacientes.length > 0 && (
            <CommandGroup heading="Pacientes">
              {pacientes.map((pac) => (
                <CommandItem key={`pac-${pac.id}`} onSelect={() => goToPaciente(pac.id)} className="gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(pac.nome)}`}>
                    {getInitials(pac.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{pac.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCpf(pac.cpf_cnpj)}
                      {pac.cpf_cnpj && pac.telefone_celular ? " · " : ""}
                      {pac.telefone_celular}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">Paciente</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {pacientes.length > 0 && propostas.length > 0 && <CommandSeparator />}

          {propostas.length > 0 && (
            <CommandGroup heading="Propostas">
              {propostas.map((prop) => {
                const cfg = STATUS_CONFIG[prop.status] ?? { label: prop.status, color: "" }
                const procs = (prop.itens ?? []).map((i) => i.procedimentoNome).join(", ")
                return (
                  <CommandItem key={`prop-${prop.id}`} onSelect={() => goToProposta(prop.id)} className="gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{prop.nome_cliente}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatCurrency(prop.valor_total)}
                        {procs ? ` · ${procs}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
