"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, Check } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { Paciente } from "../types"

interface StepClienteProps {
  pacienteId: number | null
  nomeCliente: string
  cpfCliente: string
  onSelect: (paciente: { id: number; nome: string; cpf: string }) => void
}

export function StepCliente({ pacienteId, nomeCliente, cpfCliente, onSelect }: StepClienteProps) {
  const [search, setSearch] = useState(nomeCliente || "")
  const [results, setResults] = useState<Paciente[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Paciente | null>(null)
  const [showCadastro, setShowCadastro] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [novoCpf, setNovoCpf] = useState("")
  const [novoTelefone, setNovoTelefone] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [saving, setSaving] = useState(false)

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(() => buscarPacientes(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  async function buscarPacientes(term: string) {
    try {
      setSearching(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, cpf_cnpj, telefone, telefone_celular, email, ativo")
        .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%`)
        .eq("ativo", true)
        .limit(10)

      if (error) {
        console.error("[propostas] Erro ao buscar pacientes:", error.message)
        return
      }
      setResults((data as Paciente[]) || [])
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setSearching(false)
    }
  }

  function handleSelect(paciente: Paciente) {
    setSelected(paciente)
    setSearch(paciente.nome)
    setResults([])
    onSelect({
      id: paciente.id,
      nome: paciente.nome,
      cpf: paciente.cpf_cnpj || "",
    })
  }

  async function handleCadastrar() {
    if (!novoNome.trim()) return
    try {
      setSaving(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("pacientes")
        .insert({
          nome: novoNome.trim(),
          cpf_cnpj: novoCpf.trim() || null,
          telefone_celular: novoTelefone.trim() || null,
          email: novoEmail.trim() || null,
          ativo: true,
        })
        .select()
        .single()

      if (error) {
        console.error("[propostas] Erro ao cadastrar paciente:", error.message)
        return
      }
      if (data) {
        const paciente = data as Paciente
        setSelected(paciente)
        setSearch(paciente.nome)
        setShowCadastro(false)
        onSelect({
          id: paciente.id,
          nome: paciente.nome,
          cpf: paciente.cpf_cnpj || "",
        })
      }
    } catch (error) {
      console.error("[propostas] Erro:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-2 block">Buscar Paciente</Label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Digite o nome ou CPF do paciente..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelected(null)
            }}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {results.length > 0 && !selected && (
          <Card className="mt-2 divide-y divide-border max-h-60 overflow-y-auto">
            {results.map((paciente) => (
              <button
                key={paciente.id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                onClick={() => handleSelect(paciente)}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{paciente.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {paciente.cpf_cnpj || "Sem CPF"} • {paciente.telefone_celular || paciente.telefone || "Sem telefone"}
                  </p>
                </div>
              </button>
            ))}
          </Card>
        )}

        {search.length >= 2 && results.length === 0 && !searching && !selected && (
          <div className="mt-2 text-sm text-muted-foreground">
            Nenhum paciente encontrado.{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => {
                setShowCadastro(true)
                setNovoNome(search)
              }}
            >
              Cadastrar novo paciente
            </button>
          </div>
        )}
      </div>

      {selected && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selected.nome}</p>
              <p className="text-xs text-muted-foreground">
                CPF: {selected.cpf_cnpj || "Nao informado"} • {selected.email || "Sem email"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {showCadastro && !selected && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Cadastrar Novo Paciente</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Nome *</Label>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">CPF</Label>
              <Input value={novoCpf} onChange={(e) => setNovoCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Telefone</Label>
              <Input value={novoTelefone} onChange={(e) => setNovoTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Email</Label>
              <Input value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowCadastro(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCadastrar} disabled={!novoNome.trim() || saving}>
              {saving ? "Salvando..." : "Cadastrar e Selecionar"}
            </Button>
          </div>
        </Card>
      )}

      {!selected && !showCadastro && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-2">Ou cadastre um novo paciente</p>
          <Button type="button" variant="outline" onClick={() => setShowCadastro(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Cadastrar Novo Paciente
          </Button>
        </div>
      )}
    </div>
  )
}
