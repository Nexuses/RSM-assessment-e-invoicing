import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User, type IUser } from "@/lib/models/user"
import { getCurrentUser, comparePasswords, hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the user
    const user = await User.findById(session.id) as IUser | null
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await comparePasswords(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Check if new password is different from current password
    const isSamePassword = await comparePasswords(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 })
    }

    // Hash and update the password
    const hashedPassword = await hashPassword(newPassword)
    user.password = hashedPassword
    await user.save()

    return NextResponse.json({
      message: "Password changed successfully"
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

