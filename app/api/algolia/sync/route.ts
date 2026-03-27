// app/api/algolia/sync/route.ts
// POST /api/algolia/sync — re-indexes pacientes + propostas from Supabase into Algolia
import { NextResponse } from "next/server"
import { algoliasearch } from "algoliasearch"
import { createClient } from "@supabase/supabase-js"

function getAlgolia() {
  return algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.ALGOLIA_ADMIN_KEY!
  )
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function fetchAll<T>(
  supabase: ReturnType<typeof getSupabase>,
  table: string,
  columns: string
): Promise<T[]> {
  const batch = 1000
  let from = 0
  const all: T[] = []

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + batch - 1)

    if (error) throw new Error(`Supabase [${table}]: ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...(data as T[]))
    if (data.length < batch) break
    from += batch
  }

  return all
}

export async function POST() {
  try {
    const supabase = getSupabase()

    // Configure index settings
    const algolia = getAlgolia()

    await Promise.all([
      algolia.setSettings({
        indexName: "pacientes",
        indexSettings: {
          searchableAttributes: ["nome", "cpf_cnpj", "email", "telefone_celular"],
          attributesToRetrieve: ["objectID", "id", "nome", "cpf_cnpj", "email", "telefone_celular", "ativo", "data_nascimento"],
          attributesForFaceting: ["ativo"],
        },
      }),
      algolia.setSettings({
        indexName: "propostas",
        indexSettings: {
          searchableAttributes: ["nome_cliente", "cpf_cliente"],
          attributesToRetrieve: ["objectID", "id", "nome_cliente", "cpf_cliente", "valor_total", "status"],
        },
      }),
    ])

    // Fetch from Supabase
    const [pacientes, propostas] = await Promise.all([
      fetchAll<{
        id: number; nome: string; cpf_cnpj: string | null
        email: string | null; telefone_celular: string | null
        ativo: boolean; data_nascimento: string | null
      }>(supabase, "pacientes", "id, nome, cpf_cnpj, email, telefone_celular, ativo, data_nascimento"),

      fetchAll<{
        id: number; nome_cliente: string; cpf_cliente: string | null
        valor_total: number; status: string
      }>(supabase, "propostas", "id, nome_cliente, cpf_cliente, valor_total, status"),
    ])

    // Save to Algolia
    await Promise.all([
      algolia.saveObjects({
        indexName: "pacientes",
        objects: pacientes.map((p) => ({ ...p, objectID: String(p.id) })),
      }),
      algolia.saveObjects({
        indexName: "propostas",
        objects: propostas.map((p) => ({ ...p, objectID: String(p.id) })),
      }),
    ])

    return NextResponse.json({
      success: true,
      indexed: { pacientes: pacientes.length, propostas: propostas.length },
    })
  } catch (e) {
    console.error("[algolia/sync]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
