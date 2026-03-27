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

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome)
      setRole(usuario.role)
      setModulos(usuario.modulos ?? DEFAULT_MODULOS)
      setError("")
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

  return (
    <Sheet open={!!usuario} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="overflow-y-auto">
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
