"use client"

import { useEffect, useState } from "react"
import { FileSignature, Plus, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Search, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContratoNovoSheet } from "./contrato-novo-sheet"
import { ContratoDetalheSheet } from "./contrato-detalhe-sheet"

export interface Contrato {
  id: string
  paciente_id: number
  titulo: string
  status: "rascunho" | "pendente" | "assinado" | "recusado" | "expirado" | "cancelado"
  nome_paciente: string | null
  email_paciente: string | null
  url_assinatura: string | null
  url_certificado: string | null
  assinafy_document_id: string | null
  assinafy_assignment_id: string | null
  assinafy_signer_id: string | null
  created_at: string
  signed_at: string | null
}

const STATUS_MAP: Record<Contrato["status"], { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  rascunho:  { label: "Rascunho",  icon: Clock,         className: "bg-muted text-muted-foreground" },
  pendente:  { label: "Pendente",  icon: Clock,         className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  assinado:  { label: "Assinado",  icon: CheckCircle2,  className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  recusado:  { label: "Recusado",  icon: XCircle,       className: "bg-destructive/10 text-destructive" },
  expirado:  { label: "Expirado",  icon: AlertCircle,   className: "bg-orange-500/10 text-orange-500" },
  cancelado: { label: "Cancelado", icon: XCircle,       className: "bg-muted text-muted-foreground" },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function formatDate(d: string | null) {
  if (!d) return "-"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export function ContratosContent() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovo, setShowNovo] = useState(false)
  const [detalhe, setDetalhe] = useState<Contrato | null>(null)
  const [busca, setBusca] = useState("")
  const [syncing, setSyncing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/assinafy/contratos")
      const data = await res.json()
      setContratos(data.lista ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function syncAll() {
    setSyncing(true)
    await fetch("/api/assinafy/sync", { method: "POST" })
    await load()
    setSyncing(false)
  }

  useEffect(() => { load() }, [])

  const filtrados = busca.length < 2 ? contratos : contratos.filter((c) => {
    const q = busca.toLowerCase()
    return (c.titulo?.toLowerCase().includes(q)) ||
      (c.nome_paciente?.toLowerCase().includes(q)) ||
      (c.email_paciente?.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Buscar contrato, paciente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={syncAll} disabled={syncing} className="gap-1.5 h-9">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> Sincronizar
          </Button>
          <Button size="sm" onClick={() => setShowNovo(true)} className="gap-2 h-9">
            <Plus className="w-4 h-4" /> Novo Contrato
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{filtrados.length} contrato{filtrados.length !== 1 ? "s" : ""}</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <FileSignature className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhum contrato ainda</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Crie o primeiro contrato para enviar ao paciente para assinatura digital.
          </p>
          <Button size="sm" onClick={() => setShowNovo(true)} className="mt-1 gap-2">
            <Plus className="w-4 h-4" /> Criar Contrato
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c) => {
            const s = STATUS_MAP[c.status]
            return (
              <Card
                key={c.id}
                className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setDetalhe(c)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileSignature className="w-4 h-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{c.titulo}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.className}`}>
                        <s.icon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.nome_paciente ?? "-"} · {c.email_paciente ?? "-"}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(c.created_at)}
                        </span>
                        {c.signed_at && (
                          <span className="text-[11px] text-green-500">
                            Assinado {formatDate(c.signed_at)}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {detalhe && (
        <ContratoDetalheSheet
          contrato={detalhe}
          open={!!detalhe}
          onClose={() => setDetalhe(null)}
        />
      )}

      <ContratoNovoSheet
        open={showNovo}
        onClose={() => setShowNovo(false)}
        onSuccess={() => { setShowNovo(false); load() }}
      />
    </div>
  )
}
