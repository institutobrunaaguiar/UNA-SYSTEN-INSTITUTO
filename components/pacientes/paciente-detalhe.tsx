// components/pacientes/paciente-detalhe.tsx
"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  User,
  Clock,
  AlertCircle,
  FileSignature,
} from "lucide-react"
import { TabContratos } from "@/components/contratos/tab-contratos"

export interface Paciente {
  id: number
  nome: string
  nome_social: string | null
  sexo: string | null
  genero: string | null
  cpf_cnpj: string | null
  data_nascimento: string | null
  telefone: string | null
  telefone_celular: string | null
  email: string | null
  cep: string | null
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  id_cidade: number | null
  estrangeiro: boolean | null
  numero_identificacao: string | null
  ativo: boolean
  created_at: string
}

interface Agendamento {
  id: number
  data: string
  horaInicio: string
  horaFim: string
  status: string
  observacoes: string | null
  emailPaciente: string | null
  telefoneCelularPaciente: string | null
}

interface Orcamento {
  id: number
  numeroControle: string | null
  status: string
  descricao: string | null
  dataAprovacao: string | null
  valorBruto: number | null
  valorDesconto: number | null
  valorLiquido: number | null
  paciente: { nome: string } | null
}

const STATUS_AGENDA: Record<string, { label: string; className: string }> = {
  CONFIRMADO:    { label: "Confirmado",    className: "bg-green-500/10 text-green-500" },
  AGUARDANDO:    { label: "Aguardando",    className: "bg-yellow-500/10 text-yellow-500" },
  ATENDIDO:      { label: "Atendido",      className: "bg-blue-500/10 text-blue-400" },
  CANCELADO:     { label: "Cancelado",     className: "bg-destructive/10 text-destructive" },
  NAO_COMPARECEU:{ label: "Não compareceu",className: "bg-orange-500/10 text-orange-400" },
}

const STATUS_ORC: Record<string, { label: string; className: string }> = {
  ABERTO:    { label: "Aberto",    className: "bg-blue-500/10 text-blue-400" },
  APROVADO:  { label: "Aprovado",  className: "bg-green-500/10 text-green-500" },
  PERDIDO:   { label: "Perdido",   className: "bg-destructive/10 text-destructive" },
  CANCELADO: { label: "Cancelado", className: "bg-stone-500/10 text-stone-400" },
}

function avatarColor(nome: string) {
  const colors = [
    "bg-indigo-600", "bg-cyan-600", "bg-violet-600",
    "bg-emerald-600", "bg-amber-600", "bg-rose-600",
  ]
  return colors[nome.charCodeAt(0) % colors.length]
}

function getInitials(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("")
}

function formatCpf(cpf: string | null) {
  if (!cpf) return "-"
  const d = cpf.replace(/\D/g, "")
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  return cpf
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

function formatCurrency(val: number | null) {
  if (val == null) return "-"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5 break-words">{value || "-"}</p>
      </div>
    </div>
  )
}

function TabAgendamentos({ pacienteId }: { pacienteId: number }) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    fetch(`/api/cnn/agenda?idPaciente=${pacienteId}&pagina=0&registrosPorPagina=20`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setAgendamentos(data.lista ?? [])
      })
      .catch(() => setError("Falha ao carregar agendamentos"))
      .finally(() => setLoading(false))
  }, [pacienteId])

  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" /></div>

  if (error) return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <AlertCircle className="w-5 h-5 text-destructive" />
      <p className="text-sm text-destructive font-medium">Erro ao carregar agendamentos</p>
      <p className="text-xs text-muted-foreground max-w-[240px]">
        {error.includes("403")
          ? "Credenciais da Clínica nas Nuvens inválidas. Verifique a configuração."
          : error}
      </p>
    </div>
  )

  if (agendamentos.length === 0) return (
    <p className="text-center text-muted-foreground text-sm py-10">Nenhum agendamento encontrado.</p>
  )

  return (
    <div className="space-y-2 mt-2">
      {agendamentos.map((ag) => {
        const status = STATUS_AGENDA[ag.status] ?? { label: ag.status, className: "bg-muted text-muted-foreground" }
        return (
          <Card key={ag.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{formatDate(ag.data)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {ag.horaInicio} – {ag.horaFim}
                  </p>
                  {ag.observacoes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{ag.observacoes}</p>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
                {status.label}
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function TabOrcamentos({ pacienteId }: { pacienteId: number }) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    fetch(`/api/cnn/orcamento?idPaciente=${pacienteId}&pagina=0&registrosPorPagina=20`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setOrcamentos(data.lista ?? [])
      })
      .catch(() => setError("Falha ao carregar orçamentos"))
      .finally(() => setLoading(false))
  }, [pacienteId])

  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" /></div>

  if (error) return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <AlertCircle className="w-5 h-5 text-destructive" />
      <p className="text-sm text-destructive font-medium">Erro ao carregar orçamentos</p>
      <p className="text-xs text-muted-foreground max-w-[240px]">
        {error.includes("403")
          ? "Credenciais da Clínica nas Nuvens inválidas. Verifique a configuração."
          : error}
      </p>
    </div>
  )

  if (orcamentos.length === 0) return (
    <p className="text-center text-muted-foreground text-sm py-10">Nenhum orçamento encontrado.</p>
  )

  return (
    <div className="space-y-2 mt-2">
      {orcamentos.map((orc) => {
        const status = STATUS_ORC[orc.status] ?? { label: orc.status, className: "bg-muted text-muted-foreground" }
        return (
          <Card key={orc.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {orc.descricao ?? `Orçamento #${orc.numeroControle ?? orc.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {orc.dataAprovacao ? `Aprovado em ${formatDate(orc.dataAprovacao)}` : "Sem data de aprovação"}
                  </p>
                  {(orc.valorDesconto ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bruto: {formatCurrency(orc.valorBruto)} · Desconto: {formatCurrency(orc.valorDesconto)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(orc.valorLiquido)}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

interface Props {
  paciente: Paciente | null
  onClose: () => void
}

export function PacienteDetalhe({ paciente, onClose }: Props) {
  const endereco = [
    paciente?.rua,
    paciente?.numero && `nº ${paciente.numero}`,
    paciente?.complemento,
    paciente?.bairro,
  ].filter(Boolean).join(", ")

  return (
    <Sheet open={!!paciente} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {paciente && (
          <>
            <SheetHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${avatarColor(paciente.nome)}`}>
                  {getInitials(paciente.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-base font-bold text-foreground leading-tight truncate">
                    {paciente.nome}
                  </SheetTitle>
                  {paciente.nome_social && (
                    <p className="text-xs text-muted-foreground">({paciente.nome_social})</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {paciente.cpf_cnpj && (
                      <span className="text-[10px] text-muted-foreground font-mono">{formatCpf(paciente.cpf_cnpj)}</span>
                    )}
                    <Badge variant={paciente.ativo ? "default" : "secondary"} className="text-[10px] py-0 h-4">
                      {paciente.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="dados" className="mt-4">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="dados" className="text-xs gap-1.5">
                  <User className="w-3.5 h-3.5" />Dados
                </TabsTrigger>
                <TabsTrigger value="agendamentos" className="text-xs gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Agenda
                </TabsTrigger>
                <TabsTrigger value="orcamentos" className="text-xs gap-1.5">
                  <FileText className="w-3.5 h-3.5" />Orçamentos
                </TabsTrigger>
                <TabsTrigger value="contratos" className="text-xs gap-1.5">
                  <FileSignature className="w-3.5 h-3.5" />Contratos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="mt-4 space-y-4">
                <Card className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dados Pessoais</p>
                  <InfoRow icon={CreditCard} label="CPF / CNPJ" value={formatCpf(paciente.cpf_cnpj)} />
                  <InfoRow icon={Calendar} label="Data de nascimento" value={formatDate(paciente.data_nascimento)} />
                  {paciente.sexo && <InfoRow icon={User} label="Sexo" value={paciente.sexo} />}
                  {paciente.numero_identificacao && (
                    <InfoRow icon={CreditCard} label="Nº Identificação" value={paciente.numero_identificacao} />
                  )}
                </Card>

                <Card className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contato</p>
                  <InfoRow icon={Phone} label="Celular" value={paciente.telefone_celular ?? "-"} />
                  <InfoRow icon={Phone} label="Telefone" value={paciente.telefone ?? "-"} />
                  <InfoRow icon={Mail} label="E-mail" value={paciente.email ?? "-"} />
                </Card>

                {endereco && (
                  <Card className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Endereço</p>
                    <InfoRow icon={MapPin} label="Logradouro" value={endereco} />
                    {paciente.cep && <InfoRow icon={MapPin} label="CEP" value={paciente.cep} />}
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="agendamentos">
                <TabAgendamentos pacienteId={paciente.id} />
              </TabsContent>

              <TabsContent value="orcamentos">
                <TabOrcamentos pacienteId={paciente.id} />
              </TabsContent>

              <TabsContent value="contratos">
                <TabContratos
                  pacienteId={paciente.id}
                  nomePaciente={paciente.nome}
                  emailPaciente={paciente.email}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
