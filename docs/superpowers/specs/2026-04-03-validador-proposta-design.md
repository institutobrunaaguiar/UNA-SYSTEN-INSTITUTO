# Design: Validador de Proposta

**Data:** 2026-04-03  
**Status:** Aprovado

## Contexto

As consultoras negociam propostas com pacientes. Para bonificar negociações bem feitas, um Admin precisa auditar cada proposta paga e aprovar ou reprovar. Hoje não existe nenhum fluxo de validação — qualquer usuário pode alterar status sem restrição.

## Objetivo

Adicionar um sistema de validação/auditoria de propostas na página `/proposta`. Admins podem aprovar ou reprovar propostas pagas. Operadores e visualizadores veem apenas o status da auditoria e o motivo de reprovação, sem poder de ação.

## Banco de Dados

Campos já adicionados na tabela `propostas`:

```sql
ALTER TABLE propostas 
ADD COLUMN validacao_status TEXT NOT NULL DEFAULT 'pendente',
ADD COLUMN validacao_motivo TEXT,
ADD COLUMN validado_em TIMESTAMPTZ;
```

| Campo | Tipo | Default | Descrição |
|---|---|---|---|
| `validacao_status` | `TEXT NOT NULL` | `'pendente'` | `pendente`, `aprovada`, `reprovada` |
| `validacao_motivo` | `TEXT` | `NULL` | Motivo da reprovação (obrigatório se reprovada) |
| `validado_em` | `TIMESTAMPTZ` | `NULL` | Data/hora da validação |

## Modelo de Dados

Em `components/propostas/types.ts`, adicionar à interface `Proposta`:

```ts
validacao_status: "pendente" | "aprovada" | "reprovada"
validacao_motivo: string | null
validado_em: string | null
```

Novo tipo:

```ts
export type ValidacaoStatus = "pendente" | "aprovada" | "reprovada"
```

Config de badges:

```ts
export const VALIDACAO_CONFIG: Record<ValidacaoStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-50 text-yellow-700" },
  aprovada: { label: "Aprovada", color: "bg-green-50 text-green-700" },
  reprovada: { label: "Reprovada", color: "bg-red-50 text-red-700" },
}
```

## Interface — Admin

### Aba "Validação" na página de propostas

Dentro de `propostas-lista.tsx`, adicionar uma nova aba no topo ao lado dos filtros de status existentes. A aba aparece **apenas para usuários com `role === 'admin'`**.

**Aba "Validação":**
- Badge com contador de propostas pendentes (ex: "Validação (3)")
- Filtra propostas com `status = 'pago'` AND `validacao_status = 'pendente'`
- Cada card de proposta exibe: nome do cliente, procedimentos, valor total, descontos aplicados
- Dois botões de ação por proposta:
  - **Aprovar** — seta `validacao_status = 'aprovada'` e `validado_em = now()`. Ação direta, sem dialog.
  - **Reprovar** — abre um Dialog com campo de texto obrigatório para o motivo. Seta `validacao_status = 'reprovada'`, `validacao_motivo = texto`, `validado_em = now()`.

**Quando a aba "Validação" está ativa:**
- O calendário e os filtros de status regulares ficam ocultos
- A lista mostra apenas as propostas pendentes de validação
- Propostas já validadas (aprovadas/reprovadas) não aparecem nesta aba

### Ações no menu da proposta (lista regular)

No dropdown menu de cada proposta (para Admins), adicionar opções:
- "Aprovar" — visível quando `validacao_status !== 'aprovada'`
- "Reprovar" — visível quando `validacao_status !== 'reprovada'`

Isso permite que o Admin valide sem precisar ir na aba dedicada.

## Interface — Operador / Visualizador

### Badge de validação na lista

Na lista regular de propostas, exibir um badge de validação ao lado do badge de status existente:
- `Pendente` (amarelo)
- `Aprovada` (verde)
- `Reprovada` (vermelho)

### Motivo no detalhe

No `proposta-detalhes.tsx`, adicionar seção "Auditoria" após observações:
- Exibe `validacao_status` como badge
- Se reprovada: exibe `validacao_motivo`
- Se validada: exibe `validado_em` formatado

### Sem aba de validação

Operadores e visualizadores **não veem** a aba "Validação". Apenas os badges e o motivo.

## Permissões

O componente `PropostasLista` precisa acessar o `useUser()` do contexto para determinar o role. As condições são:

- `role === 'admin'`: vê aba "Validação", botões de aprovar/reprovar no menu
- `role !== 'admin'`: vê apenas badges de validação, motivo no detalhe

## Componentes

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `components/propostas/types.ts` | 3 campos na interface, `ValidacaoStatus` type, `VALIDACAO_CONFIG` |
| `components/propostas/propostas-lista.tsx` | Aba "Validação" para admin, badge de validação na lista, ações no menu |
| `components/propostas/proposta-detalhes.tsx` | Seção "Auditoria" com status + motivo |
| `components/propostas/propostas-content.tsx` | Passar dados de validação ao duplicar (reset para pendente) |

### Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `components/propostas/validacao-reprovar-dialog.tsx` | Dialog de reprovação com campo de motivo obrigatório |

## Fluxo

1. Consultora cria proposta → `validacao_status = 'pendente'` (default do banco)
2. Proposta é negociada e eventualmente fica `status = 'pago'`
3. Admin acessa aba "Validação" → vê propostas pagas pendentes
4. Admin clica "Aprovar" → `validacao_status = 'aprovada'`, `validado_em = now()`
5. Admin clica "Reprovar" → dialog com motivo obrigatório → `validacao_status = 'reprovada'`, `validacao_motivo = texto`, `validado_em = now()`
6. Consultora vê o badge "Aprovada" ou "Reprovada" + motivo na proposta

## Fora do Escopo

- Notificações para a consultora quando aprovada/reprovada
- Re-validação (alterar de reprovada para aprovada)
- Histórico de validações
- Cálculo automático de bonificação
- Integração com módulo de comissões
