"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, X, Save, Loader2, Check } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { AgendaRotulo, AgendaLocal, AgendaTipoConsulta } from "./types"

interface Paciente {
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone_celular: string | null
  email: string | null
}

interface Profissional {
  id: number
  id_pessoa: number
  nome: string
}

interface CalendarNovoAgendamentoProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaultDate?: string
}

export function CalendarNovoAgendamento({ open, onClose, onSaved, defaultDate }: CalendarNovoAgendamentoProps) {
  const [saving, setSaving] = useState(false)

  const [data, setData] = useState(defaultDate || new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState("09:00")
  const [horaFim, setHoraFim] = useState("10:00")
  const [observacoes, setObservacoes] = useState("")

  const [searchPaciente, setSearchPaciente] = useState("")
  const [pacienteResults, setPacienteResults] = useState<Paciente[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [searchingPaciente, setSearchingPaciente] = useState(false)

  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [locais, setLocais] = useState<AgendaLocal[]>([])
  const [tiposConsulta, setTiposConsulta] = useState<AgendaTipoConsulta[]>([])
  const [rotulos, setRotulos] = useState<AgendaRotulo[]>([])
  const [selectedProfissional, setSelectedProfissional] = useState("")
  const [selectedLocal, setSelectedLocal] = useState("")
  const [selectedTipoConsulta, setSelectedTipoConsulta] = useState("")
  const [selectedRotulo, setSelectedRotulo] = useState("")

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    if (!open) return
    async function loadData() {
      const supabase = getSupabase()
      const [profRes, locRes, tipoRes, rotRes] = await Promise.all([
        supabase.from("profissionais").select("id, id_pessoa, nome").eq("ativo", true).order("nome"),
        supabase.from("agenda_local").select("*").eq("ativo", true).order("nome"),
        supabase.from("agenda_tipos_consulta").select("*").eq("ativo", true).order("nome"),
        supabase.from("agenda_rotulos").select("*").order("nome"),
      ])
      if (profRes.data) setProfissionais(profRes.data as Profissional[])
      if (locRes.data) setLocais(locRes.data as AgendaLocal[])
      if (tipoRes.data) setTiposConsulta(tipoRes.data as AgendaTipoConsulta[])
      if (rotRes.data) setRotulos(rotRes.data as AgendaRotulo[])
    }
    loadData()
  }, [open])

  useEffect(() => {
    if (defaultDate) setData(defaultDate)
  }, [defaultDate])

  useEffect(() => {
    if (searchPaciente.length < 2) { setPacienteResults([]); return }
    const timeout = setTimeout(async () => {
      try {
        setSearchingPaciente(true)
        const supabase = getSupabase()
        const { data } = await supabase
          .from("pacientes")
          .select("id, nome, cpf_cnpj, telefone_celular, email")
          .or(`nome.ilike.%${searchPaciente}%,cpf_cnpj.ilike.%${searchPaciente}%`)
          .eq("ativo", true)
          .limit(10)
        setPacienteResults((data as Paciente[]) || [])
      } catch (e) {
        console.error("[calendario] Erro busca paciente:", e)
      } finally {
        setSearchingPaciente(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchPaciente])

  async function handleSave() {
    if (!selectedPaciente) return
    try {
      setSaving(true)
      const supabase = getSupabase()
      const prof = profissionais.find((p) => String(p.id) === selectedProfissional)

      const payload = {
        data,
        hora_inicio: horaInicio + ":00",
        hora_fim: horaFim + ":00",
        id_paciente: selectedPaciente.id,
        id_pessoa_executor: prof?.id_pessoa || 0,
        id_local_agenda: parseInt(selectedLocal) || 0,
        id_tipo_consulta: parseInt(selectedTipoConsulta) || 0,
        id_tipo_convenio: 0,
        id_rotulo: parseInt(selectedRotulo) || 0,
        email_paciente: selectedPaciente.email,
        telefone_celular_paciente: selectedPaciente.telefone_celular,
        observacoes: observacoes || null,
        status: "AGENDADO",
        procedimentos: [],
      }

      const { error } = await supabase.from("agendas").insert(payload)
      if (error) {
        console.error("[calendario] Erro ao criar:", error.message)
        return
      }

      setSelectedPaciente(null)
      setSearchPaciente("")
      setObservacoes("")
      onSaved()
      onClose()
    } catch (error) {
      console.error("[calendario] Erro:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Novo Agendamento</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Inicio</Label>
              <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Fim</Label>
              <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Paciente</Label>
            {selectedPaciente ? (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{selectedPaciente.nome}</p>
                      <p className="text-xs text-muted-foreground">{selectedPaciente.cpf_cnpj || "Sem CPF"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPaciente(null); setSearchPaciente("") }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente por nome ou CPF..."
                  className="pl-10"
                  value={searchPaciente}
                  onChange={(e) => setSearchPaciente(e.target.value)}
                />
                {pacienteResults.length > 0 && (
                  <Card className="absolute z-10 mt-1 w-full divide-y divide-border max-h-48 overflow-y-auto">
                    {pacienteResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => { setSelectedPaciente(p); setSearchPaciente(p.nome); setPacienteResults([]) }}
                      >
                        <p className="text-sm font-medium">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.cpf_cnpj || "Sem CPF"}</p>
                      </button>
                    ))}
                  </Card>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs mb-1 block">Profissional</Label>
            <Select value={selectedProfissional} onValueChange={setSelectedProfissional}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {profissionais.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Local / Sala</Label>
            <Select value={selectedLocal} onValueChange={setSelectedLocal}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {locais.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.cor }} />
                      {l.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Tipo de Consulta</Label>
            <Select value={selectedTipoConsulta} onValueChange={setSelectedTipoConsulta}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tiposConsulta.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Rotulo</Label>
            <Select value={selectedRotulo} onValueChange={setSelectedRotulo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {rotulos.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.cor }} />
                      {r.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Observacoes</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observacoes sobre o agendamento..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !selectedPaciente}
            className="w-full gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Criar Agendamento"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
