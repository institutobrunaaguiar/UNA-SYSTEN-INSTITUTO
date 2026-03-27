// components/admin/admin-cadastrar-usuario.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { ModulosSelector } from "./modulos-selector"

const DEFAULT_MODULOS = ["painel", "proposta", "calendario", "relatorios", "pacientes"]

export function AdminCadastrarUsuario() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "operador" | "visualizador">("operador")
  const [modulos, setModulos] = useState<string[]>(DEFAULT_MODULOS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, password, role, modulos }),
    })
    const data = await res.json()
    setSaving(false)

    if (data.error) {
      setError(data.error)
    } else {
      setSuccess(true)
      setNome("")
      setEmail("")
      setPassword("")
      setRole("operador")
      setModulos(DEFAULT_MODULOS)
    }
  }

  return (
    <Card className="p-6 max-w-lg">
      <h3 className="text-sm font-semibold text-foreground mb-4">Novo Usuário</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do usuário" required />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" required />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Senha inicial</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nível de acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ModulosSelector value={modulos} onChange={setModulos} />

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-green-500 text-sm">
            <CheckCircle className="w-4 h-4" />
            Usuário criado com sucesso.
          </div>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? "Criando..." : "Criar Usuário"}
        </Button>
      </form>
    </Card>
  )
}
