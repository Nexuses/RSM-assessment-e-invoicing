import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import QueryProvider from "@/app/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nexuses Data Portal",
  description: "Access and manage marketing data with our comprehensive data portal solution",
  icons: {
    icon: 'https://cdn-nexlink.s3.us-east-2.amazonaws.com/Group_15_b5d5ad17-292a-47a6-a4e1-636f541568ae.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#F9FAFB]`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <main className="app">
              <Suspense fallback={<div className="min-h-screen w-full bg-[#F9FAFB] text-gray-400 flex items-center justify-center">Loading...</div>}>
                {children}
              </Suspense>
            </main>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}