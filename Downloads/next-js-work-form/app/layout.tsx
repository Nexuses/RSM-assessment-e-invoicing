import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Daily Work Activity Tracker | Nexuses",
  description: "Track your daily work activities and achievements. Manage employee tasks, monitor productivity, and streamline work reporting with Nexuses daily work activity tracker.",
  keywords: ["work tracker", "daily activities", "task management", "employee productivity", "work reporting", "Nexuses"],
  authors: [{ name: "Nexuses" }],
  creator: "Nexuses",
  publisher: "Nexuses",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://workform.nexuses.xyz"),
  openGraph: {
    title: "Daily Work Activity Tracker | Nexuses",
    description: "Track your daily work activities and achievements. Manage employee tasks, monitor productivity, and streamline work reporting.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://workform.nexuses.xyz",
    siteName: "Nexuses Work Tracker",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses-full-logo-dark_8d412ea3-bf11-4fc6-af9c-bee7e51ef494.png",
        width: 1200,
        height: 630,
        alt: "Nexuses Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Work Activity Tracker | Nexuses",
    description: "Track your daily work activities and achievements. Manage employee tasks, monitor productivity, and streamline work reporting.",
    images: [
      {
        url: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses-full-logo-dark_8d412ea3-bf11-4fc6-af9c-bee7e51ef494.png",
        alt: "Nexuses Logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/Group_15_b5d5ad17-292a-47a6-a4e1-636f541568ae.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/Group_15_b5d5ad17-292a-47a6-a4e1-636f541568ae.png",
        type: "image/png",
      },
    ],
    shortcut: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/Group_15_b5d5ad17-292a-47a6-a4e1-636f541568ae.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
