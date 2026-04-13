// components/admin/admin-lista-usuarios.tsx
"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin:        { label: "Admin",       className: "bg-indigo-500/10 text-indigo-400" },
  operador:     { label: "Operador",    className: "bg-blue-500/10 text-blue-400" },
  visualizador: { label: "Visualizador",className: "bg-stone-500/10 text-stone-400" },
}

export function AdminListaUsuarios() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<UserProfile | null>(null)
  const [excluindo, setExcluindo] = useState<UserProfile | null>(null)

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

  async function handleExcluir() {
    if (!excluindo) return
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: excluindo.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao excluir usuário")
        return
      }
      toast.success("Usuário excluído permanentemente")
      setExcluindo(null)
      fetchUsuarios()
    } catch {
      toast.error("Erro ao excluir usuário")
    }
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
              <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</th>
              <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível</th>
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
                  <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="hidden lg:table-cell px-4 py-3">
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setExcluindo(u)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
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

      <AlertDialog open={excluindo !== null} onOpenChange={() => setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{excluindo?.nome}</strong> ({excluindo?.email})?
              Esta acao remove o usuário do banco de dados e da autenticacao. Nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
