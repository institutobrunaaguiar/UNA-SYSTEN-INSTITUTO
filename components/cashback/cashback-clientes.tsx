"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp, Gift, FileText, ArrowRightLeft, ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CashbackTransferir } from "./cashback-transferir"

type TipoTransacao = "gerado" | "utilizado" | "transferencia_enviada" | "transferencia_recebida"

interface Transacao {
  id: number
  proposta_id: number | null
  tipo: TipoTransacao
  valor: number
  created_at: string
  campanha_nome: string | null
  proposta_nome_cliente: string | null
  proposta_valor_total: number | null
  transferencia_ref_paciente_nome: string | null
  profissional_origem_nome: string | null
}

interface ClienteSaldo {
  paciente_id: number
  nome: string
  cpf: string | null
  gerado: number
  utilizado: number
  saldo: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getIniciais(nome: string) {
  return nome.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

const TIPO_CONFIG: Record<TipoTransacao, { label: string; color: string; dotColor: string; sign: string }> = {
  gerado: { label: "Gerado", color: "text-green-700", dotColor: "bg-green-500", sign: "+" },
  utilizado: { label: "Utilizado", color: "text-orange-700", dotColor: "bg-orange-500", sign: "-" },
  transferencia_enviada: { label: "Transferido", color: "text-red-700", dotColor: "bg-red-500", sign: "-" },
  transferencia_recebida: { label: "Recebido", color: "text-blue-700", dotColor: "bg-blue-500", sign: "+" },
}

export function CashbackClientes() {
  const [clientes, setClientes] = useState<ClienteSaldo[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loadingTransacoes, setLoadingTransacoes] = useState(false)

  // Transfer sheet state
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferCliente, setTransferCliente] = useState<ClienteSaldo | null>(null)

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("cashback_transacoes")
        .select("paciente_id, tipo, valor")

      if (error) {
        console.error("[cashback] Erro ao buscar clientes:", error.message)
        return
      }
      if (!data || data.length === 0) {
        setClientes([])
        return
      }

      // Agrupar por paciente — saldo = (gerado + recebido) - (utilizado + enviado)
      const map = new Map<number, { gerado: number; utilizado: number }>()
      for (const t of data) {
        const entry = map.get(t.paciente_id) || { gerado: 0, utilizado: 0 }
        if (t.tipo === "gerado" || t.tipo === "transferencia_recebida") {
          entry.gerado += t.valor
        } else {
          entry.utilizado += t.valor
        }
        map.set(t.paciente_id, entry)
      }

      const ids = Array.from(map.keys())
      const { data: pacientes, error: errPac } = await supabase
        .from("pacientes")
        .select("id, nome, cpf_cnpj")
        .in("id", ids)

      if (errPac) {
        console.error("[cashback] Erro ao buscar pacientes:", errPac.message)
        return
      }

      const pacMap = new Map(pacientes?.map((p) => [p.id, p]) || [])

      const resultado: ClienteSaldo[] = ids
        .map((id) => {
          const pac = pacMap.get(id)
          const entry = map.get(id)!
          return {
            paciente_id: id,
            nome: pac?.nome ?? `Paciente #${id}`,
            cpf: pac?.cpf_cnpj ?? null,
            gerado: entry.gerado,
            utilizado: entry.utilizado,
            saldo: Math.max(0, entry.gerado - entry.utilizado),
          }
        })
        .sort((a, b) => b.saldo - a.saldo)

      setClientes(resultado)
    } catch (e) {
      console.error("[cashback] Erro ao buscar clientes:", e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTransacoes(pacienteId: number) {
    setLoadingTransacoes(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("cashback_transacoes")
        .select("id, proposta_id, tipo, valor, created_at, campanha_id, transferencia_ref_id, profissional_origem_id")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[cashback] Erro ao buscar transacoes:", error.message)
        return
      }
      if (!data || data.length === 0) {
        setTransacoes([])
        return
      }

      // Buscar propostas, campanhas, profissionais e pacientes referenciados
      const propostaIds = [...new Set(data.filter((t) => t.proposta_id).map((t) => t.proposta_id!))]
      const campanhaIds = [...new Set(data.filter((t) => t.campanha_id).map((t) => t.campanha_id!))]
      const refIds = [...new Set(data.filter((t) => t.transferencia_ref_id).map((t) => t.transferencia_ref_id!))]
      const profIds = [...new Set(data.filter((t) => t.profissional_origem_id).map((t) => t.profissional_origem_id!))]

      const promises: Promise<{ data: any[] | null; error: any }>[] = [
        propostaIds.length > 0
          ? supabase.from("propostas").select("id, nome_cliente, valor_total").in("id", propostaIds)
          : Promise.resolve({ data: [], error: null }),
        campanhaIds.length > 0
          ? supabase.from("cashback_campanhas").select("id, nome").in("id", campanhaIds)
          : Promise.resolve({ data: [], error: null }),
      ]

      // Buscar paciente da outra ponta da transferencia
      let refTransMap = new Map<number, number>()
      if (refIds.length > 0) {
        const { data: refTrans } = await supabase
          .from("cashback_transacoes")
          .select("id, paciente_id")
          .in("id", refIds)
        if (refTrans) {
          refTransMap = new Map(refTrans.map((r) => [r.id, r.paciente_id]))
        }
      }

      const refPacienteIds = [...new Set(Array.from(refTransMap.values()))]
      if (refPacienteIds.length > 0) {
        promises.push(
          supabase.from("pacientes").select("id, nome").in("id", refPacienteIds)
        )
      } else {
        promises.push(Promise.resolve({ data: [], error: null }))
      }

      // Buscar nomes dos profissionais de origem
      if (profIds.length > 0) {
        promises.push(
          supabase.from("profissionais").select("id, nome").in("id", profIds)
        )
      } else {
        promises.push(Promise.resolve({ data: [], error: null }))
      }

      const [propostasRes, campanhasRes, refPacientesRes, profissionaisRes] = await Promise.all(promises)

      const propMap = new Map(propostasRes.data?.map((p) => [p.id, p]) || [])
      const campMap = new Map(campanhasRes.data?.map((c) => [c.id, c]) || [])
      const refPacMap = new Map(refPacientesRes.data?.map((p) => [p.id, p]) || [])
      const profMap = new Map(profissionaisRes.data?.map((p) => [p.id, p]) || [])

      const resultado: Transacao[] = data.map((t) => {
        const prop = t.proposta_id ? propMap.get(t.proposta_id) : null
        const camp = t.campanha_id ? campMap.get(t.campanha_id) : null
        const prof = t.profissional_origem_id ? profMap.get(t.profissional_origem_id) : null

        let refPacNome: string | null = null
        if (t.transferencia_ref_id) {
          const refPacId = refTransMap.get(t.transferencia_ref_id)
          if (refPacId) {
            const refPac = refPacMap.get(refPacId)
            refPacNome = refPac?.nome ?? null
          }
        }

        return {
          id: t.id,
          proposta_id: t.proposta_id,
          tipo: t.tipo as TipoTransacao,
          valor: t.valor,
          created_at: t.created_at,
          campanha_nome: camp?.nome ?? null,
          proposta_nome_cliente: prop?.nome_cliente ?? null,
          proposta_valor_total: prop?.valor_total ?? null,
          transferencia_ref_paciente_nome: refPacNome,
          profissional_origem_nome: prof?.nome ?? null,
        }
      })

      setTransacoes(resultado)
    } catch (e) {
      console.error("[cashback] Erro ao buscar transacoes:", e)
    } finally {
      setLoadingTransacoes(false)
    }
  }

  function handleToggle(pacienteId: number) {
    if (expandedId === pacienteId) {
      setExpandedId(null)
      setTransacoes([])
    } else {
      setExpandedId(pacienteId)
      fetchTransacoes(pacienteId)
    }
  }

  function handleTransferir(cliente: ClienteSaldo) {
    setTransferCliente(cliente)
    setTransferOpen(true)
  }

  function handleTransferido() {
    fetchClientes()
    if (expandedId) fetchTransacoes(expandedId)
  }

  async function handleExcluirTransacao(transacao: Transacao) {
    const descricao = TIPO_CONFIG[transacao.tipo].label
    if (!confirm(`Excluir transacao "${descricao}" de ${formatCurrency(transacao.valor)}?`)) return

    try {
      const supabase = getSupabase()

      // Se for transferencia, excluir a outra ponta tambem
      if (transacao.tipo === "transferencia_enviada" || transacao.tipo === "transferencia_recebida") {
        // Buscar ref_id para excluir par
        const { data: trans } = await supabase
          .from("cashback_transacoes")
          .select("transferencia_ref_id")
          .eq("id", transacao.id)
          .single()

        if (trans?.transferencia_ref_id) {
          await supabase.from("cashback_transacoes").delete().eq("id", trans.transferencia_ref_id)
        }
      }

      const { error } = await supabase.from("cashback_transacoes").delete().eq("id", transacao.id)
      if (error) {
        console.error("[cashback] Erro ao excluir transacao:", error.message)
        toast.error("Erro ao excluir transacao")
        return
      }

      toast.success("Transacao excluida")
      fetchClientes()
      if (expandedId) fetchTransacoes(expandedId)
    } catch (e) {
      console.error("[cashback] Erro ao excluir:", e)
      toast.error("Erro ao excluir transacao")
    }
  }

  const filtered = busca.trim()
    ? clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
    : clientes

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (clientes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Gift className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum cliente com cashback registrado.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Busca */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Total Gerado</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {formatCurrency(clientes.reduce((s, c) => s + c.gerado, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Total Utilizado</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {formatCurrency(clientes.reduce((s, c) => s + c.utilizado, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Saldo em Aberto</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            {formatCurrency(clientes.reduce((s, c) => s + c.saldo, 0))}
          </p>
        </Card>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-2">
        {filtered.map((cliente) => (
          <Card key={cliente.paciente_id} className="overflow-hidden">
            <button
              onClick={() => handleToggle(cliente.paciente_id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">{getIniciais(cliente.nome)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{cliente.nome}</p>
                {cliente.cpf && (
                  <p className="text-xs text-muted-foreground">{cliente.cpf}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-green-700">{formatCurrency(cliente.saldo)}</p>
                <p className="text-[10px] text-muted-foreground">saldo disponivel</p>
              </div>
              {expandedId === cliente.paciente_id ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {/* Detalhes expandidos */}
            {expandedId === cliente.paciente_id && (
              <div className="border-t border-border px-4 py-3 bg-muted/20">
                {/* Resumo + botao transferir */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Gerado: </span>
                      <span className="font-medium text-foreground">{formatCurrency(cliente.gerado)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Utilizado: </span>
                      <span className="font-medium text-foreground">{formatCurrency(cliente.utilizado)}</span>
                    </div>
                  </div>
                  {cliente.saldo > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTransferir(cliente)
                      }}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Transferir
                    </Button>
                  )}
                </div>

                {/* Transacoes */}
                {loadingTransacoes ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  </div>
                ) : transacoes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Nenhuma transacao encontrada.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider font-medium">
                      Historico de transacoes
                    </p>
                    {transacoes.map((t) => {
                      const config = TIPO_CONFIG[t.tipo]
                      const isTransfer = t.tipo === "transferencia_enviada" || t.tipo === "transferencia_recebida"

                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0"
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
                          <div className="flex-1 min-w-0">
                            {isTransfer ? (
                              <div className="flex items-center gap-1.5">
                                {t.tipo === "transferencia_enviada" ? (
                                  <ArrowUpRight className="w-3 h-3 text-red-500 shrink-0" />
                                ) : (
                                  <ArrowDownLeft className="w-3 h-3 text-blue-500 shrink-0" />
                                )}
                                <span className="text-xs text-foreground truncate">
                                  {t.tipo === "transferencia_enviada" ? "Enviado para" : "Recebido de"}{" "}
                                  <span className="font-medium">{t.transferencia_ref_paciente_nome || "cliente"}</span>
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="text-xs text-foreground truncate">
                                    Proposta #{t.proposta_id}
                                    {t.proposta_valor_total != null && (
                                      <span className="text-muted-foreground"> ({formatCurrency(t.proposta_valor_total)})</span>
                                    )}
                                  </span>
                                </div>
                                {(t.campanha_nome || t.profissional_origem_nome) && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 pl-[18px]">
                                    {t.profissional_origem_nome && <span>Profissional: {t.profissional_origem_nome}</span>}
                                    {t.profissional_origem_nome && t.campanha_nome && <span> • </span>}
                                    {t.campanha_nome && <span>Campanha: {t.campanha_nome}</span>}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-medium ${config.color}`}>
                              {config.sign} {formatCurrency(t.valor)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{formatDate(t.created_at)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExcluirTransacao(t)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            title="Excluir transacao"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Contagem */}
      <p className="text-xs text-muted-foreground text-center">
        Mostrando {filtered.length} de {clientes.length} clientes
      </p>

      {/* Sheet de transferencia */}
      {transferCliente && (
        <CashbackTransferir
          open={transferOpen}
          onOpenChange={setTransferOpen}
          origemPacienteId={transferCliente.paciente_id}
          origemNome={transferCliente.nome}
          origemSaldo={transferCliente.saldo}
          onTransferido={handleTransferido}
        />
      )}
    </div>
  )
}
