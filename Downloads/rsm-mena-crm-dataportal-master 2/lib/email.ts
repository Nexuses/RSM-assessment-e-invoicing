import nodemailer from "nodemailer"

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  })
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@rsmmena.nexuses.xyz",
      replyTo: "noreply@rsmmena.nexuses.xyz", // Set reply-to to no-reply address
      to: email,
      subject: "Your Login OTP Code",
      headers: {
        "X-Auto-Response-Suppress": "All", // Suppress auto-responses
        "Precedence": "bulk", // Mark as bulk email
        "Auto-Submitted": "auto-generated", // Mark as auto-generated
        "List-Unsubscribe": "<mailto:noreply@rsmmena.nexuses.xyz>", // Unsubscribe header
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
            <h2 style="color: #009CDE; text-align: center;">RSM MENA CRM Data Portal</h2>
            <div style="background-color: white; padding: 30px; border-radius: 8px; margin-top: 20px;">
              <h3 style="color: #333; margin-top: 0;">Your Login OTP Code</h3>
              <p>Hello,</p>
              <p>You have requested to login to your account. Please use the following One-Time Password (OTP) to complete your login:</p>
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                <h1 style="color: #009CDE; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p>This OTP is valid for <strong>10 minutes</strong> and can only be used once.</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                If you did not request this OTP, please ignore this email or contact support.
              </p>
              <p style="color: #666; font-size: 12px;">
                For security reasons, never share this OTP with anyone.
              </p>
            </div>
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
              © ${new Date().getFullYear()} RSM MENA. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        RSM MENA CRM Data Portal
        
        Your Login OTP Code
        
        Hello,
        
        You have requested to login to your account. Please use the following One-Time Password (OTP) to complete your login:
        
        ${otp}
        
        This OTP is valid for 10 minutes and can only be used once.
        
        If you did not request this OTP, please ignore this email or contact support.
        
        For security reasons, never share this OTP with anyone.
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`OTP email sent successfully to ${email}`)
  } catch (error) {
    console.error("Error sending OTP email:", error)
    throw new Error("Failed to send OTP email")
  }
}

