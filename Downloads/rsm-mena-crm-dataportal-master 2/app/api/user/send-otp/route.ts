import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User, type IUser } from "@/lib/models/user"
import { comparePasswords } from "@/lib/auth"
import { generateOTP, storeOTP, getOTPData } from "@/lib/otp"
import { sendOTPEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user
    const user = await User.findOne<IUser>({ email, role: "user" }).lean()
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if there's already a valid OTP (prevent spam)
    const existingOTP = getOTPData(email)
    if (existingOTP) {
      const timeRemaining = Math.ceil((existingOTP.expiresAt - Date.now()) / 1000 / 60)
      return NextResponse.json({ 
        error: `An OTP was already sent. Please wait ${timeRemaining} minute(s) before requesting a new one.`,
        canResend: false 
      }, { status: 429 })
    }

    // Generate and store OTP
    const otp = generateOTP()
    storeOTP(email, user._id.toString(), otp)

    // Send OTP email
    try {
      await sendOTPEmail(email, otp)
    } catch (error) {
      console.error("Error sending OTP email:", error)
      return NextResponse.json({ error: "Failed to send OTP email. Please try again later." }, { status: 500 })
    }

    return NextResponse.json({
      message: "OTP sent successfully to your email",
      email: email, // Return email for client-side use
    })
  } catch (error) {
    console.error("Error in send-otp:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

