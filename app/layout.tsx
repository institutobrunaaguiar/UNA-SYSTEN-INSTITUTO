import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Inter_Tight } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLoader } from "@/components/loading/app-loader"
import { MobileDock } from "@/components/dashboard/mobile-dock"
import { ServiceWorkerRegister } from "@/components/pwa/sw-register"
import { UserProvider } from "@/context/user-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "UNA - Sistema de Gestão de Pacientes",
  description: "Gerencie pacientes e visualize todos os dados do sistema",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UNA System",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#536648",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${interTight.variable} font-sans antialiased safe-area-top`}>
        <ThemeProvider defaultTheme="dark" storageKey="tasko-theme">
          <UserProvider>
            <AppLoader>
              {children}
              <MobileDock />
            </AppLoader>
          </UserProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
