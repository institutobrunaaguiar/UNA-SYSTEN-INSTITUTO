// middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes and API routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update request cookies for downstream server components
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          // Create fresh response with updated request
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          // Set cookies on response so browser stores them
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates token server-side and auto-refreshes expired tokens
  // getSession() only reads from cookies without validation — unreliable
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|apple-icon|sw.js|.*\\.png|.*\\.svg|.*\\.ico|.*\\.webmanifest).*)",
  ],
}
