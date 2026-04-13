// components/admin/admin-editar-usuario.tsx
"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModulosSelector } from "./modulos-selector"
import type { UserProfile } from "./admin-lista-usuarios"

interface Props {
  usuario: UserProfile | null
  onClose: () => void
  onSaved: () => void
}

const DEFAULT_MODULOS = ["painel", "proposta", "calendario", "relatorios", "pacientes"]

export function AdminEditarUsuario({ usuario, onClose, onSaved }: Props) {
  const [nome, setNome] = useState("")
  const [role, setRole] = useState<"admin" | "operador" | "visualizador">("operador")
  const [modulos, setModulos] = useState<string[]>(DEFAULT_MODULOS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmSenha, setConfirmSenha] = useState("")
  const [resetando, setResetando] = useState(false)
  const [resetMsg, setResetMsg] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null)

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome)
      setRole(usuario.role)
      setModulos(usuario.modulos ?? DEFAULT_MODULOS)
      setError("")
      setNovaSenha("")
      setConfirmSenha("")
      setResetMsg(null)
    }
  }, [usuario])

  async function handleSave() {
    if (!usuario) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/update-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: usuario.id, nome, role, modulos }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) {
      setError(data.error)
    } else {
      onSaved()
    }
  }

  async function handleResetSenha() {
    if (!usuario) return
    setResetMsg(null)

    if (novaSenha.length < 8) {
      setResetMsg({ tipo: "erro", texto: "A senha deve ter no mínimo 8 caracteres." })
      return
    }
    if (novaSenha !== confirmSenha) {
      setResetMsg({ tipo: "erro", texto: "As senhas não coincidem." })
      return
    }

    setResetando(true)
    const res = await fetch("/api/admin/reset-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: usuario.id, password: novaSenha }),
    })
    const data = await res.json()
    setResetando(false)

    if (data.error) {
      setResetMsg({ tipo: "erro", texto: data.error })
    } else {
      setResetMsg({ tipo: "sucesso", texto: "Senha redefinida com sucesso." })
      setNovaSenha("")
      setConfirmSenha("")
    }
  }

  return (
    <Sheet open={!!usuario} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar Usuário</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">E-mail</Label>
            <Input value={usuario?.email ?? ""} disabled className="opacity-50" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nível de Acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ModulosSelector value={modulos} onChange={setModulos} />

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <div className="border-t border-border pt-5 space-y-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Redefinir Senha</p>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Confirmar Nova Senha</Label>
              <Input
                type="password"
                placeholder="Repita a nova senha"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
              />
            </div>
            {resetMsg && (
              <p className={`text-sm ${resetMsg.tipo === "sucesso" ? "text-green-600" : "text-destructive"}`}>
                {resetMsg.texto}
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResetSenha}
              disabled={resetando || !novaSenha || !confirmSenha}
            >
              {resetando ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
