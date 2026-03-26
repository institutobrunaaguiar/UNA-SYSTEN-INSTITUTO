"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, Calendar, Tag } from "lucide-react"
import { useState } from "react"

const tasks = [
  {
    id: 1,
    title: "Projetar mockup de página inicial",
    project: "Redesenho do Website",
    priority: "Alta",
    dueDate: "24 de Nov, 2024",
    completed: false,
    tags: ["Design", "UI/UX"],
  },
  {
    id: 2,
    title: "Implementar fluxo de autenticação",
    project: "App Mobile",
    priority: "Alta",
    dueDate: "25 de Nov, 2024",
    completed: false,
    tags: ["Backend", "Segurança"],
  },
  {
    id: 3,
    title: "Revisar pull requests",
    project: "Projeto Github",
    priority: "Média",
    dueDate: "23 de Nov, 2024",
    completed: true,
    tags: ["Revisão de Código"],
  },
  {
    id: 4,
    title: "Atualizar documentação",
    project: "Desenvolvimento da API",
    priority: "Baixa",
    dueDate: "26 de Nov, 2024",
    completed: false,
    tags: ["Documentação"],
  },
  {
    id: 5,
    title: "Corrigir problemas de layout responsivo",
    project: "Redesenho do Website",
    priority: "Alta",
    dueDate: "24 de Nov, 2024",
    completed: false,
    tags: ["Frontend", "Bug"],
  },
  {
    id: 6,
    title: "Otimização de banco de dados",
    project: "Sistema Backend",
    priority: "Média",
    dueDate: "27 de Nov, 2024",
    completed: false,
    tags: ["Database", "Desempenho"],
  },
]

export function TasksContent() {
  const [filter, setFilter] = useState("all")

  const filteredTasks =
    filter === "all"
      ? tasks
      : filter === "completed"
        ? tasks.filter((t) => t.completed)
        : tasks.filter((t) => !t.completed)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar tarefas..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filtro
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Calendar className="w-4 h-4" />
            Data
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
          Todos ({tasks.length})
        </Button>
        <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")} size="sm">
          Ativos ({tasks.filter((t) => !t.completed).length})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          size="sm"
        >
          Concluídos ({tasks.filter((t) => t.completed).length})
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredTasks.map((task, index) => (
          <Card
            key={task.id}
            className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <Checkbox checked={task.completed} className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className={`font-semibold text-foreground ${task.completed ? "line-through opacity-60" : ""}`}>
                    {task.title}
                  </h3>
                  <Badge
                    variant={
                      task.priority === "Alta" ? "destructive" : task.priority === "Média" ? "default" : "secondary"
                    }
                    className="shrink-0"
                  >
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {task.project}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {task.dueDate}
                  </span>
                </div>
                <div className="flex gap-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
