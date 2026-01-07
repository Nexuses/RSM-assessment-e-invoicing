import { NextRequest, NextResponse } from 'next/server'
import { findAdminByEmail } from '@/lib/models/Admin'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Decode simple session token (in production, use proper JWT verification)
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    const admin = await findAdminByEmail(payload.email as string)

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Don't send password back
    const { password, ...adminWithoutPassword } = admin

    return NextResponse.json(
      { admin: adminWithoutPassword },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid token', details: error.message },
      { status: 401 }
    )
  }
}

