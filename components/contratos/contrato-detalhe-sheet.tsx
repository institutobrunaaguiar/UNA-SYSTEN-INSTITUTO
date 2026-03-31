"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Eye, FileSignature,
  Send, Copy, Check, ExternalLink, RefreshCw, Loader2, Mail,
} from "lucide-react"
import type { Contrato } from "./contratos-content"

interface Atividade {
  id: string
  type: string
  created_at: string | number
  actor?: { name?: string; email?: string }
}

const STATUS_MAP: Record<Contrato["status"], { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  rascunho:  { label: "Rascunho",  icon: Clock,         className: "bg-muted text-muted-foreground" },
  pendente:  { label: "Pendente",  icon: Clock,         className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  assinado:  { label: "Assinado",  icon: CheckCircle2,  className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  recusado:  { label: "Recusado",  icon: XCircle,       className: "bg-destructive/10 text-destructive" },
  expirado:  { label: "Expirado",  icon: AlertCircle,   className: "bg-orange-500/10 text-orange-500" },
  cancelado: { label: "Cancelado", icon: XCircle,       className: "bg-muted text-muted-foreground" },
}

const ACTIVITY_LABEL: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  document_uploaded:        { label: "Documento enviado",       icon: Send,          className: "text-blue-500" },
  document_metadata_ready:  { label: "Documento processado",    icon: FileSignature, className: "text-blue-400" },
  document_prepared:        { label: "Documento preparado",     icon: FileSignature, className: "text-blue-400" },
  signature_requested:      { label: "Assinatura solicitada",   icon: Send,          className: "text-primary" },
  signer_created:           { label: "Signatário criado",       icon: Mail,          className: "text-muted-foreground" },
  signer_email_verified:    { label: "E-mail verificado",       icon: CheckCircle2,  className: "text-green-500" },
  signer_whatsapp_verified: { label: "WhatsApp verificado",     icon: CheckCircle2,  className: "text-green-500" },
  signer_data_confirmed:    { label: "Dados confirmados",       icon: CheckCircle2,  className: "text-green-400" },
  signer_viewed_document:   { label: "Documento visualizado",   icon: Eye,           className: "text-yellow-500" },
  signer_signed_document:   { label: "Documento assinado",      icon: CheckCircle2,  className: "text-green-600" },
  document_ready:           { label: "Todos assinaram",         icon: CheckCircle2,  className: "text-green-600" },
  signer_rejected_document: { label: "Assinatura recusada",     icon: XCircle,       className: "text-destructive" },
  user_rejected_document:   { label: "Documento cancelado",     icon: XCircle,       className: "text-destructive" },
}

function formatDate(val: string | number | null) {
  if (!val) return "-"
  const d = typeof val === "number" ? new Date(val * 1000) : new Date(val)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

interface Props {
  contrato: Contrato & { assinafy_assignment_id?: string | null }
  open: boolean
  onClose: () => void
}

export function ContratoDetalheSheet({ contrato, open, onClose }: Props) {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [loadingAtiv, setLoadingAtiv] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [erroReenvio, setErroReenvio] = useState("")

  const s = STATUS_MAP[contrato.status]

  async function carregarAtividades() {
    if (!contrato.assinafy_document_id) return
    setLoadingAtiv(true)
    try {
      const res = await fetch(`/api/assinafy/atividades?document_id=${contrato.assinafy_document_id}`)
      const data = await res.json()
      setAtividades(data.activities ?? [])
    } finally {
      setLoadingAtiv(false)
    }
  }

  useEffect(() => {
    if (open) carregarAtividades()
  }, [open, contrato.id])

  async function reenviar() {
    if (!contrato.assinafy_document_id || !(contrato as any).assinafy_assignment_id || !contrato.assinafy_signer_id) {
      setErroReenvio("Dados insuficientes para reenvio.")
      return
    }
    setReenviando(true)
    setErroReenvio("")
    try {
      const res = await fetch("/api/assinafy/reenviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: contrato.assinafy_document_id,
          assignment_id: (contrato as any).assinafy_assignment_id,
          signer_id: contrato.assinafy_signer_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReenviado(true)
      setTimeout(() => setReenviado(false), 4000)
      await carregarAtividades()
    } catch (err: unknown) {
      setErroReenvio(err instanceof Error ? err.message : "Erro ao reenviar.")
    } finally {
      setReenviando(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-base leading-tight">{contrato.titulo}</SheetTitle>
        </SheetHeader>

        {/* Status + info */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.className}`}>
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(contrato.created_at)}</span>
          </div>

          <div className="p-3 bg-muted rounded-lg space-y-1.5">
            <p className="text-xs text-muted-foreground">Paciente</p>
            <p className="text-sm font-medium text-foreground">{contrato.nome_paciente ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{contrato.email_paciente ?? "-"}</p>
          </div>

          {contrato.signed_at && (
            <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Assinado em</p>
                <p className="text-xs text-muted-foreground">{formatDate(contrato.signed_at)}</p>
              </div>
            </div>
          )}

          {/* Link de assinatura */}
          {contrato.url_assinatura && contrato.status === "pendente" && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Link de assinatura</p>
              <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                <span className="text-xs text-foreground truncate flex-1">{contrato.url_assinatura}</span>
                <CopyButton text={contrato.url_assinatura} />
                <a href={contrato.url_assinatura} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Certificado */}
          {contrato.url_certificado && (
            <a href={contrato.url_certificado} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg text-sm text-green-600 dark:text-green-400 hover:underline">
              <ExternalLink className="w-4 h-4" />
              Baixar documento certificado
            </a>
          )}

          {/* Botão reenviar */}
          {contrato.status === "pendente" && (
            <div className="space-y-1">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={reenviar}
                disabled={reenviando}
              >
                {reenviando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : reenviado ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {reenviando ? "Reenviando..." : reenviado ? "E-mail reenviado!" : "Reenviar notificação por e-mail"}
              </Button>
              {erroReenvio && <p className="text-xs text-destructive text-center">{erroReenvio}</p>}
            </div>
          )}
        </div>

        {/* Atividades */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico de atividades</p>
            <button onClick={carregarAtividades} className="text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAtiv ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingAtiv ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : atividades.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma atividade registrada.</p>
          ) : (
            <div className="relative pl-4">
              {/* linha vertical */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {atividades.map((a, i) => {
                  const info = ACTIVITY_LABEL[a.type] ?? { label: a.type, icon: Clock, className: "text-muted-foreground" }
                  return (
                    <div key={a.id ?? i} className="flex items-start gap-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0 mt-0.5 -ml-px">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 min-w-0 -mt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <info.icon className={`w-3.5 h-3.5 shrink-0 ${info.className}`} />
                          <p className="text-sm font-medium text-foreground">{info.label}</p>
                        </div>
                        {a.actor?.name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{a.actor.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
