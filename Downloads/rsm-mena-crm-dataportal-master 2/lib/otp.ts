// In-memory OTP storage
// In production, consider using Redis or a database for better scalability
interface OTPData {
  otp: string
  email: string
  userId: string
  expiresAt: number
  attempts: number
}

const otpStore = new Map<string, OTPData>()

// OTP expiration time: 10 minutes
const OTP_EXPIRY_TIME = 10 * 60 * 1000
// Max attempts: 5
const MAX_ATTEMPTS = 5

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP for a user
 */
export function storeOTP(email: string, userId: string, otp: string): void {
  const expiresAt = Date.now() + OTP_EXPIRY_TIME
  
  otpStore.set(email, {
    otp,
    email,
    userId,
    expiresAt,
    attempts: 0,
  })
  
  // Clean up expired OTPs periodically
  cleanupExpiredOTPs()
}

/**
 * Verify OTP
 */
export function verifyOTP(email: string, otp: string): { valid: boolean; userId?: string; error?: string } {
  const otpData = otpStore.get(email)
  
  if (!otpData) {
    return { valid: false, error: "OTP not found. Please request a new OTP." }
  }
  
  // Check if OTP has expired
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(email)
    return { valid: false, error: "OTP has expired. Please request a new OTP." }
  }
  
  // Check if max attempts exceeded
  if (otpData.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email)
    return { valid: false, error: "Maximum attempts exceeded. Please request a new OTP." }
  }
  
  // Increment attempts
  otpData.attempts++
  
  // Verify OTP
  if (otpData.otp !== otp) {
    if (otpData.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email)
      return { valid: false, error: "Maximum attempts exceeded. Please request a new OTP." }
    }
    return { valid: false, error: `Invalid OTP. ${MAX_ATTEMPTS - otpData.attempts + 1} attempts remaining.` }
  }
  
  // OTP is valid, remove it from store
  otpStore.delete(email)
  
  return { valid: true, userId: otpData.userId }
}

/**
 * Get OTP data (for checking if OTP exists)
 */
export function getOTPData(email: string): OTPData | null {
  const otpData = otpStore.get(email)
  
  if (!otpData) {
    return null
  }
  
  // Check if expired
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(email)
    return null
  }
  
  return otpData
}

/**
 * Remove OTP (for cleanup or after successful verification)
 */
export function removeOTP(email: string): void {
  otpStore.delete(email)
}

/**
 * Clean up expired OTPs
 */
function cleanupExpiredOTPs(): void {
  const now = Date.now()
  for (const [email, otpData] of otpStore.entries()) {
    if (now > otpData.expiresAt) {
      otpStore.delete(email)
    }
  }
}

// Clean up expired OTPs every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredOTPs, 5 * 60 * 1000)
}

