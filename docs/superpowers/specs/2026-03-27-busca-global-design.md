# Busca Global — Design Spec

**Data:** 2026-03-27
**Status:** Aprovado

## Contexto

O campo de busca no header é um placeholder não funcional. O objetivo é ativá-lo como trigger de uma command palette (usando a biblioteca `cmdk` já instalada) que busca pacientes e propostas simultaneamente por nome ou CPF.

## Decisoes

| Decisao | Escolha |
|---|---|
| Apresentação dos resultados | Command palette centralizada (modal) |
| Abertura | Clique no campo do header OU atalho ⌘K |
| Fontes de busca | Tabelas `pacientes` e `propostas` |
| Campos buscados | nome/cpf_cnpj (pacientes), nome_cliente/cpf_cliente (propostas) |
| Mínimo de caracteres | 2 |
| Debounce | 300ms |

## Componentes

```
components/busca/
  busca-modal.tsx      # Modal principal com CommandDialog do cmdk
  busca-trigger.tsx    # Botão do header que abre o modal
```

`components/dashboard/header.tsx` — substituir o Input atual pelo `BuscaTrigger`.

## Comportamento

1. `BuscaTrigger` — botão estilizado como input (não editável inline). Mostra "Buscar... ⌘K". Ao clicar, abre `BuscaModal`.
2. Hook `useEffect` registra listener `⌘K` / `Ctrl+K` globalmente (em `app/layout.tsx` ou no próprio modal).
3. `BuscaModal` usa `CommandDialog` do cmdk. Ao digitar ≥ 2 caracteres, dispara fetch com debounce de 300ms.
4. Busca simultânea:
   - `pacientes`: filtra por `nome.ilike.%termo%` ou `cpf_cnpj.ilike.%termo%`, retorna id, nome, cpf_cnpj, telefone_celular
   - `propostas`: filtra por `nome_cliente.ilike.%termo%` ou `cpf_cliente.ilike.%termo%`, retorna id, nome_cliente, valor_total, status, itens
5. Resultados agrupados em duas seções: **PACIENTES** e **PROPOSTAS**.
6. Ao pressionar Enter ou clicar em um resultado:
   - Paciente → navega para `/pacientes` com scroll/highlight do registro (usando query param `?id=X`)
   - Proposta → abre o sheet de detalhes da proposta (reutiliza `PropostaDetalhes`)
7. ESC fecha o modal.

## Layout dos Resultados

**Paciente:**
- Avatar com iniciais (cor gerada a partir do nome)
- Nome completo
- CPF formatado + telefone
- Badge "Paciente"

**Proposta:**
- Ícone de documento (cor por status)
- Nome do cliente
- Valor total formatado + nomes dos procedimentos (truncado)
- Badge colorido com o status (usa STATUS_CONFIG de `propostas/types.ts`)

## Estado vazio / loading

- Sem termo: mostra mensagem "Digite para buscar pacientes ou propostas"
- Buscando: spinner inline
- Sem resultados: "Nenhum resultado para '[termo]'"

## Tipos TypeScript

```typescript
interface BuscaResultadoPaciente {
  id: number
  nome: string
  cpf_cnpj: string | null
  telefone_celular: string | null
}

interface BuscaResultadoProposta {
  id: number
  nome_cliente: string
  valor_total: number
  status: PropostaStatus
  itens: PropostaItem[]
}
```
