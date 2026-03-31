// app/api/assinafy/sync/route.ts — Sincronizar status de contratos pendentes
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const BASE = process.env.ASSINAFY_BASE_URL!
const API_KEY = process.env.ASSINAFY_API_KEY!

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  const supabase = getSupabaseAdmin()

  // Buscar contratos pendentes que têm document_id
  const { data: pendentes } = await supabase
    .from("contratos")
    .select("id, assinafy_document_id")
    .eq("status", "pendente")
    .not("assinafy_document_id", "is", null)

  if (!pendentes?.length) return NextResponse.json({ synced: 0 })

  let synced = 0
  const now = new Date().toISOString()

  for (const contrato of pendentes) {
    try {
      const res = await fetch(`${BASE}/documents/${contrato.assinafy_document_id}`, {
        headers: { "X-Api-Key": API_KEY },
        cache: "no-store",
      })
      if (!res.ok) continue

      const data = await res.json()
      const docStatus = data?.data?.status ?? data?.status

      let novoStatus: string | null = null
      if (docStatus === "certificated") novoStatus = "assinado"
      else if (docStatus === "rejected_by_signer") novoStatus = "recusado"
      else if (docStatus === "rejected_by_user") novoStatus = "cancelado"
      else if (docStatus === "expired") novoStatus = "expirado"

      if (novoStatus) {
        await supabase.from("contratos").update({
          status: novoStatus,
          ...(novoStatus === "assinado" ? { signed_at: now } : {}),
          updated_at: now,
        }).eq("id", contrato.id)
        synced++
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({ synced, total: pendentes.length })
}
