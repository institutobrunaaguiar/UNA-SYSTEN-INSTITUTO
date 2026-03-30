"use client"

import { useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  operador: "Operador",
  visualizador: "Visualizador",
}

const MODULO_LABEL: Record<string, string> = {
  painel: "Painel",
  proposta: "Proposta",
  calendario: "Calendário",
  relatorios: "Relatórios",
  pacientes: "Pacientes",
  comissao: "Comissão",
  campanha: "Campanha",
  admin: "Admin",
}

export function PerfilContent() {
  const { user, loading, reload } = useUser()

  const [nome, setNome] = useState(user?.nome ?? "")
  const [savingNome, setSavingNome] = useState(false)
  const [nomeMsg, setNomeMsg] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null)

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmSenha, setConfirmSenha] = useState("")
  const [savingSenha, setSavingSenha] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null)

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        Não foi possível carregar o perfil. Tente recarregar a página.
      </p>
    )
  }

  async function handleSaveNome() {
    if (!user) return
    if (!nome.trim()) {
      setNomeMsg({ tipo: "erro", texto: "O nome não pode estar em branco." })
      return
    }
    setSavingNome(true)
    setNomeMsg(null)
    const { error } = await getSupabase()
      .from("user_profiles")
      .update({ nome: nome.trim() })
      .eq("id", user.id)
    setSavingNome(false)
    if (error) {
      setNomeMsg({ tipo: "erro", texto: "Erro ao salvar. Tente novamente." })
    } else {
      setNomeMsg({ tipo: "sucesso", texto: "Nome atualizado com sucesso." })
      reload()
    }
  }

  async function handleSaveSenha() {
    setSenhaMsg(null)
    if (novaSenha.length < 8) {
      setSenhaMsg({ tipo: "erro", texto: "A senha deve ter no mínimo 8 caracteres." })
      return
    }
    if (novaSenha !== confirmSenha) {
      setSenhaMsg({ tipo: "erro", texto: "As senhas não coincidem." })
      return
    }
    setSavingSenha(true)
    const { error } = await getSupabase().auth.updateUser({ password: novaSenha })
    setSavingSenha(false)
    if (error) {
      setSenhaMsg({ tipo: "erro", texto: "Erro ao redefinir senha. Tente novamente." })
    } else {
      setSenhaMsg({ tipo: "sucesso", texto: "Senha alterada com sucesso." })
      setNovaSenha("")
      setConfirmSenha("")
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Info do perfil */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Informações
        </h2>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Nome
          </Label>
          <div className="flex gap-2">
            <Input
              value={nome}
              onChange={(e) => { setNome(e.target.value); setNomeMsg(null) }}
              className="flex-1"
            />
            <Button onClick={handleSaveNome} disabled={savingNome}>
              {savingNome ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          {nomeMsg && (
            <p className={`mt-1.5 text-sm ${nomeMsg.tipo === "sucesso" ? "text-green-600" : "text-destructive"}`}>
              {nomeMsg.texto}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            E-mail
          </Label>
          <Input value={user.email} disabled className="opacity-50" />
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Nível</p>
            <span className="text-sm font-medium text-foreground">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Status</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.ativo ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
              {user.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Módulos com acesso
          </p>
          <div className="flex flex-wrap gap-1.5">
            {user.modulos.map((m) => (
              <span
                key={m}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
              >
                {MODULO_LABEL[m] ?? m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Alterar senha */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Alterar Senha
        </h2>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Nova Senha
          </Label>
          <Input
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={novaSenha}
            onChange={(e) => { setNovaSenha(e.target.value); setSenhaMsg(null) }}
          />
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Confirmar Nova Senha
          </Label>
          <Input
            type="password"
            placeholder="Repita a nova senha"
            value={confirmSenha}
            onChange={(e) => { setConfirmSenha(e.target.value); setSenhaMsg(null) }}
          />
        </div>

        {senhaMsg && (
          <p className={`text-sm ${senhaMsg.tipo === "sucesso" ? "text-green-600" : "text-destructive"}`}>
            {senhaMsg.texto}
          </p>
        )}

        <Button
          className="w-full"
          onClick={handleSaveSenha}
          disabled={savingSenha || !novaSenha || !confirmSenha}
        >
          {savingSenha ? "Alterando..." : "Alterar Senha"}
        </Button>
      </div>
    </div>
  )
}
