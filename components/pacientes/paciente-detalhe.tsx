// components/pacientes/paciente-detalhe.tsx
"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  ChevronDown,
  ArrowLeft,
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
  CONFIRMADO:     { label: "Confirmado",     className: "bg-green-500/10 text-green-500" },
  AGUARDANDO:     { label: "Aguardando",     className: "bg-yellow-500/10 text-yellow-500" },
  ATENDIDO:       { label: "Atendido",       className: "bg-blue-500/10 text-blue-400" },
  CANCELADO:      { label: "Cancelado",      className: "bg-destructive/10 text-destructive" },
  NAO_COMPARECEU: { label: "Não compareceu", className: "bg-orange-500/10 text-orange-400" },
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
  try { return new Date(dateStr).toLocaleDateString("pt-BR") } catch { return dateStr }
}

function formatCurrency(val: number | null) {
  if (val == null) return "-"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
}

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || "-"}</p>
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
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
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
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
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

type ActiveTab = "dados" | "agenda" | "orcamentos" | "contratos"

interface Props {
  paciente: Paciente | null
  onClose: () => void
}

export function PacienteDetalhe({ paciente, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dados")

  const endereco = [
    paciente?.rua,
    paciente?.numero && `nº ${paciente.numero}`,
    paciente?.complemento,
    paciente?.bairro,
  ].filter(Boolean).join(", ")

  const TABS: { key: ActiveTab; label: string; icon: React.ElementType }[] = [
    { key: "dados", label: "Dados", icon: User },
    { key: "agenda", label: "Agenda", icon: Calendar },
    { key: "orcamentos", label: "Orçamentos", icon: FileText },
    { key: "contratos", label: "Contratos", icon: FileSignature },
  ]

  return (
    <Sheet open={!!paciente} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {paciente && (
          <>
            {/* Cabeçalho fixo */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 pt-4 pb-3">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors mr-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <SheetTitle className="text-sm font-semibold text-muted-foreground">
                    Paciente #{paciente.id}
                  </SheetTitle>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      paciente.ativo
                        ? "bg-green-500/10 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {paciente.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </SheetHeader>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(paciente.nome)}`}>
                  {getInitials(paciente.nome)}
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground leading-tight truncate">{paciente.nome}</p>
                  {paciente.nome_social && (
                    <p className="text-xs text-muted-foreground">({paciente.nome_social})</p>
                  )}
                  {paciente.cpf_cnpj && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatCpf(paciente.cpf_cnpj)}</p>
                  )}
                </div>
              </div>

              {/* Tabs inline no header */}
              <div className="flex gap-1 mt-3 -mb-3 border-b-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2">
              {activeTab === "dados" && (
                <>
                  <Section icon={User} title="Dados Pessoais" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <InfoItem label="CPF / CNPJ" value={formatCpf(paciente.cpf_cnpj)} />
                      <InfoItem label="Data de nascimento" value={formatDate(paciente.data_nascimento)} />
                      {paciente.sexo && <InfoItem label="Sexo" value={paciente.sexo} />}
                      {paciente.numero_identificacao && (
                        <InfoItem label="Nº Identificação" value={paciente.numero_identificacao} />
                      )}
                    </div>
                  </Section>

                  <Section icon={Phone} title="Contato" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <InfoItem label="Celular" value={paciente.telefone_celular ?? "-"} />
                      <InfoItem label="Telefone" value={paciente.telefone ?? "-"} />
                      <InfoItem label="E-mail" value={paciente.email ?? "-"} />
                    </div>
                  </Section>

                  {endereco && (
                    <Section icon={MapPin} title="Endereço" defaultOpen={false}>
                      <div className="grid grid-cols-2 gap-3 pl-6">
                        <div className="col-span-2">
                          <InfoItem label="Logradouro" value={endereco} />
                        </div>
                        {paciente.cep && <InfoItem label="CEP" value={paciente.cep} />}
                      </div>
                    </Section>
                  )}
                </>
              )}

              {activeTab === "agenda" && (
                <TabAgendamentos pacienteId={paciente.id} />
              )}

              {activeTab === "orcamentos" && (
                <TabOrcamentos pacienteId={paciente.id} />
              )}

              {activeTab === "contratos" && (
                <TabContratos
                  pacienteId={paciente.id}
                  nomePaciente={paciente.nome}
                  emailPaciente={paciente.email}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
