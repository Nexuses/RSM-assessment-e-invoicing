import { NextRequest, NextResponse } from 'next/server'
import { findAdminByEmail, verifyAdminPassword } from '@/lib/models/Admin'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const admin = await findAdminByEmail(validatedData.email)
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isPasswordValid = await verifyAdminPassword(admin, validatedData.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create simple session token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ 
      id: admin._id, 
      email: admin.email,
      name: admin.name 
    })).toString('base64')

    // Don't send password back
    const { password, ...adminWithoutPassword } = admin

    const response = NextResponse.json(
      { message: 'Login successful', admin: adminWithoutPassword },
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    )
  }
}

