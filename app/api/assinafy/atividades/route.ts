// app/api/assinafy/atividades/route.ts
import { NextRequest, NextResponse } from "next/server"

const BASE = process.env.ASSINAFY_BASE_URL!
const API_KEY = process.env.ASSINAFY_API_KEY!

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get("document_id")
  if (!documentId) return NextResponse.json({ error: "document_id obrigatório" }, { status: 400 })

  const res = await fetch(`${BASE}/documents/${documentId}/activities`, {
    headers: { "X-Api-Key": API_KEY },
    cache: "no-store",
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data?.message || "Erro ao buscar atividades" }, { status: res.status })

  const activities = data?.data ?? data ?? []
  return NextResponse.json({ activities })
}
