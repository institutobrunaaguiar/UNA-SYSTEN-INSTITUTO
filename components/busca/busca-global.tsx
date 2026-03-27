// components/busca/busca-global.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText, Search, User } from "lucide-react"
import { algoliasearch } from "algoliasearch"
import styles from "./busca-trigger.module.css"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { STATUS_CONFIG } from "@/components/propostas/types"
import type { PropostaStatus } from "@/components/propostas/types"

function getAlgolia() {
  return algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
  )
}

interface PacienteHit {
  objectID: string
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone_celular: string | null
  email: string | null
}

interface PropostaHit {
  objectID: string
  id: number
  nome_cliente: string
  valor_total: number
  status: PropostaStatus
}

function getInitials(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("")
}

function avatarColor(nome: string) {
  const colors = ["bg-indigo-600", "bg-cyan-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600"]
  return colors[nome.charCodeAt(0) % colors.length]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function formatCpf(cpf: string | null) {
  if (!cpf) return ""
  const d = cpf.replace(/\D/g, "")
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  return cpf
}

export function BuscaGlobal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [pacientes, setPacientes] = useState<PacienteHit[]>([])
  const [propostas, setPropostas] = useState<PropostaHit[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // ⌘K / Ctrl+K
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

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setPacientes([])
      setPropostas([])
      return
    }
    setLoading(true)
    try {
      const { results } = await getAlgolia().search({
        requests: [
          { indexName: "pacientes", query: term, hitsPerPage: 6 },
          { indexName: "propostas", query: term, hitsPerPage: 4 },
        ],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPacientes(((results[0] as any).hits ?? []) as PacienteHit[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPropostas(((results[1] as any).hits ?? []) as PropostaHit[])
    } catch (e) {
      console.error("[busca-algolia]", e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce 250ms
  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
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
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.form}
        aria-label="Abrir busca"
      >
        <div className={styles.fx}>
          <div className={styles.inputArea}>
            <span className={styles.placeholder}>Buscar paciente ou proposta...</span>
            <kbd className={`${styles.kbd} hidden md:inline-flex`}>⌘K</kbd>
          </div>
          <div className={styles.iconArea}>
            <div className={styles.circle} />
            <span className={styles.line} />
          </div>
        </div>
      </button>

      {/* Dialog — Command com shouldFilter={false} para não sobrescrever o Algolia */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent className="overflow-hidden p-0 gap-0 shadow-2xl max-w-xl">
          <Command shouldFilter={false} className="rounded-lg border-0">
            <div className="flex items-center border-b border-border px-3">
              <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
              <CommandInput
                placeholder="Buscar por nome ou CPF..."
                value={query}
                onValueChange={setQuery}
                className="border-0 focus:ring-0 h-12 text-sm"
              />
              {loading && (
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full shrink-0 ml-2" />
              )}
            </div>

            <CommandList className="max-h-[400px] overflow-y-auto">

              {/* Estado inicial */}
              {!searched && !loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Busca inteligente</p>
                  <p className="text-xs text-muted-foreground">
                    Digite um nome, CPF ou telefone para encontrar<br />pacientes e propostas
                  </p>
                </div>
              )}

              {/* Sem resultados */}
              {searched && !loading && !hasResults && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <p className="text-sm font-medium text-foreground">Nenhum resultado</p>
                  <p className="text-xs text-muted-foreground">
                    Nenhum paciente ou proposta encontrado para &quot;{query}&quot;
                  </p>
                </div>
              )}

              {/* Pacientes */}
              {pacientes.length > 0 && (
                <CommandGroup
                  heading={
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Pacientes · {pacientes.length} resultado{pacientes.length !== 1 ? "s" : ""}
                    </span>
                  }
                >
                  {pacientes.map((pac) => (
                    <CommandItem
                      key={`pac-${pac.objectID}`}
                      value={pac.objectID}
                      onSelect={() => goToPaciente(pac.id)}
                      className="gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(pac.nome)}`}>
                        {getInitials(pac.nome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{pac.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {pac.cpf_cnpj && <span>{formatCpf(pac.cpf_cnpj)}</span>}
                          {pac.cpf_cnpj && pac.telefone_celular && <span className="text-border">·</span>}
                          {pac.telefone_celular && <span>{pac.telefone_celular}</span>}
                          {!pac.cpf_cnpj && !pac.telefone_celular && pac.email && <span>{pac.email}</span>}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 shrink-0 flex items-center gap-1">
                        <User className="w-3 h-3" />Paciente
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {pacientes.length > 0 && propostas.length > 0 && (
                <CommandSeparator />
              )}

              {/* Propostas */}
              {propostas.length > 0 && (
                <CommandGroup
                  heading={
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Propostas · {propostas.length} resultado{propostas.length !== 1 ? "s" : ""}
                    </span>
                  }
                >
                  {propostas.map((prop) => {
                    const cfg = STATUS_CONFIG[prop.status] ?? { label: prop.status, color: "" }
                    return (
                      <CommandItem
                        key={`prop-${prop.objectID}`}
                        value={prop.objectID}
                        onSelect={() => goToProposta(prop.id)}
                        className="gap-3 px-3 py-2.5 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-tight">{prop.nome_cliente}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(prop.valor_total)}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* Footer */}
              {hasResults && (
                <div className="border-t border-border px-3 py-2 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    {pacientes.length + propostas.length} resultados para &quot;{query}&quot;
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] border border-border">↑↓</kbd>navegar
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] border border-border ml-1">↵</kbd>abrir
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] border border-border ml-1">ESC</kbd>fechar
                  </p>
                </div>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
