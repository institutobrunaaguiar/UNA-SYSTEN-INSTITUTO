// components/admin/admin-lista-usuarios.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { AdminEditarUsuario } from "./admin-editar-usuario"

export interface UserProfile {
  id: string
  nome: string
  email: string
  role: "admin" | "operador" | "visualizador"
  ativo: boolean
  modulos: string[]
  created_at: string
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin:        { label: "Admin",       className: "bg-indigo-500/10 text-indigo-400" },
  operador:     { label: "Operador",    className: "bg-blue-500/10 text-blue-400" },
  visualizador: { label: "Visualizador",className: "bg-stone-500/10 text-stone-400" },
}

export function AdminListaUsuarios() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<UserProfile | null>(null)

  async function fetchUsuarios() {
    const { data } = await getSupabase()
      .from("user_profiles")
      .select("*")
      .order("created_at")
    if (data) setUsuarios(data as UserProfile[])
    setLoading(false)
  }

  useEffect(() => { fetchUsuarios() }, [])

  async function toggleAtivo(usuario: UserProfile) {
    await fetch("/api/admin/update-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: usuario.id, ativo: !usuario.ativo }),
    })
    fetchUsuarios()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuarios.map((u) => {
              const role = ROLE_CONFIG[u.role] ?? { label: u.role, className: "" }
              return (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{u.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${role.className}`}>
                      {role.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.ativo ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditando(u)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAtivo(u)}>
                          {u.ativo ? "Desativar" : "Reativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhum usuário cadastrado.</p>
        )}
      </div>

      <AdminEditarUsuario
        usuario={editando}
        onClose={() => setEditando(null)}
        onSaved={() => { setEditando(null); fetchUsuarios() }}
      />
    </>
  )
}
