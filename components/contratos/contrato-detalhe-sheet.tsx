"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Eye, FileSignature,
  Send, Copy, Check, ExternalLink, RefreshCw, Loader2, Mail,
  Download, User, MessageCircle,
} from "lucide-react"
import type { Contrato } from "./contratos-content"

/* ---------- types ---------- */
interface Atividade {
  id: string
  type: string
  created_at: string | number
  description?: string
  actor?: { name?: string; email?: string }
}

interface Signatario {
  id: string
  full_name: string
  email: string
  status?: string
  signed_at?: string | number | null
}

interface DocDetalhes {
  status: string
  name: string
  assignment?: { id?: string; signers?: Signatario[] }
  artifacts?: { original?: string; certificated?: string }
}

/* ---------- constants ---------- */
const STATUS_MAP: Record<Contrato["status"], { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  rascunho:  { label: "Rascunho",  icon: Clock,         className: "bg-muted text-muted-foreground" },
  pendente:  { label: "Pendente",  icon: Clock,         className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  assinado:  { label: "Assinado",  icon: CheckCircle2,  className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  recusado:  { label: "Recusado",  icon: XCircle,       className: "bg-destructive/10 text-destructive" },
  expirado:  { label: "Expirado",  icon: AlertCircle,   className: "bg-orange-500/10 text-orange-500" },
  cancelado: { label: "Cancelado", icon: XCircle,       className: "bg-muted text-muted-foreground" },
}

const ACTIVITY_INFO: Record<string, { label: string; desc: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  document_uploaded:        { label: "Documento criado",         desc: "O PDF foi enviado para a plataforma de assinatura.",                          icon: Send,          className: "text-blue-500" },
  document_metadata_ready:  { label: "Documento processado",     desc: "O documento foi processado e está pronto para configuração.",                  icon: FileSignature, className: "text-blue-400" },
  document_prepared:        { label: "Documento preparado",      desc: "O documento foi preparado com os campos de assinatura.",                       icon: FileSignature, className: "text-blue-400" },
  signature_requested:      { label: "Solicitação enviada",      desc: "O link de assinatura foi enviado por e-mail para o paciente.",                 icon: Send,          className: "text-primary" },
  signer_created:           { label: "Signatário registrado",    desc: "O paciente foi cadastrado como signatário do documento.",                      icon: Mail,          className: "text-muted-foreground" },
  signer_email_verified:    { label: "E-mail verificado",        desc: "O paciente confirmou o acesso pelo e-mail enviado.",                           icon: CheckCircle2,  className: "text-green-500" },
  signer_whatsapp_verified: { label: "WhatsApp verificado",      desc: "O paciente confirmou pelo WhatsApp.",                                         icon: CheckCircle2,  className: "text-green-500" },
  signer_data_confirmed:    { label: "Dados confirmados",        desc: "O paciente verificou e confirmou seus dados pessoais.",                        icon: CheckCircle2,  className: "text-green-400" },
  signer_viewed_document:   { label: "Documento visualizado",    desc: "O paciente abriu e visualizou o documento pela primeira vez.",                 icon: Eye,           className: "text-yellow-500" },
  signer_signed_document:   { label: "Documento assinado",       desc: "O paciente assinou o documento digitalmente.",                                 icon: CheckCircle2,  className: "text-green-600" },
  document_ready:           { label: "Assinatura concluída",     desc: "Todos os signatários assinaram. O documento certificado está disponível.",     icon: CheckCircle2,  className: "text-green-600" },
  signer_rejected_document: { label: "Assinatura recusada",      desc: "O paciente recusou assinar o documento.",                                     icon: XCircle,       className: "text-destructive" },
  user_rejected_document:   { label: "Documento cancelado",      desc: "O documento foi cancelado pelo administrador.",                                icon: XCircle,       className: "text-destructive" },
}

/* ---------- helpers ---------- */
function formatDate(val: string | number | null) {
  if (!val) return "-"
  const d = typeof val === "number" ? new Date(val * 1000) : new Date(val)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function buildWhatsAppUrl(phone: string | null, url: string | null, nome: string | null) {
  if (!phone || !url) return null
  const num = phone.replace(/\D/g, "")
  const text = encodeURIComponent(`Olá${nome ? ` ${nome.split(" ")[0]}` : ""}, tudo bem? Segue seu termo de consentimento para assinatura digital:\n\n${url}`)
  return `https://wa.me/${num}?text=${text}`
}

/* ---------- component ---------- */
interface Props {
  contrato: Contrato & { assinafy_assignment_id?: string | null; assinafy_signer_id?: string | null; telefone?: string | null }
  open: boolean
  onClose: () => void
  onStatusUpdated?: () => void
}

export function ContratoDetalheSheet({ contrato, open, onClose, onStatusUpdated }: Props) {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [docDetalhes, setDocDetalhes] = useState<DocDetalhes | null>(null)
  const [loadingAtiv, setLoadingAtiv] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [erroReenvio, setErroReenvio] = useState("")
  const [syncing, setSyncing] = useState(false)
  const [localStatus, setLocalStatus] = useState(contrato.status)
  const [localSignedAt, setLocalSignedAt] = useState(contrato.signed_at)

  const s = STATUS_MAP[localStatus]

  async function carregarTudo() {
    if (!contrato.assinafy_document_id) return
    setLoadingAtiv(true); setLoadingDoc(true)
    const [ativRes, docRes] = await Promise.all([
      fetch(`/api/assinafy/atividades?document_id=${contrato.assinafy_document_id}`),
      fetch(`/api/assinafy/documento?document_id=${contrato.assinafy_document_id}`),
    ])
    const ativData = await ativRes.json()
    setAtividades(ativData.activities ?? [])
    setLoadingAtiv(false)
    const docData = await docRes.json()
    setDocDetalhes(docData.documento ?? null)
    setLoadingDoc(false)

    // Auto-sync: se Assinafy mostra certificated mas nosso status é pendente
    const docStatus = docData?.documento?.status
    if (docStatus === "certificated" && localStatus === "pendente") {
      await syncStatus()
    }
  }

  async function syncStatus() {
    setSyncing(true)
    try {
      await fetch("/api/assinafy/sync", { method: "POST" })
      // Recarregar contrato
      const res = await fetch(`/api/assinafy/contratos?paciente_id=${contrato.paciente_id}`)
      const data = await res.json()
      const updated = (data.lista ?? []).find((c: Contrato) => c.id === contrato.id)
      if (updated) {
        setLocalStatus(updated.status)
        setLocalSignedAt(updated.signed_at)
      }
      onStatusUpdated?.()
    } finally { setSyncing(false) }
  }

  useEffect(() => {
    if (open) { setLocalStatus(contrato.status); setLocalSignedAt(contrato.signed_at); carregarTudo() }
  }, [open, contrato.id])

  async function reenviar() {
    const assignId = contrato.assinafy_assignment_id ?? docDetalhes?.assignment?.id
    if (!contrato.assinafy_document_id || !assignId || !contrato.assinafy_signer_id) {
      setErroReenvio("Dados insuficientes para reenvio."); return
    }
    setReenviando(true); setErroReenvio("")
    try {
      const res = await fetch("/api/assinafy/reenviar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: contrato.assinafy_document_id, assignment_id: assignId, signer_id: contrato.assinafy_signer_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReenviado(true); setTimeout(() => setReenviado(false), 4000)
    } catch (err: unknown) {
      setErroReenvio(err instanceof Error ? err.message : "Erro ao reenviar.")
    } finally { setReenviando(false) }
  }

  const signers = docDetalhes?.assignment?.signers ?? []
  const isAssinado = localStatus === "assinado" || docDetalhes?.status === "certificated"
  const whatsUrl = buildWhatsAppUrl(contrato.telefone ?? null, contrato.url_assinatura, contrato.nome_paciente)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-base leading-tight pr-6">{contrato.titulo}</SheetTitle>
        </SheetHeader>

        {/* Status + sync */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.className}`}>
            <s.icon className="w-3.5 h-3.5" />{s.label}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={syncStatus} disabled={syncing} className="text-muted-foreground hover:text-foreground transition-colors" title="Sincronizar status">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            </button>
            <span className="text-xs text-muted-foreground">{formatDate(contrato.created_at)}</span>
          </div>
        </div>

        {/* Paciente */}
        <div className="p-3 bg-muted rounded-lg mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Paciente</p>
          <p className="text-sm font-medium text-foreground">{contrato.nome_paciente ?? "-"}</p>
          <p className="text-xs text-muted-foreground">{contrato.email_paciente ?? "-"}</p>
        </div>

        {/* Downloads */}
        {contrato.assinafy_document_id && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Downloads</p>
            <div className="grid grid-cols-2 gap-2">
              {isAssinado && (
                <a href={`/api/assinafy/download?document_id=${contrato.assinafy_document_id}&artifact=certificated`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors">
                  <Download className="w-4 h-4 shrink-0" /><span className="text-xs">Assinado</span>
                </a>
              )}
              <a href={`/api/assinafy/download?document_id=${contrato.assinafy_document_id}&artifact=original`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
                <Download className="w-4 h-4 shrink-0 text-muted-foreground" /><span className="text-xs">Original</span>
              </a>
            </div>
          </div>
        )}

        {localSignedAt && (
          <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400">Assinado em</p>
              <p className="text-xs text-muted-foreground">{formatDate(localSignedAt)}</p>
            </div>
          </div>
        )}

        {/* Link + WhatsApp */}
        {contrato.url_assinatura && localStatus === "pendente" && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Link de assinatura</p>
            <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
              <span className="text-xs text-foreground truncate flex-1">{contrato.url_assinatura}</span>
              <CopyButton text={contrato.url_assinatura} />
              <a href={contrato.url_assinatura} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
            {whatsUrl && (
              <a href={whatsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium">
                <MessageCircle className="w-4 h-4" /> Enviar pelo WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Reenviar */}
        {localStatus === "pendente" && (
          <div className="mb-4 space-y-1">
            <Button variant="outline" className="w-full gap-2" onClick={reenviar} disabled={reenviando}>
              {reenviando ? <Loader2 className="w-4 h-4 animate-spin" /> : reenviado ? <Check className="w-4 h-4 text-green-500" /> : <RefreshCw className="w-4 h-4" />}
              {reenviando ? "Reenviando..." : reenviado ? "E-mail reenviado!" : "Reenviar por e-mail"}
            </Button>
            {erroReenvio && <p className="text-xs text-destructive text-center">{erroReenvio}</p>}
          </div>
        )}

        {/* Signatários */}
        {signers.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Signatários</p>
            <div className="space-y-2">
              {signers.map((sig) => (
                <div key={sig.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sig.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{sig.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${sig.status === "signed" || sig.signed_at ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"}`}>
                    {sig.status === "signed" || sig.signed_at ? <><CheckCircle2 className="w-3 h-3" /> Assinado</> : <><Clock className="w-3 h-3" /> Pendente</>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingDoc && signers.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando detalhes...
          </div>
        )}

        {/* Histórico */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Histórico do documento</p>
            <button onClick={carregarTudo} className="text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAtiv ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingAtiv ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : atividades.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma atividade registrada.</p>
          ) : (
            <div className="relative pl-5">
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />
              <div className="space-y-4">
                {atividades.map((a, i) => {
                  const info = ACTIVITY_INFO[a.type] ?? { label: a.type, desc: "", icon: Clock, className: "text-muted-foreground" }
                  return (
                    <div key={a.id ?? i} className="flex items-start gap-3 relative">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 -ml-0.5 bg-background border-2 border-border">
                        <info.icon className={`w-2.5 h-2.5 ${info.className}`} />
                      </div>
                      <div className="flex-1 min-w-0 -mt-0.5">
                        <p className="text-xs font-semibold text-foreground">{info.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {a.description || info.desc}
                        </p>
                        {a.actor?.name && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{a.actor.name}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(a.created_at)}</p>
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
