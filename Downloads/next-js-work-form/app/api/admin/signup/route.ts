import { NextRequest, NextResponse } from 'next/server'
import { createAdmin } from '@/lib/models/Admin'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    const admin = await createAdmin(
      validatedData.email,
      validatedData.password,
      validatedData.name
    )

    // Don't send password back
    const { password, ...adminWithoutPassword } = admin

    return NextResponse.json(
      { message: 'Admin created successfully', admin: adminWithoutPassword },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Admin with this email already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create admin', details: error.message },
      { status: 500 }
    )
  }
}

