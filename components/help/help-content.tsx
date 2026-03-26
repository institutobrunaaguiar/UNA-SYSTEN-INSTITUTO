"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, Video, MessageCircle, Mail } from "lucide-react"

const helpCategories = [
  {
    icon: BookOpen,
    title: "Documentação",
    description: "Navegue por nossos guias e tutoriais abrangentes",
    color: "bg-blue-500",
  },
  { icon: Video, title: "Tutoriais em Vídeo", description: "Assista guias em vídeo passo a passo", color: "bg-purple-500" },
  {
    icon: MessageCircle,
    title: "Fórum da Comunidade",
    description: "Conecte-se com outros usuários e obtenha respostas",
    color: "bg-green-600",
  },
  { icon: Mail, title: "Contatar Suporte", description: "Obtenha ajuda da nossa equipe de suporte", color: "bg-amber-500" },
]

const faqs = [
  {
    question: "Como criar um novo projeto?",
    answer: "Clique no botão 'Adicionar Projeto' no painel para criar um novo projeto.",
  },
  {
    question: "Posso convidar membros do time?",
    answer: "Sim, vá para a página Time e clique em 'Adicionar Membro' para convidar novos membros.",
  },
  {
    question: "Como rastrear tempo nas tarefas?",
    answer: "Use o widget Cronômetro no painel para começar a rastrear tempo para suas tarefas.",
  },
  {
    question: "Posso exportar meus dados?",
    answer: "Sim, você pode exportar seus dados na página Admin em Gerenciamento de Dados.",
  },
]

export function HelpContent() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar ajuda..." className="pl-10 h-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {helpCategories.map((category, index) => (
          <Card
            key={category.title}
            className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${category.color}`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Perguntas Frequentes</h3>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="p-4 rounded-lg border border-border hover:bg-secondary transition-all duration-300 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h4 className="font-medium mb-2">{faq.question}</h4>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
