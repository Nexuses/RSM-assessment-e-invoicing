import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RSM E-invoicing Assessment Tool",
  description:
    "RSM E-invoicing Assessment Tool helps organizations evaluate their e-invoicing readiness. The tool provides actionable insights to strengthen e-invoicing practices, allowing organizations to assess their current e-invoicing posture and identify areas for improvement.",
  openGraph: {
    images: [
      {
        url: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm_592baa45-bdc5-429c-91d1-61f6c8ee8753.webp",
        width: 1920,
        height: 540,
        alt: "RSM E-invoicing Assessment Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm_592baa45-bdc5-429c-91d1-61f6c8ee8753.webp",
    ],
  },
  icons: {
    icon: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/Faviconn_2d471e30-d53d-4c59-bc9e-4ae17baa0a92.png", // or '/favicon.png'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
      <GoogleAnalytics gaId="G-1NXS62CTQ7" />
    </html>
  );
}
