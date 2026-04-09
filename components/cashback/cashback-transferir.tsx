"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Search, UserPlus, Check, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Paciente {
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone_celular: string | null
  email: string | null
}

interface CashbackTransferirProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  origemPacienteId: number
  origemNome: string
  origemSaldo: number
  onTransferido: () => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function getIniciais(nome: string) {
  return nome.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

export function CashbackTransferir({
  open,
  onOpenChange,
  origemPacienteId,
  origemNome,
  origemSaldo,
  onTransferido,
}: CashbackTransferirProps) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<Paciente[]>([])
  const [searching, setSearching] = useState(false)
  const [destinatario, setDestinatario] = useState<Paciente | null>(null)

  const [valor, setValor] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  // Cadastro novo paciente
  const [showCadastro, setShowCadastro] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [novoCpf, setNovoCpf] = useState("")
  const [novoTelefone, setNovoTelefone] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [savingNovo, setSavingNovo] = useState(false)

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setSearch("")
      setResults([])
      setDestinatario(null)
      setValor(0)
      setShowCadastro(false)
      setNovoNome("")
      setNovoCpf("")
      setNovoTelefone("")
      setNovoEmail("")
    }
  }, [open])

  // Busca pacientes com debounce
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
        .select("id, nome, cpf_cnpj, telefone_celular, email")
        .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%`)
        .eq("ativo", true)
        .neq("id", origemPacienteId)
        .limit(10)

      if (error) {
        console.error("[cashback] Erro ao buscar pacientes:", error.message)
        return
      }
      setResults((data as Paciente[]) || [])
    } catch (e) {
      console.error("[cashback] Erro ao buscar pacientes:", e)
    } finally {
      setSearching(false)
    }
  }

  function handleSelectDestinatario(paciente: Paciente) {
    setDestinatario(paciente)
    setSearch(paciente.nome)
    setResults([])
    setShowCadastro(false)
  }

  async function handleCadastrarNovo() {
    if (!novoNome.trim()) return
    try {
      setSavingNovo(true)
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
        .select("id, nome, cpf_cnpj, telefone_celular, email")
        .single()

      if (error) {
        console.error("[cashback] Erro ao cadastrar paciente:", error.message)
        toast.error("Erro ao cadastrar paciente")
        return
      }
      if (data) {
        toast.success("Paciente cadastrado com sucesso")
        handleSelectDestinatario(data as Paciente)
      }
    } catch (e) {
      console.error("[cashback] Erro ao cadastrar:", e)
      toast.error("Erro ao cadastrar paciente")
    } finally {
      setSavingNovo(false)
    }
  }

  async function handleTransferir() {
    if (!destinatario || valor <= 0 || valor > origemSaldo) return

    try {
      setSaving(true)
      const supabase = getSupabase()

      // 1. Inserir transacao de saida (origem)
      const { data: transEnviada, error: errEnviada } = await supabase
        .from("cashback_transacoes")
        .insert({
          paciente_id: origemPacienteId,
          proposta_id: null,
          tipo: "transferencia_enviada",
          valor,
          campanha_id: null,
        })
        .select("id")
        .single()

      if (errEnviada) {
        console.error("[cashback] Erro ao registrar saida:", errEnviada.message)
        toast.error("Erro ao realizar transferencia")
        return
      }

      // 2. Inserir transacao de entrada (destinatario)
      const { data: transRecebida, error: errRecebida } = await supabase
        .from("cashback_transacoes")
        .insert({
          paciente_id: destinatario.id,
          proposta_id: null,
          tipo: "transferencia_recebida",
          valor,
          campanha_id: null,
          transferencia_ref_id: transEnviada.id,
        })
        .select("id")
        .single()

      if (errRecebida) {
        console.error("[cashback] Erro ao registrar entrada:", errRecebida.message)
        toast.error("Erro ao completar transferencia")
        return
      }

      // 3. Vincular a saida com a entrada
      await supabase
        .from("cashback_transacoes")
        .update({ transferencia_ref_id: transRecebida.id })
        .eq("id", transEnviada.id)

      toast.success(`${formatCurrency(valor)} transferido para ${destinatario.nome}`)
      onTransferido()
      onOpenChange(false)
    } catch (e) {
      console.error("[cashback] Erro na transferencia:", e)
      toast.error("Erro ao realizar transferencia")
    } finally {
      setSaving(false)
    }
  }

  const canTransferir = destinatario && valor > 0 && valor <= origemSaldo && !saving

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Transferir Cashback</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Origem */}
          <Card className="p-4 bg-muted/30">
            <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-2">De</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">{getIniciais(origemNome)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{origemNome}</p>
                <p className="text-xs text-muted-foreground">
                  Saldo disponivel: <span className="font-medium text-green-700">{formatCurrency(origemSaldo)}</span>
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
          </div>

          {/* Destinatario */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Para</p>

            {destinatario ? (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{destinatario.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {destinatario.cpf_cnpj || "Sem CPF"} {destinatario.telefone_celular ? `• ${destinatario.telefone_celular}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDestinatario(null)
                      setSearch("")
                    }}
                    className="text-xs"
                  >
                    Trocar
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nome ou CPF..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setDestinatario(null)
                      setShowCadastro(false)
                    }}
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    </div>
                  )}
                </div>

                {/* Resultados da busca */}
                {results.length > 0 && (
                  <Card className="divide-y divide-border max-h-48 overflow-y-auto">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectDestinatario(p)}
                      >
                        <p className="text-sm font-medium text-foreground">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.cpf_cnpj || "Sem CPF"} {p.telefone_celular ? `• ${p.telefone_celular}` : ""}
                        </p>
                      </button>
                    ))}
                  </Card>
                )}

                {/* Nao encontrou */}
                {search.length >= 2 && results.length === 0 && !searching && !showCadastro && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cliente encontrado.{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => {
                        setShowCadastro(true)
                        setNovoNome(search)
                      }}
                    >
                      Cadastrar novo cliente
                    </button>
                  </p>
                )}

                {/* Link para cadastrar mesmo quando tem resultados */}
                {search.length >= 2 && results.length > 0 && !showCadastro && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline font-medium"
                    onClick={() => {
                      setShowCadastro(true)
                      setNovoNome(search)
                    }}
                  >
                    <UserPlus className="w-3 h-3 inline mr-1" />
                    Cadastrar novo cliente
                  </button>
                )}

                {/* Formulario de cadastro */}
                {showCadastro && (
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Novo Cliente</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowCadastro(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" onClick={handleCadastrarNovo} disabled={!novoNome.trim() || savingNovo}>
                        {savingNovo ? "Salvando..." : "Cadastrar"}
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Valor */}
          {destinatario && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Valor da transferencia</Label>
              <Input
                type="number"
                min={0.01}
                max={origemSaldo}
                step={0.01}
                value={valor || ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0
                  setValor(Math.min(v, origemSaldo))
                }}
                placeholder="R$ 0,00"
              />
              {valor > origemSaldo && (
                <p className="text-xs text-destructive">Valor excede o saldo disponivel.</p>
              )}
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setValor(origemSaldo)}
              >
                Transferir saldo total ({formatCurrency(origemSaldo)})
              </button>
            </div>
          )}

          {/* Confirmar */}
          {destinatario && valor > 0 && (
            <Card className="p-4 bg-muted/30 space-y-2">
              <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Resumo</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">De</span>
                  <span className="font-medium">{origemNome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Para</span>
                  <span className="font-medium">{destinatario.nome}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-semibold">Valor</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(valor)}</span>
                </div>
              </div>
            </Card>
          )}

          <Button
            type="button"
            className="w-full gap-2"
            disabled={!canTransferir}
            onClick={handleTransferir}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {saving ? "Transferindo..." : "Confirmar Transferencia"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
