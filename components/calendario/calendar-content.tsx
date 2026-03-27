"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { CalendarMonthView } from "./calendar-month-view"
import { CalendarWeekView } from "./calendar-week-view"
import { CalendarDetalhes } from "./calendar-detalhes"
import { CalendarNovoAgendamento } from "./calendar-novo-agendamento"
import type { Agendamento, AgendaRotulo, CalendarView, ColorMode, ProfissionalMap } from "./types"

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function CalendarContent() {
  const [view, setView] = useState<CalendarView>("mensal")
  const [colorMode, setColorMode] = useState<ColorMode>("status")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [filterProfissional, setFilterProfissional] = useState("todos")

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [rotulos, setRotulos] = useState<AgendaRotulo[]>([])
  const [profissionais, setProfissionais] = useState<ProfissionalMap[]>([])
  const [profissionaisNomes, setProfissionaisNomes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dataKey, setDataKey] = useState(0)

  const [detalheAgendamento, setDetalheAgendamento] = useState<Agendamento | null>(null)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [novoOpen, setNovoOpen] = useState(false)

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    const t = new Date()
    setSelectedDay(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)
  }, [])

  useEffect(() => {
    async function loadRef() {
      const supabase = getSupabase()
      const [rotRes, profRes] = await Promise.all([
        supabase.from("agenda_rotulos").select("*"),
        supabase.from("profissionais").select("id, id_pessoa, nome").eq("ativo", true).order("nome"),
      ])
      if (rotRes.data) setRotulos(rotRes.data as AgendaRotulo[])
      if (profRes.data) setProfissionais(profRes.data as ProfissionalMap[])
    }
    loadRef()
  }, [])

  useEffect(() => {
    fetchAgendamentos()
  }, [currentDate, view, dataKey])

  async function fetchAgendamentos() {
    try {
      setLoading(true)
      const supabase = getSupabase()

      let startDate: string
      let endDate: string
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()

      if (view === "mensal") {
        startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`
        const lastDay = new Date(year, month + 1, 0).getDate()
        endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
      } else {
        const ws = getWeekStart(currentDate)
        const we = new Date(ws)
        we.setDate(we.getDate() + 6)
        startDate = formatDateKey(ws)
        endDate = formatDateKey(we)
      }

      const { data, error } = await supabase
        .from("agendas")
        .select("*")
        .gte("data", startDate)
        .lte("data", endDate)
        .order("data")
        .order("hora_inicio")

      if (error) {
        console.error("[calendario] Erro ao buscar agendamentos:", error.message)
        return
      }

      if (data) {
        const patientIds = [...new Set((data as Agendamento[]).map((a) => a.id_paciente))]
        let pacientesMap: Record<number, string> = {}
        if (patientIds.length > 0) {
          const { data: pacData } = await supabase
            .from("pacientes")
            .select("id, nome")
            .in("id", patientIds)
          if (pacData) {
            pacientesMap = Object.fromEntries(pacData.map((p: any) => [p.id, p.nome]))
          }
        }

        const { data: completaData } = await supabase
          .from("agenda_completa")
          .select("id, profissional, local_agenda, rotulo, tipo_consulta")
          .gte("data_agenda", startDate)
          .lte("data_agenda", endDate)

        const completaMap: Record<number, any> = {}
        if (completaData) {
          completaData.forEach((c: any) => { completaMap[c.id] = c })
        }

        const rotuloMap: Record<number, AgendaRotulo> = {}
        rotulos.forEach((r) => { rotuloMap[r.id] = r })

        const enriched = (data as Agendamento[]).map((a) => {
          const completa = completaMap[a.id]
          const profMap = profissionais.find((p) => p.id_pessoa === a.id_pessoa_executor)
          const rotulo = rotuloMap[a.id_rotulo]
          return {
            ...a,
            nome_paciente: pacientesMap[a.id_paciente] || undefined,
            nome_profissional: completa?.profissional || profMap?.nome || undefined,
            nome_local: completa?.local_agenda || undefined,
            nome_rotulo: completa?.rotulo || rotulo?.nome || undefined,
            cor_rotulo: rotulo?.cor || undefined,
            nome_tipo_consulta: completa?.tipo_consulta || undefined,
          }
        })

        const names = [...new Set(enriched.map((a) => a.nome_profissional).filter(Boolean))] as string[]
        setProfissionaisNomes(names.sort())
        setAgendamentos(enriched)
      }
    } catch (error) {
      console.error("[calendario] Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  }

  function formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  function prev() {
    if (view === "mensal") {
      setCurrentDate(new Date(year, month - 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    }
  }

  function next() {
    if (view === "mensal") {
      setCurrentDate(new Date(year, month + 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    }
  }

  function goToToday() {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDay(formatDateKey(today))
  }

  function getPeriodLabel(): string {
    if (view === "mensal") {
      return `${MESES[month]} ${year}`
    }
    const ws = getWeekStart(currentDate)
    const we = new Date(ws)
    we.setDate(we.getDate() + 6)
    const startLabel = `${ws.getDate()} ${MESES[ws.getMonth()].slice(0, 3)}`
    const endLabel = `${we.getDate()} ${MESES[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`
    return `${startLabel} - ${endLabel}`
  }

  const filteredAgendamentos = filterProfissional === "todos"
    ? agendamentos
    : agendamentos.filter((a) => a.nome_profissional === filterProfissional)

  function handleVerDetalhes(agendamento: Agendamento) {
    setDetalheAgendamento(agendamento)
    setDetalheOpen(true)
  }

  function handleStatusChanged() {
    setDetalheOpen(false)
    setDataKey((k) => k + 1)
  }

  function handleNovoSaved() {
    setDataKey((k) => k + 1)
  }

  const weekStart = getWeekStart(currentDate)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            <Button
              variant={view === "mensal" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("mensal")}
              className="gap-1"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Mensal
            </Button>
            <Button
              variant={view === "semanal" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("semanal")}
              className="gap-1"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Semanal
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-0 sm:min-w-[160px] text-center">{getPeriodLabel()}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-7 px-2">
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterProfissional} onValueChange={setFilterProfissional}>
            <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {profissionaisNomes.map((nome) => (
                <SelectItem key={nome} value={nome}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              variant={colorMode === "status" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setColorMode("status")}
            >
              Status
            </Button>
            <Button
              variant={colorMode === "rotulo" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setColorMode("rotulo")}
            >
              Rotulo
            </Button>
          </div>

          <Button
            size="sm"
            className="gap-1"
            onClick={() => setNovoOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">Carregando agendamentos...</p>
          </div>
        </div>
      ) : view === "mensal" ? (
        <CalendarMonthView
          year={year}
          month={month}
          agendamentos={filteredAgendamentos}
          selectedDay={selectedDay}
          colorMode={colorMode}
          onSelectDay={setSelectedDay}
          onVerDetalhes={handleVerDetalhes}
        />
      ) : (
        <CalendarWeekView
          weekStart={weekStart}
          agendamentos={filteredAgendamentos}
          colorMode={colorMode}
          onVerDetalhes={handleVerDetalhes}
        />
      )}

      <CalendarDetalhes
        agendamento={detalheAgendamento}
        open={detalheOpen}
        onClose={() => setDetalheOpen(false)}
        onStatusChanged={handleStatusChanged}
      />

      <CalendarNovoAgendamento
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        onSaved={handleNovoSaved}
        defaultDate={selectedDay || undefined}
      />
    </div>
  )
}
