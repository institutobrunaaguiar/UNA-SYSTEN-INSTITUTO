// app/api/assinafy/reenviar/route.ts
import { NextRequest, NextResponse } from "next/server"

const BASE = process.env.ASSINAFY_BASE_URL!
const API_KEY = process.env.ASSINAFY_API_KEY!

export async function POST(request: NextRequest) {
  const { document_id, assignment_id, signer_id } = await request.json()

  if (!document_id || !assignment_id || !signer_id) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  const res = await fetch(
    `${BASE}/documents/${document_id}/assignments/${assignment_id}/signers/${signer_id}/resend`,
    {
      method: "PUT",
      headers: { "X-Api-Key": API_KEY, "Content-Type": "application/json" },
    }
  )

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || "Erro ao reenviar notificação." },
      { status: res.status }
    )
  }

  return NextResponse.json({ ok: true })
}
