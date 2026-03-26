"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Plus } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

interface Paciente {
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

export function PacientesContent() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    fetchPacientes()
  }, [])

  useEffect(() => {
    filterPacientes()
  }, [searchTerm, filterStatus, pacientes])

  async function fetchPacientes() {
    try {
      setLoading(true)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[v0] Variáveis Supabase não configuradas")
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.from("pacientes").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Erro ao buscar pacientes:", error.message)
        return
      }

      if (data) {
        console.log("[v0] Pacientes carregados:", data.length)
        setPacientes(data as Paciente[])
      }
    } catch (error) {
      console.error("[v0] Erro na busca de pacientes:", error)
    } finally {
      setLoading(false)
    }
  }

  function filterPacientes() {
    let filtered = pacientes

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.nome.toLowerCase().includes(term) ||
          (p.email && p.email.toLowerCase().includes(term)) ||
          (p.cpf_cnpj && p.cpf_cnpj.includes(term)) ||
          (p.telefone_celular && p.telefone_celular.includes(term))
      )
    }

    if (filterStatus === "ativo") {
      filtered = filtered.filter((p) => p.ativo === true)
    } else if (filterStatus === "inativo") {
      filtered = filtered.filter((p) => p.ativo === false)
    }

    setFilteredPacientes(filtered)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filtro
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")} size="sm">
          Todos ({pacientes.length})
        </Button>
        <Button
          variant={filterStatus === "ativo" ? "default" : "outline"}
          onClick={() => setFilterStatus("ativo")}
          size="sm"
        >
          Ativos ({pacientes.filter((p) => p.ativo).length})
        </Button>
        <Button
          variant={filterStatus === "inativo" ? "default" : "outline"}
          onClick={() => setFilterStatus("inativo")}
          size="sm"
        >
          Inativos ({pacientes.filter((p) => !p.ativo).length})
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Carregando pacientes...</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Card className="border border-border">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Telefone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">CPF/CNPJ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Data de Nascimento</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Cidade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPacientes.length > 0 ? (
                  filteredPacientes.map((paciente) => (
                    <tr
                      key={paciente.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{paciente.id}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div>
                          <p className="font-medium">{paciente.nome}</p>
                          {paciente.nome_social && <p className="text-xs text-muted-foreground">({paciente.nome_social})</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{paciente.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{paciente.telefone_celular || paciente.telefone || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{paciente.cpf_cnpj || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {paciente.data_nascimento ? new Date(paciente.data_nascimento).toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{paciente.id_cidade || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={paciente.ativo ? "default" : "secondary"}>
                          {paciente.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" className="bg-transparent hover:bg-muted">
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhum paciente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredPacientes.length} de {pacientes.length} pacientes</span>
      </div>
    </div>
  )
}
