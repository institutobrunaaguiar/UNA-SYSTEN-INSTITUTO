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
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const event = body?.event ?? body?.type
  const documentId = body?.data?.document?.id ?? body?.document_id ?? body?.id

  if (!documentId) return NextResponse.json({ ok: true })

  const supabase = getSupabaseAdmin()

  if (event === "document_ready" || event === "signer_signed_document") {
    await supabase
      .from("contratos")
      .update({ status: "assinado", signed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("assinafy_document_id", documentId)
  }

  if (event === "signer_rejected_document" || event === "user_rejected_document") {
    await supabase
      .from("contratos")
      .update({ status: "recusado", updated_at: new Date().toISOString() })
      .eq("assinafy_document_id", documentId)
  }

  return NextResponse.json({ ok: true })
}
