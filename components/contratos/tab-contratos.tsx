"use client"

import { useEffect, useState } from "react"
import { FileSignature, Plus, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContratoNovoSheet } from "./contrato-novo-sheet"
import { ContratoDetalheSheet } from "./contrato-detalhe-sheet"
import type { Contrato } from "./contratos-content"

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

interface Props {
  pacienteId: number
  nomePaciente: string
  emailPaciente: string | null
}

export function TabContratos({ pacienteId, nomePaciente, emailPaciente }: Props) {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovo, setShowNovo] = useState(false)
  const [detalhe, setDetalhe] = useState<Contrato | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/assinafy/contratos?paciente_id=${pacienteId}`)
      const data = await res.json()
      setContratos(data.lista ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [pacienteId])

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
    </div>
  )

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{contratos.length} contrato{contratos.length !== 1 ? "s" : ""}</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => setShowNovo(true)}>
          <Plus className="w-3.5 h-3.5" /> Novo
        </Button>
      </div>

      {contratos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum contrato enviado.</p>
          <Button size="sm" className="mt-1 gap-1.5 text-xs" onClick={() => setShowNovo(true)}>
            <Plus className="w-3.5 h-3.5" /> Criar contrato
          </Button>
        </div>
      ) : (
        contratos.map((c) => {
          const s = STATUS_MAP[c.status]
          return (
            <Card
              key={c.id}
              className="p-3 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setDetalhe(c)}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <p className="text-sm font-medium text-foreground leading-tight flex-1 truncate">{c.titulo}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.className}`}>
                  <s.icon className="w-3 h-3" />
                  {s.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                  {c.signed_at && (
                    <p className="text-xs text-green-500 mt-0.5">Assinado {formatDate(c.signed_at)}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          )
        })
      )}

      <ContratoNovoSheet
        open={showNovo}
        onClose={() => setShowNovo(false)}
        onSuccess={() => { setShowNovo(false); load() }}
        pacienteId={pacienteId}
        nomePaciente={nomePaciente}
        emailPaciente={emailPaciente ?? ""}
      />

      {detalhe && (
        <ContratoDetalheSheet
          contrato={detalhe}
          open={!!detalhe}
          onClose={() => setDetalhe(null)}
        />
      )}
    </div>
  )
}
