"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileSignature, Plus, Trash2, Upload, FileText, X, Loader2 } from "lucide-react"
import { useUser } from "@/context/user-context"

interface Template {
  id: string
  nome: string
  descricao: string | null
  storage_path: string
  created_at: string
}

export function TemplatesContent() {
  const { user } = useUser()
  const fileRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/assinafy/templates")
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function salvarTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !nome) return
    setSalvando(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("nome", nome)
      if (descricao) form.append("descricao", descricao)
      if (user?.id) form.append("created_by", user.id)

      const res = await fetch("/api/assinafy/templates", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setNome(""); setDescricao(""); setFile(null); setShowForm(false)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar template.")
    } finally { setSalvando(false) }
  }

  async function deletarTemplate(id: string) {
    if (!confirm("Tem certeza que deseja excluir este template?")) return
    setDeletando(id)
    try {
      await fetch("/api/assinafy/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      load()
    } finally { setDeletando(null) }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Template
        </Button>
      </div>

      {/* Form de novo template */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={salvarTemplate} className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Cadastrar Template</p>

            <div className="space-y-1.5">
              <Label>Nome do template</Label>
              <Input placeholder="Ex: Termo de Consentimento" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input placeholder="Breve descrição do template" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>

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
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Selecionar PDF</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setShowForm(false); setNome(""); setDescricao(""); setFile(null) }}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="flex-1" disabled={!file || !nome || salvando}>
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
        </div>
      ) : templates.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <FileSignature className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhum template cadastrado</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Cadastre templates para reutilizar PDFs ao criar contratos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileSignature className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.nome}</p>
                  {t.descricao && <p className="text-xs text-muted-foreground mt-0.5">{t.descricao}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">{formatDate(t.created_at)}</p>
                </div>
                <button
                  onClick={() => deletarTemplate(t.id)}
                  disabled={deletando === t.id}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                >
                  {deletando === t.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
