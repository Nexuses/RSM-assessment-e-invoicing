import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User, type IUser } from "@/lib/models/user"
import { comparePasswords, createToken, setAuthCookie } from "@/lib/auth"
import { verifyOTP, removeOTP } from "@/lib/otp"

export async function POST(request: NextRequest) {
  try {
    const { email, password, otp } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user by primary email or alternative email
    const user = await User.findOne<IUser>({
      role: "user",
      $or: [
        { email: email.toLowerCase() },
        { alternativeEmails: { $in: [email.toLowerCase()] } }
      ]
    }).lean()
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // For user login (not admin), OTP is required
    if (user.role === "user") {
      if (!otp) {
        return NextResponse.json({ 
          error: "OTP is required",
          requiresOTP: true 
        }, { status: 400 })
      }

      // Verify OTP (use primary email since OTP is stored with primary email)
      const otpVerification = verifyOTP(user.email, otp)
      if (!otpVerification.valid) {
        return NextResponse.json({ 
          error: otpVerification.error || "Invalid OTP",
          requiresOTP: true 
        }, { status: 401 })
      }

      // Verify that the OTP was for this user
      if (otpVerification.userId !== user._id.toString()) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 401 })
      }

      // Remove OTP after successful verification (use primary email for OTP removal)
      removeOTP(user.email)
    }

    // Create token and complete login
    const token = await createToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      newLogin: true, // Signal that this is a new login
      userId: user._id.toString() // Include user ID for client-side cache management
    })
    
    // Set headers to indicate a new user has logged in and cache should be invalidated
    response.headers.set('X-New-Login', 'true')
    response.headers.set('X-User-Id', user._id.toString())
    response.headers.set('X-Clear-Cache', 'true')
    
    // Set cache control headers to prevent caching of this response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return setAuthCookie(response, token)
  } catch (error) {
    console.error("Error in login:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

