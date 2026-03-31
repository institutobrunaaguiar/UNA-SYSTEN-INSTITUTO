"use client"

import { useState, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, Loader2, CheckCircle2, Copy, Check } from "lucide-react"
import { useUser } from "@/context/user-context"

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  pacienteId?: number
  nomePaciente?: string
  emailPaciente?: string
}

type Step = "form" | "uploading" | "sending" | "done" | "error"

export function ContratoNovoSheet({ open, onClose, onSuccess, pacienteId, nomePaciente, emailPaciente }: Props) {
  const { user } = useUser()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("form")
  const [file, setFile] = useState<File | null>(null)
  const [titulo, setTitulo] = useState("")
  const [nome, setNome] = useState(nomePaciente ?? "")
  const [email, setEmail] = useState(emailPaciente ?? "")
  const [whatsapp, setWhatsapp] = useState("")
  const [pacId, setPacId] = useState(pacienteId ? String(pacienteId) : "")
  const [mensagem, setMensagem] = useState("")
  const [erroMsg, setErroMsg] = useState("")
  const [signingUrl, setSigningUrl] = useState("")
  const [copied, setCopied] = useState(false)

  function reset() {
    setStep("form")
    setFile(null)
    setTitulo("")
    setNome(nomePaciente ?? "")
    setEmail(emailPaciente ?? "")
    setWhatsapp("")
    setPacId(pacienteId ? String(pacienteId) : "")
    setMensagem("")
    setErroMsg("")
    setSigningUrl("")
    setCopied(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function copyUrl() {
    navigator.clipboard.writeText(signingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !titulo || !nome || !email || !pacId) return

    try {
      // 1. Upload do PDF
      setStep("uploading")
      const form = new FormData()
      form.append("file", file, file.name)
      const uploadRes = await fetch("/api/assinafy/upload", { method: "POST", body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Erro no upload.")

      // 2. Criar assignment e salvar
      setStep("sending")
      const enviarRes = await fetch("/api/assinafy/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: parseInt(pacId),
          titulo,
          nome_paciente: nome,
          email_paciente: email,
          whatsapp: whatsapp || undefined,
          mensagem: mensagem || undefined,
          assinafy_document_id: uploadData.document_id,
          created_by: user?.id,
        }),
      })
      const enviarData = await enviarRes.json()
      if (!enviarRes.ok) throw new Error(enviarData.error || "Erro ao enviar.")

      setSigningUrl(enviarData.signing_url ?? "")
      setStep("done")
    } catch (err: unknown) {
      setErroMsg(err instanceof Error ? err.message : "Erro desconhecido.")
      setStep("error")
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Novo Contrato</SheetTitle>
        </SheetHeader>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div className="space-y-1.5">
              <Label>Título do contrato</Label>
              <Input
                placeholder="Ex: Termo de Consentimento"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>

            {/* PDF */}
            <div className="space-y-1.5">
              <Label>Arquivo PDF</Label>
              {file ? (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Clique para selecionar o PDF</span>
                  <span className="text-xs">Máximo 25MB</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Paciente */}
            {!pacienteId && (
              <div className="space-y-1.5">
                <Label>ID do Paciente (CNN)</Label>
                <Input
                  placeholder="Ex: 12345"
                  value={pacId}
                  onChange={(e) => setPacId(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Nome do paciente</Label>
              <Input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>E-mail do paciente</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>WhatsApp <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                placeholder="+5511999990000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mensagem <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                placeholder="Mensagem para o paciente"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={!file || !titulo || !nome || !email || !pacId}>
                Enviar para Assinatura
              </Button>
            </div>
          </form>
        )}

        {(step === "uploading" || step === "sending") && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {step === "uploading" ? "Fazendo upload do documento..." : "Enviando para assinatura..."}
            </p>
            <p className="text-xs text-muted-foreground">Aguarde um momento</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Contrato enviado com sucesso!</p>
              <p className="text-xs text-muted-foreground mt-1">
                O paciente receberá o link por e-mail para assinar.
              </p>
            </div>
            {signingUrl && (
              <div className="w-full">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Link de assinatura</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-left">
                  <span className="text-xs text-foreground truncate flex-1">{signingUrl}</span>
                  <button onClick={copyUrl} className="text-muted-foreground hover:text-foreground shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <Button className="w-full mt-2" onClick={() => { reset(); onSuccess() }}>
              Concluir
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ocorreu um erro</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">{erroMsg}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Fechar</Button>
              <Button className="flex-1" onClick={() => setStep("form")}>Tentar novamente</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
