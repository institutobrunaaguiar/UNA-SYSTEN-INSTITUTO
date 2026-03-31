// app/api/assinafy/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const raw = await request.text()
  let body: Record<string, unknown>
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ ok: true }) }

  // Log para debug (visível nos logs da Vercel)
  console.log("[assinafy-webhook] payload:", JSON.stringify(body))

  // Tentar múltiplos caminhos para extrair event e documentId
  const event = (body?.event ?? body?.type ?? body?.action ?? "") as string
  const documentId =
    (body?.data as Record<string, unknown>)?.document_id ??
    ((body?.data as Record<string, unknown>)?.document as Record<string, unknown>)?.id ??
    body?.document_id ??
    body?.id ??
    ""

  if (!event || !documentId) {
    console.log("[assinafy-webhook] campos ausentes:", { event, documentId, keys: Object.keys(body) })
    return NextResponse.json({ ok: true })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  // Eventos de assinatura concluída
  if (event === "document_ready" || event === "signer_signed_document") {
    const { error } = await supabase
      .from("contratos")
      .update({ status: "assinado", signed_at: now, updated_at: now })
      .eq("assinafy_document_id", documentId)
    console.log("[assinafy-webhook] assinado:", { documentId, error: error?.message })
  }

  // Eventos de recusa
  if (event === "signer_rejected_document" || event === "user_rejected_document") {
    const { error } = await supabase
      .from("contratos")
      .update({ status: "recusado", updated_at: now })
      .eq("assinafy_document_id", documentId)
    console.log("[assinafy-webhook] recusado:", { documentId, error: error?.message })
  }

  return NextResponse.json({ ok: true })
}
