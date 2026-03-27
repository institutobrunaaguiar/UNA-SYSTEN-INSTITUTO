import type React from "react"
import type { Metadata } from "next"
import { Inter, Inter_Tight } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLoader } from "@/components/loading/app-loader"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "UNA - Sistema de Gestão de Pacientes",
  description: "Gerencie pacientes e visualize todos os dados do sistema",
  generator: "v0.app",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${interTight.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="dark" storageKey="tasko-theme">
          <AppLoader>
            {children}
          </AppLoader>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
