import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { isAdmin } from "@/lib/auth"

type RouteParams = {
  params: {
    userId: string
  }
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { alternativeEmail } = await request.json()

    if (!alternativeEmail || typeof alternativeEmail !== 'string') {
      return NextResponse.json({ error: "Alternative email is required" }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(alternativeEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    await connectToDatabase()

    const { userId } = await params

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if alternative email is already the primary email
    if (user.email.toLowerCase() === alternativeEmail.toLowerCase()) {
      return NextResponse.json({ error: "Alternative email cannot be the same as primary email" }, { status: 400 })
    }

    // Check if alternative email already exists for this user
    if (user.alternativeEmails && user.alternativeEmails.some(
      (email: string) => email.toLowerCase() === alternativeEmail.toLowerCase()
    )) {
      return NextResponse.json({ error: "Alternative email already exists for this user" }, { status: 400 })
    }

    // Check if alternative email is already used by another user (as primary or alternative)
    const existingUser = await User.findOne({
      $or: [
        { email: alternativeEmail.toLowerCase() },
        { alternativeEmails: { $in: [alternativeEmail.toLowerCase()] } }
      ]
    })

    if (existingUser) {
      return NextResponse.json({ error: "This email is already in use by another user" }, { status: 400 })
    }

    // Add alternative email
    if (!user.alternativeEmails) {
      user.alternativeEmails = []
    }
    user.alternativeEmails.push(alternativeEmail.toLowerCase())
    await user.save()
    
    // Verify the save by fetching the user again
    const savedUser = await User.findById(userId)

    return NextResponse.json({ 
      message: "Alternative email added successfully",
      alternativeEmails: savedUser?.alternativeEmails || user.alternativeEmails
    })
  } catch (error) {
    console.error("Error adding alternative email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const emailToRemove = searchParams.get('email')

    if (!emailToRemove) {
      return NextResponse.json({ error: "Email to remove is required" }, { status: 400 })
    }

    await connectToDatabase()

    const { userId } = await params

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove alternative email
    if (user.alternativeEmails) {
      user.alternativeEmails = user.alternativeEmails.filter(
        (email: string) => email.toLowerCase() !== emailToRemove.toLowerCase()
      )
      await user.save()
    }

    return NextResponse.json({ 
      message: "Alternative email removed successfully",
      alternativeEmails: user.alternativeEmails || []
    })
  } catch (error) {
    console.error("Error removing alternative email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

