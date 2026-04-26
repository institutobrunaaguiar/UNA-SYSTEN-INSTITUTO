"use client"

import { useState, useRef, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload, FileText, X, Loader2, CheckCircle2, Copy, Check,
  Search, User, Stethoscope, FileSignature,
} from "lucide-react"
import { useUser } from "@/context/user-context"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

interface PacienteResult {
  id: number
  nome: string
  cpf_cnpj: string | null
  email: string | null
  telefone_celular: string | null
}

interface Procedimento {
  id: number
  nome: string
  tipo: string
  valor: number
}

interface Template {
  id: string
  nome: string
  descricao: string | null
  storage_path: string
}

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
  const searchRef = useRef<HTMLDivElement>(null)
  const servicoRef = useRef<HTMLDivElement>(null)

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

  // Paciente search
  const [searchTerm, setSearchTerm] = useState(nomePaciente ?? "")
  const [searchResults, setSearchResults] = useState<PacienteResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteResult | null>(null)

  // Serviço search
  const [servicoTerm, setServicoTerm] = useState("")
  const [servicoResults, setServicoResults] = useState<Procedimento[]>([])
  const [servicoBuscando, setServicoBuscando] = useState(false)
  const [showServicoDropdown, setShowServicoDropdown] = useState(false)
  const [servicoSelecionado, setServicoSelecionado] = useState<Procedimento | null>(null)

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Carregar templates ao abrir
  useEffect(() => {
    if (open) {
      setLoadingTemplates(true)
      fetch("/api/assinafy/templates")
        .then((r) => r.json())
        .then((d) => setTemplates(d.templates ?? []))
        .finally(() => setLoadingTemplates(false))
    }
  }, [open])

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
      if (servicoRef.current && !servicoRef.current.contains(e.target as Node)) setShowServicoDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Paciente debounce
  useEffect(() => {
    if (pacienteId) return
    if (searchTerm.length < 2) { setSearchResults([]); setShowDropdown(false); return }
    const t = setTimeout(() => buscarPacientes(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Serviço debounce
  useEffect(() => {
    if (servicoTerm.length < 2) { setServicoResults([]); setShowServicoDropdown(false); return }
    const t = setTimeout(() => buscarServicos(servicoTerm), 300)
    return () => clearTimeout(t)
  }, [servicoTerm])

  async function buscarPacientes(term: string) {
    setSearching(true)
    try {
      const { data } = await getSupabase()
        .from("pacientes").select("id, nome, cpf_cnpj, email, telefone_celular")
        .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%`).eq("ativo", true).limit(8)
      setSearchResults(data ?? [])
      setShowDropdown((data?.length ?? 0) > 0)
    } finally { setSearching(false) }
  }

  async function buscarServicos(term: string) {
    setServicoBuscando(true)
    try {
      const { data } = await getSupabase()
        .from("procedimentos_clinica").select("id, nome, tipo, valor")
        .ilike("nome", `%${term}%`).eq("ativo", true).limit(8)
      setServicoResults(data ?? [])
      setShowServicoDropdown((data?.length ?? 0) > 0)
    } finally { setServicoBuscando(false) }
  }

  function selecionarPaciente(p: PacienteResult) {
    setPacienteSelecionado(p); setSearchTerm(p.nome); setPacId(String(p.id))
    setNome(p.nome); setEmail(p.email ?? ""); setWhatsapp(p.telefone_celular ?? "")
    setShowDropdown(false); setSearchResults([])
  }

  function limparPaciente() {
    setPacienteSelecionado(null); setSearchTerm(""); setPacId(""); setNome(""); setEmail(""); setWhatsapp("")
  }

  function selecionarServico(p: Procedimento) {
    setServicoSelecionado(p); setServicoTerm(p.nome)
    setShowServicoDropdown(false); setServicoResults([])
  }

  function limparServico() { setServicoSelecionado(null); setServicoTerm("") }

  function selecionarTemplate(t: Template) {
    setTemplateSelecionado(t)
    setFile(null) // limpa upload manual
    if (!titulo) setTitulo(t.nome) // preenche título se vazio
  }

  function limparTemplate() { setTemplateSelecionado(null) }

  function reset() {
    setStep("form"); setFile(null); setTitulo(""); setNome(nomePaciente ?? ""); setEmail(emailPaciente ?? "")
    setWhatsapp(""); setPacId(pacienteId ? String(pacienteId) : ""); setMensagem(""); setErroMsg("")
    setSigningUrl(""); setCopied(false); setSearchTerm(nomePaciente ?? "")
    setPacienteSelecionado(null); setSearchResults([]); setShowDropdown(false)
    setServicoSelecionado(null); setServicoTerm(""); setServicoResults([]); setShowServicoDropdown(false)
    setTemplateSelecionado(null)
  }

  function handleClose() { reset(); onClose() }

  function copyUrl() {
    navigator.clipboard.writeText(signingUrl); setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!file && !templateSelecionado) || !titulo || !nome || !email || !pacId) return

    try {
      setStep("uploading")
      let uploadFile = file

      // Se template selecionado, baixar PDF do storage
      if (!uploadFile && templateSelecionado) {
        const supabase = getSupabase()
        const { data: blob } = await supabase.storage
          .from("contrato-templates")
          .download(templateSelecionado.storage_path)
        if (!blob) throw new Error("Erro ao baixar template.")
        uploadFile = new File([blob], `${templateSelecionado.nome}.pdf`, { type: "application/pdf" })
      }

      if (!uploadFile) throw new Error("Nenhum arquivo selecionado.")

      const form = new FormData()
      form.append("file", uploadFile, uploadFile.name)
      const uploadRes = await fetch("/api/assinafy/upload", { method: "POST", body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Erro no upload.")

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
          servico_nome: servicoSelecionado?.nome || undefined,
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

  const hasFile = !!file || !!templateSelecionado
  const canSubmit = hasFile && !!titulo && !!nome && !!email && !!pacId

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header fixo */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 pt-4 pb-3 shrink-0">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors mr-1"
              >
                <X className="w-4 h-4" />
              </button>
              <SheetTitle className="text-sm font-semibold text-muted-foreground">
                Novo Contrato
              </SheetTitle>
            </div>
          </SheetHeader>
          <p className="text-xl font-bold text-foreground leading-tight">
            {nomePaciente || (pacienteSelecionado?.nome) || "Selecione um paciente"}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Preencha os dados e envie para assinatura
          </p>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {step === "form" && (
            <form id="contrato-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Título */}
              <div className="space-y-1.5">
                <Label>Título do contrato</Label>
                <Input placeholder="Ex: Termo de Consentimento" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              </div>

              {/* Template ou Upload */}
              <div className="space-y-1.5">
                <Label>Documento</Label>
                {templateSelecionado ? (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <FileSignature className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{templateSelecionado.nome}</p>
                      <p className="text-xs text-muted-foreground">Template salvo</p>
                    </div>
                    <button type="button" onClick={limparTemplate} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : file ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Usar um template</p>
                        <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => selecionarTemplate(t)}
                              className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-accent transition-colors text-left"
                            >
                              <FileSignature className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate">{t.nome}</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] text-muted-foreground">ou</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-sm font-medium">Enviar PDF</span>
                      <span className="text-xs">Máximo 25MB</span>
                    </button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setTemplateSelecionado(null) }} />
              </div>

              {/* Busca de Paciente */}
              {!pacienteId && (
                <div className="space-y-1.5">
                  <Label>Paciente</Label>
                  {pacienteSelecionado ? (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{pacienteSelecionado.nome}</p>
                        <p className="text-xs text-muted-foreground">{pacienteSelecionado.email ?? "sem e-mail"}</p>
                      </div>
                      <button type="button" onClick={limparPaciente} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div ref={searchRef} className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
                        <Input placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => searchResults.length > 0 && setShowDropdown(true)} className="pl-9" />
                      </div>
                      {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                          {searchResults.map((p) => (
                            <button key={p.id} type="button" onClick={() => selecionarPaciente(p)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                                <p className="text-xs text-muted-foreground">{p.email ?? "sem e-mail"} · ID {p.id}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Serviço / Procedimento */}
              <div className="space-y-1.5">
                <Label>Serviço <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                {servicoSelecionado ? (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{servicoSelecionado.nome}</p>
                      <p className="text-xs text-muted-foreground">{servicoSelecionado.tipo}</p>
                    </div>
                    <button type="button" onClick={limparServico} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div ref={servicoRef} className="relative">
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      {servicoBuscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
                      <Input placeholder="Buscar procedimento..." value={servicoTerm} onChange={(e) => setServicoTerm(e.target.value)} onFocus={() => servicoResults.length > 0 && setShowServicoDropdown(true)} className="pl-9" />
                    </div>
                    {showServicoDropdown && servicoResults.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {servicoResults.map((p) => (
                          <button key={p.id} type="button" onClick={() => selecionarServico(p)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
                            <Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                              <p className="text-xs text-muted-foreground">{p.tipo}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label>E-mail para assinatura</Label>
                <Input type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label>WhatsApp <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                <Input placeholder="+5511999990000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Mensagem <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                <Input placeholder="Mensagem para o paciente" value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
              </div>
            </form>
          )}

          {(step === "uploading" || step === "sending") && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">{step === "uploading" ? "Fazendo upload do documento..." : "Enviando para assinatura..."}</p>
              <p className="text-xs text-muted-foreground">Aguarde um momento</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Contrato enviado com sucesso!</p>
                <p className="text-xs text-muted-foreground mt-1">O paciente receberá o link por e-mail para assinar.</p>
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
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ocorreu um erro</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">{erroMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="sticky bottom-0 z-10 bg-card border-t border-border px-4 sm:px-6 py-3 shrink-0">
          {step === "form" && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" form="contrato-form" className="flex-1" disabled={!canSubmit}>
                Enviar para Assinatura
              </Button>
            </div>
          )}
          {(step === "uploading" || step === "sending") && (
            <Button variant="outline" className="w-full" disabled>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {step === "uploading" ? "Enviando arquivo..." : "Processando..."}
            </Button>
          )}
          {step === "done" && (
            <Button className="w-full" onClick={() => { reset(); onSuccess() }}>Concluir</Button>
          )}
          {step === "error" && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Fechar</Button>
              <Button className="flex-1" onClick={() => setStep("form")}>Tentar novamente</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
