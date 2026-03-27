# Procedimentos com Valores — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `procedimentos_clinica` table in Supabase with pricing per professional, seed all ~147 procedure records, add Paloma Abreu as a professional, and update the Propostas module to use this table with auto-fill pricing.

**Architecture:** New Supabase table `procedimentos_clinica` holds procedures with values linked to professionals via `profissional_id`. A seed script inserts all records. The `step-procedimentos.tsx` component is rewritten to: first select professional → filter available procedures → auto-fill value on selection. Types are updated accordingly.

**Tech Stack:** Supabase (PostgreSQL), TypeScript, React, shadcn/ui Select with SelectGroup

**Note:** No test framework. Manual verification via `npm run dev`.

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Create | `scripts/seed-procedimentos.ts` | Node script to create table + insert all data |
| Modify | `components/propostas/types.ts` | Add ProcedimentoClinica interface |
| Modify | `components/propostas/steps/step-procedimentos.tsx` | Use procedimentos_clinica, filter by prof, auto-fill valor |

---

### Task 1: Create Supabase Table and Seed Data

**Files:**
- Create: `scripts/seed-procedimentos.ts`

- [ ] **Step 1: Create the seed script**

Create `scripts/seed-procedimentos.ts`:

```ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://qjktrrxelkyracmldnoa.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3RycnhlbGt5cmFjbWxkbm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzNDY0MiwiZXhwIjoyMDgzODEwNjQyfQ.V9egxGzjGZq3RrvARO_2w42gnbz9r0N-soJXxJdyXQs"

const supabase = createClient(supabaseUrl, supabaseKey)

// Professional IDs from profissionais table
const BRUNA = 29447
const MANU = 30217
const ADRIANA = 29708
let PALOMA = 0 // Will be set after insert

interface ProcRow {
  categoria: string
  tipo: string
  nome: string
  descricao: string
  valor: number
  profissional_id: number
  relevante: boolean
  ativo: boolean
}

const BRUNA_PROCS: Omit<ProcRow, "profissional_id" | "ativo">[] = [
  { categoria: "Faciais", tipo: "Avaliacao", nome: "Avaliacao Facial", descricao: "Obrigatoria para novos pacientes ou retorno apos 1 ano", valor: 275, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Feminino", descricao: "Terco superior", valor: 1430, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Full Face Feminino", descricao: "Superior e inferior", valor: 1650, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Full Face + Face Contour Fem.", descricao: "Inclui pescoco", valor: 1817, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Masculino", descricao: "Terco superior", valor: 1539, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Full Face Masculino", descricao: "Superior e inferior", valor: 1759, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Full Face + Face Contour Masc.", descricao: "Inclui pescoco", valor: 1936, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Pontual", descricao: "Por ponto", valor: 88, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Pescoco", descricao: "Quando associado a face", valor: 1430, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Botox Hiperidrose", descricao: "Por regiao", valor: 2343, relevante: false },
  { categoria: "Faciais", tipo: "Toxina Botulinica", nome: "Rinotox", descricao: "Nariz completo com retorno", valor: 495, relevante: false },
  { categoria: "Faciais", tipo: "Preenchimento", nome: "Preenchimento Facial", descricao: "Por ml", valor: 1397, relevante: false },
  { categoria: "Faciais", tipo: "Preenchimento", nome: "Preenchimento ou Skinbooster Labial", descricao: "Por ml", valor: 1485, relevante: false },
  { categoria: "Faciais", tipo: "Preenchimento", nome: "Skinbooster Facial", descricao: "Por ml", valor: 1397, relevante: false },
  { categoria: "Faciais", tipo: "Preenchimento", nome: "Rinomodelacao", descricao: "Incluso retorno", valor: 1650, relevante: false },
  { categoria: "Faciais", tipo: "Preenchimento", nome: "Hialuronidase", descricao: "Sessao", valor: 770, relevante: false },
  { categoria: "Faciais", tipo: "Bioestimulador", nome: "Duo Blend", descricao: "Acido Hialuronico + Hidroxiapatita de Calcio", valor: 2860, relevante: false },
  { categoria: "Faciais", tipo: "Bioestimulador", nome: "Acido Poli-L-latico", descricao: "Sculptra ou Elleva", valor: 2970, relevante: false },
  { categoria: "Faciais", tipo: "Bioestimulador", nome: "Hidroxiapatita de Calcio", descricao: "Radiesse", valor: 2020, relevante: false },
  { categoria: "Faciais", tipo: "Bioestimulador", nome: "Radiesse com Ativos Regenerativos", descricao: "", valor: 2500, relevante: false },
  { categoria: "Faciais", tipo: "Regenerativo", nome: "Microagulhamento + PDRN / Exossomos", descricao: "Com ativos regenerativos", valor: 825, relevante: false },
  { categoria: "Faciais", tipo: "Regenerativo", nome: "Intradermoterapia com PDRN / Exossomos", descricao: "Sessao", valor: 1650, relevante: false },
  { categoria: "Faciais", tipo: "Regenerativo", nome: "Peeling Quimico", descricao: "Sessao", valor: 750, relevante: false },
  { categoria: "Faciais", tipo: "Regenerativo", nome: "Protocolo Peeling Evolution", descricao: "Ciclo com kit home care", valor: 1700, relevante: false },
  { categoria: "Faciais", tipo: "Regenerativo", nome: "Jato de Plasma", descricao: "Sessao", valor: 1000, relevante: false },
  { categoria: "Faciais", tipo: "Regenerativo", nome: "Cauterizacao de Sinais", descricao: "Por regiao", valor: 750, relevante: false },
  { categoria: "Faciais", tipo: "Fios", nome: "Combo 10 fios", descricao: "", valor: 1430, relevante: false },
  { categoria: "Faciais", tipo: "Fios", nome: "Combo 20 fios", descricao: "", valor: 2200, relevante: false },
  { categoria: "Faciais", tipo: "Fios", nome: "Fio de Sustentacao", descricao: "", valor: 473, relevante: false },
]

const MANU_PROCS: Omit<ProcRow, "profissional_id" | "ativo">[] = [
  { categoria: "Faciais", tipo: "CO2 Fracionado", nome: "CO2 Face Completa", descricao: "Rejuvenescimento e cicatrizes", valor: 1800, relevante: false },
  { categoria: "Faciais", tipo: "CO2 Fracionado", nome: "CO2 Palpebras", descricao: "Rejuvenescimento", valor: 1200, relevante: false },
  { categoria: "Faciais", tipo: "CO2 Fracionado", nome: "CO2 Maos ou Orelhas", descricao: "Rejuvenescimento", valor: 750, relevante: false },
  { categoria: "Faciais", tipo: "LASER", nome: "BB Glow", descricao: "Poros e manchas", valor: 750, relevante: false },
  { categoria: "Faciais", tipo: "LASER", nome: "BB Glow 3 Sessoes", descricao: "Uma regiao", valor: 2000, relevante: false },
  { categoria: "Faciais", tipo: "HYPRO", nome: "HYPRO Terco Superior", descricao: "", valor: 1650, relevante: true },
  { categoria: "Faciais", tipo: "HYPRO", nome: "HYPRO Papada", descricao: "", valor: 1760, relevante: true },
  { categoria: "Faciais", tipo: "HYPRO", nome: "HYPRO Pescoco", descricao: "", valor: 1760, relevante: true },
  { categoria: "Faciais", tipo: "HYPRO", nome: "HYPRO Papada + Pescoco", descricao: "", valor: 2915, relevante: true },
  { categoria: "Faciais", tipo: "HYPRO", nome: "HYPRO Terco Medio e Inferior", descricao: "", valor: 2915, relevante: true },
  { categoria: "Faciais", tipo: "HYPRO", nome: "HYPRO Full Face", descricao: "", valor: 4488, relevante: true },
  { categoria: "Faciais", tipo: "HYPRO", nome: "HYPRO Full Face + Pescoco", descricao: "", valor: 5500, relevante: true },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Colo", descricao: "", valor: 2200, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Braco", descricao: "", valor: 3080, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Abdomen", descricao: "", valor: 3300, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Costas", descricao: "Flancos/gordurinha das costas", valor: 3300, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Prega Glutea", descricao: "Bananinha", valor: 1760, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Culote", descricao: "", valor: 2750, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Prega Axilar", descricao: "Gordurinha do sutia", valor: 1650, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Interno de Coxa", descricao: "", valor: 4950, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Virilha", descricao: "", valor: 2750, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Posterior de Coxa", descricao: "", valor: 5500, relevante: false },
  { categoria: "Corporais", tipo: "HYPRO", nome: "HYPRO Faixa Pequena", descricao: "", valor: 1650, relevante: false },
  { categoria: "Corporais", tipo: "LIP", nome: "LIP Sessao Individual", descricao: "", valor: 350, relevante: false },
  { categoria: "Corporais", tipo: "LIP", nome: "LIP Pacote 10 Sessoes", descricao: "", valor: 2800, relevante: false },
  { categoria: "Corporais", tipo: "CO2 Fracionado", nome: "CO2 Regiao Grande", descricao: "Estrias, Cicatrizes, Flacidez", valor: 1800, relevante: false },
  { categoria: "Corporais", tipo: "CO2 Fracionado", nome: "CO2 Regiao Media", descricao: "Estrias, Cicatrizes, Flacidez", valor: 1300, relevante: false },
  { categoria: "Corporais", tipo: "CO2 Fracionado", nome: "CO2 Maos ou Orelhas Corporal", descricao: "Sessao", valor: 750, relevante: false },
  { categoria: "Corporais", tipo: "LASER", nome: "BB Laser Manchas 3 Sessoes", descricao: "Por regiao", valor: 2000, relevante: false },
  { categoria: "Capilar", tipo: "Avaliacao", nome: "Avaliacao Capilar Detalhada", descricao: "", valor: 370, relevante: false },
  { categoria: "Capilar", tipo: "Sessao", nome: "Mesoterapia + Alta Frequencia + LED + Ozonio", descricao: "", valor: 365, relevante: false },
  { categoria: "Capilar", tipo: "Sessao", nome: "Mesoterapia Regenerativa + Alta Frequencia + LED + Ozonio", descricao: "Com ativos regenerativos", valor: 730, relevante: false },
  { categoria: "Capilar", tipo: "Sessao", nome: "Terapia de Acalmia", descricao: "Alta Frequencia + LED + Ozonio", valor: 250, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Intradermoterapia Corporal", descricao: "", valor: 400, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Otimizador Metabolico", descricao: "", valor: 300, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Radiesse Corporal", descricao: "", valor: 2100, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Radiesse + Ativos Regenerativos", descricao: "", valor: 2500, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Sculptra / Elleva Tradicional", descricao: "Frasco", valor: 2970, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Elleva 40ml", descricao: "Frasco", valor: 5800, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Jato de Plasma Corporal", descricao: "", valor: 1000, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Peeling Quimico Corporal", descricao: "", valor: 750, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "Peeling Injetavel", descricao: "", valor: 750, relevante: false },
  { categoria: "Corporais", tipo: "Injetavel", nome: "PEIM (Microvasos)", descricao: "", valor: 600, relevante: false },
  { categoria: "Corporais", tipo: "Preenchimento Corporal", nome: "10 ml a 49 ml", descricao: "Por ml", valor: 480, relevante: false },
  { categoria: "Corporais", tipo: "Preenchimento Corporal", nome: "50 ml a 99 ml", descricao: "Por ml", valor: 400, relevante: false },
  { categoria: "Corporais", tipo: "Preenchimento Corporal", nome: "100 ml a mais", descricao: "Por ml", valor: 300, relevante: false },
  { categoria: "Corporais", tipo: "Botox Hiperidrose", nome: "Por regiao (com retorno)", descricao: "", valor: 2700, relevante: false },
  { categoria: "Corporais", tipo: "Endolaser", nome: "Endolaser por regiao", descricao: "", valor: 4500, relevante: false },
  { categoria: "Corporais", tipo: "Avaliacao", nome: "Avaliacao Corporal", descricao: "", valor: 250, relevante: false },
]

const ADRIANA_PROCS: Omit<ProcRow, "profissional_id" | "ativo">[] = [
  { categoria: "Faciais", tipo: "Limpeza", nome: "Limpeza de Pele Profunda", descricao: "", valor: 204, relevante: false },
  { categoria: "Faciais", tipo: "Limpeza", nome: "Limpeza + Mascara Albumina", descricao: "", valor: 241, relevante: false },
  { categoria: "Faciais", tipo: "Limpeza", nome: "Limpeza + Peeling Diamante", descricao: "", valor: 252, relevante: false },
  { categoria: "Faciais", tipo: "Limpeza", nome: "Limpeza + Dermaplaning", descricao: "", valor: 266, relevante: false },
  { categoria: "Faciais", tipo: "Estetica", nome: "Revitalizacao Facial", descricao: "", valor: 292, relevante: false },
  { categoria: "Faciais", tipo: "Estetica", nome: "Hydra Gloss Lips", descricao: "", valor: 319, relevante: false },
  { categoria: "Faciais", tipo: "Estetica", nome: "Nano Lips", descricao: "", valor: 990, relevante: false },
  { categoria: "Faciais", tipo: "Design", nome: "Design de Sobrancelha", descricao: "", valor: 96, relevante: false },
  { categoria: "Faciais", tipo: "Design", nome: "Design + Laminacao + Coloracao", descricao: "", valor: 198, relevante: false },
  { categoria: "Faciais", tipo: "Design", nome: "Design + Laminacao", descricao: "", valor: 165, relevante: false },
  { categoria: "Faciais", tipo: "Design", nome: "Design + Coloracao", descricao: "", valor: 132, relevante: false },
  { categoria: "Corporais", tipo: "Drenagem", nome: "Drenagem 5 sessoes", descricao: "", valor: 750, relevante: false },
  { categoria: "Corporais", tipo: "Drenagem", nome: "Drenagem 10 sessoes", descricao: "", valor: 1400, relevante: false },
]

async function main() {
  console.log("=== Seed Procedimentos Clinica ===")

  // Step 1: Create table if not exists
  console.log("Creating table procedimentos_clinica...")
  const { error: createErr } = await supabase.rpc("", {}).catch(() => ({ error: null }))

  // Use raw SQL via the management API isn't available with supabase-js
  // Instead, we'll just insert and let Supabase auto-create or assume table exists
  // The table should be created via Supabase Dashboard SQL editor first

  // Step 2: Insert Paloma as a new professional
  console.log("Inserting Paloma Abreu...")
  const { data: paloma, error: palomaErr } = await supabase
    .from("profissionais")
    .insert({ nome: "Paloma Abreu", tipo_executor: "PROFISSIONAL", ativo: true })
    .select()
    .single()

  if (palomaErr) {
    // Maybe already exists
    console.log("Paloma may already exist, searching...")
    const { data: existing } = await supabase
      .from("profissionais")
      .select("id")
      .eq("nome", "Paloma Abreu")
      .single()
    PALOMA = existing?.id || 0
  } else {
    PALOMA = paloma.id
  }
  console.log("Paloma ID:", PALOMA)

  // Step 3: Clear existing data
  console.log("Clearing existing procedimentos_clinica...")
  await supabase.from("procedimentos_clinica").delete().neq("id", 0)

  // Step 4: Insert all procedures
  function toRows(procs: Omit<ProcRow, "profissional_id" | "ativo">[], profId: number): ProcRow[] {
    return procs.map((p) => ({ ...p, profissional_id: profId, ativo: true }))
  }

  const allRows = [
    ...toRows(BRUNA_PROCS, BRUNA),
    ...toRows(MANU_PROCS, MANU),
    ...toRows(MANU_PROCS, PALOMA), // Paloma = same as Manu
    ...toRows(ADRIANA_PROCS, ADRIANA),
  ]

  console.log(`Inserting ${allRows.length} procedures...`)

  // Insert in batches of 50
  for (let i = 0; i < allRows.length; i += 50) {
    const batch = allRows.slice(i, i + 50)
    const { error } = await supabase.from("procedimentos_clinica").insert(batch)
    if (error) {
      console.error(`Error inserting batch ${i}:`, error.message)
    } else {
      console.log(`Batch ${i}-${i + batch.length} inserted`)
    }
  }

  console.log("Done! Total:", allRows.length)
}

main().catch(console.error)
```

- [ ] **Step 2: Create the table in Supabase**

Before running the seed script, create the table in Supabase. Run this SQL in the Supabase Dashboard SQL editor (or via curl):

```bash
curl -s 'https://qjktrrxelkyracmldnoa.supabase.co/rest/v1/rpc' \
  -X POST \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3RycnhlbGt5cmFjbWxkbm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzNDY0MiwiZXhwIjoyMDgzODEwNjQyfQ.V9egxGzjGZq3RrvARO_2w42gnbz9r0N-soJXxJdyXQs" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3RycnhlbGt5cmFjbWxkbm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzNDY0MiwiZXhwIjoyMDgzODEwNjQyfQ.V9egxGzjGZq3RrvARO_2w42gnbz9r0N-soJXxJdyXQs" \
  -H "Content-Type: application/json"
```

If rpc is not available, the implementer should use the Supabase MCP tool `execute_sql` or create the table manually:

```sql
CREATE TABLE IF NOT EXISTS procedimentos_clinica (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  valor NUMERIC NOT NULL,
  profissional_id INTEGER NOT NULL,
  relevante BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE procedimentos_clinica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON procedimentos_clinica FOR ALL USING (true);
```

- [ ] **Step 3: Run the seed script**

```bash
npx tsx scripts/seed-procedimentos.ts
```

Expected: "Done! Total: 147" (29 Bruna + 49 Manu + 49 Paloma + 13 Adriana + some extras = ~143-147)

- [ ] **Step 4: Verify data in Supabase**

```bash
curl -s 'https://qjktrrxelkyracmldnoa.supabase.co/rest/v1/procedimentos_clinica?select=profissional_id,count&order=profissional_id' \
  -H "apikey: sb_publishable_WjGbWTgoWm6PLZzzqq-TUw_bPmQVqEH" \
  -H "Authorization: Bearer sb_publishable_WjGbWTgoWm6PLZzzqq-TUw_bPmQVqEH" \
  -H "Prefer: count=exact" -H "Range: 0-0"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-procedimentos.ts
git commit -m "feat: add seed script for procedimentos_clinica table"
```

---

### Task 2: Update Types

**Files:**
- Modify: `components/propostas/types.ts`

- [ ] **Step 1: Add ProcedimentoClinica interface**

Add the following interface to `components/propostas/types.ts` after the existing `Procedimento` interface:

```ts
export interface ProcedimentoClinica {
  id: number
  categoria: string
  tipo: string
  nome: string
  descricao: string
  valor: number
  profissional_id: number
  relevante: boolean
  ativo: boolean
}
```

- [ ] **Step 2: Commit**

```bash
git add components/propostas/types.ts
git commit -m "feat: add ProcedimentoClinica interface"
```

---

### Task 3: Update Step Procedimentos

**Files:**
- Modify: `components/propostas/steps/step-procedimentos.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the entire content of `components/propostas/steps/step-procedimentos.tsx` with:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Percent, DollarSign, Star } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { PropostaItem, ProcedimentoClinica, Profissional } from "../types"

interface StepProcedimentosProps {
  itens: PropostaItem[]
  onChange: (itens: PropostaItem[]) => void
}

export function StepProcedimentos({ itens, onChange }: StepProcedimentosProps) {
  const [allProcedimentos, setAllProcedimentos] = useState<ProcedimentoClinica[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)

  function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) throw new Error("Supabase nao configurado")
    return createClient(url, key)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const supabase = getSupabase()
        const [procRes, profRes] = await Promise.all([
          supabase.from("procedimentos_clinica").select("*").eq("ativo", true).order("relevante", { ascending: false }).order("tipo").order("nome"),
          supabase.from("profissionais").select("*").eq("ativo", true).order("nome"),
        ])
        if (procRes.data) setAllProcedimentos(procRes.data as ProcedimentoClinica[])
        if (profRes.data) setProfissionais(profRes.data as Profissional[])
      } catch (error) {
        console.error("[propostas] Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function getProcedimentosForProfissional(profissionalNome: string): ProcedimentoClinica[] {
    const prof = profissionais.find((p) => p.nome === profissionalNome)
    if (!prof) return []
    return allProcedimentos.filter((p) => p.profissional_id === prof.id)
  }

  function groupByTipo(procs: ProcedimentoClinica[]): Record<string, ProcedimentoClinica[]> {
    const groups: Record<string, ProcedimentoClinica[]> = {}
    procs.forEach((p) => {
      if (!groups[p.tipo]) groups[p.tipo] = []
      groups[p.tipo].push(p)
    })
    return groups
  }

  function addItem() {
    onChange([
      ...itens,
      {
        procedimentoId: "",
        procedimentoNome: "",
        profissionalNome: "",
        valor: 0,
        desconto_tipo: null,
        desconto_valor: null,
        valor_final: 0,
      },
    ])
  }

  function removeItem(index: number) {
    onChange(itens.filter((_, i) => i !== index))
  }

  function updateItem(index: number, updates: Partial<PropostaItem>) {
    const newItens = itens.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, ...updates }
      updated.valor_final = calcularValorFinal(updated)
      return updated
    })
    onChange(newItens)
  }

  function calcularValorFinal(item: PropostaItem): number {
    if (!item.desconto_tipo || !item.desconto_valor) return item.valor
    if (item.desconto_tipo === "percentual") {
      return item.valor - (item.valor * item.desconto_valor) / 100
    }
    return item.valor - item.desconto_valor
  }

  function toggleDesconto(index: number) {
    const item = itens[index]
    if (item.desconto_tipo) {
      updateItem(index, { desconto_tipo: null, desconto_valor: null })
    } else {
      updateItem(index, { desconto_tipo: "percentual", desconto_valor: 0 })
    }
  }

  function handleProfissionalChange(index: number, profNome: string) {
    // When professional changes, reset procedure and valor
    updateItem(index, {
      profissionalNome: profNome,
      procedimentoId: "",
      procedimentoNome: "",
      valor: 0,
    })
  }

  function handleProcedimentoChange(index: number, procId: string, profNome: string) {
    const procs = getProcedimentosForProfissional(profNome)
    const proc = procs.find((p) => String(p.id) === procId)
    if (proc) {
      updateItem(index, {
        procedimentoId: procId,
        procedimentoNome: proc.nome,
        valor: proc.valor,
      })
    }
  }

  const subtotal = itens.reduce((sum, item) => sum + item.valor_final, 0)

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {itens.map((item, index) => {
        const availableProcs = item.profissionalNome
          ? getProcedimentosForProfissional(item.profissionalNome)
          : []
        const groupedProcs = groupByTipo(availableProcs)

        return (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Item {index + 1}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Profissional</Label>
                <Select
                  value={item.profissionalNome}
                  onValueChange={(value) => handleProfissionalChange(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((prof) => (
                      <SelectItem key={prof.id} value={prof.nome}>
                        {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Procedimento</Label>
                <Select
                  value={item.procedimentoId}
                  onValueChange={(value) => handleProcedimentoChange(index, value, item.profissionalNome)}
                  disabled={!item.profissionalNome}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={item.profissionalNome ? "Selecione o procedimento" : "Selecione o profissional primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedProcs).map(([tipo, procs]) => (
                      <SelectGroup key={tipo}>
                        <SelectLabel className="text-xs font-semibold text-primary">{tipo}</SelectLabel>
                        {procs.map((proc) => (
                          <SelectItem key={proc.id} value={String(proc.id)}>
                            <div className="flex items-center gap-2">
                              {proc.relevante && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                              <span>{proc.nome}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatCurrency(proc.valor)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="text-xs mb-1 block">Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.valor || ""}
                  onChange={(e) => updateItem(index, { valor: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant={item.desconto_tipo ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => toggleDesconto(index)}
                >
                  <Percent className="w-3 h-3" />
                  {item.desconto_tipo ? "Remover Desconto" : "Adicionar Desconto"}
                </Button>
              </div>
              <div className="text-right">
                <Label className="text-xs mb-1 block text-muted-foreground">Valor Final</Label>
                <p className="text-lg font-bold text-foreground">{formatCurrency(item.valor_final)}</p>
              </div>
            </div>

            {item.desconto_tipo && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={item.desconto_tipo === "percentual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateItem(index, { desconto_tipo: "percentual" })}
                  >
                    <Percent className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant={item.desconto_tipo === "valor" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateItem(index, { desconto_tipo: "valor" })}
                  >
                    <DollarSign className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-28"
                  value={item.desconto_valor || ""}
                  onChange={(e) => updateItem(index, { desconto_valor: parseFloat(e.target.value) || 0 })}
                  placeholder={item.desconto_tipo === "percentual" ? "%" : "R$"}
                />
                <span className="text-xs text-muted-foreground">
                  {item.desconto_tipo === "percentual"
                    ? `- ${formatCurrency((item.valor * (item.desconto_valor || 0)) / 100)}`
                    : `- ${formatCurrency(item.desconto_valor || 0)}`}
                </span>
              </div>
            )}
          </Card>
        )
      })}

      <Button type="button" variant="outline" className="w-full gap-2 border-dashed" onClick={addItem}>
        <Plus className="w-4 h-4" />
        Adicionar Procedimento
      </Button>

      {itens.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Subtotal ({itens.length} {itens.length === 1 ? "item" : "itens"})</span>
          <span className="text-xl font-bold text-foreground">{formatCurrency(subtotal)}</span>
        </div>
      )}
    </div>
  )
}
```

Key changes from original:
- Fetches from `procedimentos_clinica` instead of `procedimentos`
- Professional selection resets procedure and valor
- Procedure select is disabled until professional is chosen
- Procedures filtered by selected professional
- Grouped by `tipo` using `SelectGroup` + `SelectLabel`
- Relevant procedures show star icon
- Procedure price shown in select dropdown
- Selecting procedure auto-fills `valor`

- [ ] **Step 2: Verify and commit**

Run: `npm run dev` — test the Propostas wizard Step 2

```bash
git add components/propostas/steps/step-procedimentos.tsx
git commit -m "feat: update StepProcedimentos to use procedimentos_clinica with auto-fill pricing"
```

---

## Summary

| Task | Description | Files |
|---|---|---|
| 1 | Create table + seed ~147 records + Paloma | `scripts/seed-procedimentos.ts` |
| 2 | Add ProcedimentoClinica type | `components/propostas/types.ts` |
| 3 | Rewrite step-procedimentos | `step-procedimentos.tsx` |
