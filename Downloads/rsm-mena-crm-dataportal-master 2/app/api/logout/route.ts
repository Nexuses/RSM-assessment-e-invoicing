import { type NextRequest, NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ 
    message: "Logged out successfully",
    clearCache: true // Signal to clear cache on client
  })
  
  // Set headers to ensure cache is cleared
  response.headers.set('X-Clear-Cache', 'true')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return clearAuthCookie(response)
}

