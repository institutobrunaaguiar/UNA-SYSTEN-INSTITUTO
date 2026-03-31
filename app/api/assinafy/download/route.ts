// app/api/assinafy/download/route.ts
import { NextRequest, NextResponse } from "next/server"

const BASE = process.env.ASSINAFY_BASE_URL!
const API_KEY = process.env.ASSINAFY_API_KEY!

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get("document_id")
  const artifact = request.nextUrl.searchParams.get("artifact") ?? "certificated"

  if (!documentId) return NextResponse.json({ error: "document_id obrigatório" }, { status: 400 })

  const allowed = ["original", "certificated", "certificate-page", "bundle"]
  if (!allowed.includes(artifact)) {
    return NextResponse.json({ error: "Tipo de download inválido." }, { status: 400 })
  }

  const res = await fetch(`${BASE}/documents/${documentId}/download/${artifact}`, {
    headers: { "X-Api-Key": API_KEY },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    return NextResponse.json({ error: body || "Erro ao baixar documento." }, { status: res.status })
  }

  const blob = await res.arrayBuffer()
  const contentType = res.headers.get("content-type") ?? "application/pdf"
  const disposition = res.headers.get("content-disposition") ?? `attachment; filename="${artifact}-${documentId}.pdf"`

  return new NextResponse(blob, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
    },
  })
}
