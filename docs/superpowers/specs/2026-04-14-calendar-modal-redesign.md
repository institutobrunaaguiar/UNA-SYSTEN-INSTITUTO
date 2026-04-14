# Design Spec: Redesign do Modal do Calendário

**Data:** 2026-04-14  
**Status:** Aprovado  
**Arquivo alvo:** `components/calendario/calendar-detalhes.tsx`  
**Referência visual:** `components/propostas/proposta-detalhes.tsx`

---

## Objetivo

Replicar o padrão visual e estrutural do modal de detalhes de proposta para o modal de detalhes de agendamento do calendário, garantindo consistência entre os dois módulos.

---

## Estrutura do Componente

### 1. Cabeçalho Fixo (sticky top-0 z-10)

- Botão voltar com ícone `ArrowLeft` (fecha o Sheet)
- Linha superior: ID do agendamento (`#agendamento.id`) + badge de status colorido
- Nome do paciente em destaque (`text-xl font-bold`)
- Data e horário formatados: `Terça-feira, 14 de Abril · 10:00 – 11:00` (`text-sm text-muted-foreground`)
- Fundo `bg-background` com borda inferior `border-b`

### 2. Conteúdo Scrollável

Usa o componente interno `Section` (mesmo padrão de `proposta-detalhes.tsx`):
- Cabeçalho clicável com ícone + título + `ChevronDown` rotacionável
- Estado aberto/fechado via `useState(true)` (aberto por padrão)
- Conteúdo condicional renderizado apenas quando aberto

**Seções (em ordem):**

| # | Ícone Lucide | Título | Campos | Condicional? |
|---|---|---|---|---|
| 1 | `User` | Paciente | nome, e-mail, telefone | Não |
| 2 | `Clock` | Horário | data completa (weekday + day/month/year), horário início–fim | Não |
| 3 | `UserCheck` | Profissional | nome do profissional | Sim — só se `profissional_nome` preenchido |
| 4 | `MapPin` | Local | nome do local | Sim — só se `local_nome` preenchido |
| 5 | `MessageCircle` | Tipo de Consulta | nome do tipo | Sim — só se `tipo_consulta_nome` preenchido |
| 6 | `Tag` | Etiqueta | nome + bolinha colorida (`etiqueta_cor`) | Sim — só se `etiqueta_nome` preenchido |
| 7 | `Stethoscope` | Procedimentos | lista de procedimentos com quantidade + badge de contagem no título | Sim — só se `procedimentos.length > 0` |
| 8 | `FileText` | Observações | texto livre com `whitespace-pre-wrap` | Sim — só se `observacoes` preenchido |

### 3. Rodapé Fixo (sticky bottom-0 z-10)

- Dois elementos lado a lado (`flex gap-2`):
  - **Botão "Enviar Contrato / Termo"** (variant `outline`, ícone `FileSignature`) — abre `ContratoNovoSheet`
  - **Select "Alterar Status"** — mesmo comportamento atual: atualiza `status` no banco via `handleStatusChange()`, chama `onStatusChanged()` callback
- Fundo `bg-background` com borda superior `border-t`

---

## Comportamento

- **Seções abertas por padrão** — usuário pode fechar individualmente
- **Status update** mantém lógica existente (Supabase + callback `onStatusChanged`)
- **ContratoNovoSheet** continua sendo renderizado dentro do componente com seus próprios estados
- **SheetContent** usa `p-0` para permitir controle total de padding no header/footer/content

---

## Componente Section (interno)

Extrair ou replicar o padrão de `proposta-detalhes.tsx`:

```tsx
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 py-3 text-left">
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold flex-1">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `components/calendario/calendar-detalhes.tsx` | Reescrever estrutura do SheetContent com header fixo, seções colapsáveis e footer fixo |

Nenhum outro arquivo precisa ser alterado. O componente `ContratoNovoSheet` e a lógica de status permanecem intactos.

---

## O que NÃO muda

- Props do componente (`agendamento`, `open`, `onClose`, `onStatusChanged`)
- Lógica de `handleStatusChange` (Supabase update)
- `ContratoNovoSheet` e seus estados
- Tipos e interfaces existentes
