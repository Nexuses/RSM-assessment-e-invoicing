import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'Abdjajidjaidiadoj',
    pass: process.env.SMTP_PASS || 'BHOh3WcvE9UKhAuB0XBO5yTDFqFTXYpLaZ3h8/Nj0Thy',
  },
})

export async function sendReminderEmail(
  employeeEmail: string,
  employeeName: string,
  reminderType: 'first' | 'second' | 'final'
) {
  const subject = reminderType === 'final' 
    ? 'Action Required: Task Submission - Attendance Marking'
    : 'Reminder: Please Submit Your Daily Tasks'

  const message = reminderType === 'final'
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: bold;">Task Submission Required</h2>
        </div>
        <div style="background-color: #fef2f2; border: 2px solid #dc2626; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Dear ${employeeName},
          </p>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            This is a final reminder that your daily task submission is pending for today. 
            <strong style="color: #dc2626;">Your attendance will be marked as absent in Razorpay</strong> if you do not submit your tasks immediately.
          </p>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Please add your task immediately to avoid any attendance discrepancies.
          </p>
          <div style="background-color: white; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; font-size: 14px; font-weight: bold; margin: 0;">
              Please add your task immediately. Otherwise, your attendance will be marked as absent in Razorpay.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">
            Best regards,<br>
            Nexuses Team
          </p>
        </div>
      </div>
    `
    : reminderType === 'second'
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: bold;">Reminder: Task Submission Pending</h2>
        </div>
        <div style="background-color: #fef2f2; border: 2px solid #dc2626; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Dear ${employeeName},
          </p>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            This is a reminder that your daily task submission is still pending for today.
          </p>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Please add your task. Otherwise, your attendance will be marked as absent in Razorpay.
          </p>
          <div style="background-color: white; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; font-size: 14px; font-weight: bold; margin: 0;">
              Please add your task. Otherwise, your attendance will be marked as absent in Razorpay.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">
            Best regards,<br>
            Nexuses Team
          </p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: bold;">Reminder: Task Submission Required</h2>
        </div>
        <div style="background-color: #fef2f2; border: 2px solid #dc2626; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Dear ${employeeName},
          </p>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            This is a reminder that your daily task submission is pending for today.
          </p>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Please add your task. Otherwise, your attendance will be marked as absent in Razorpay.
          </p>
          <div style="background-color: white; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; font-size: 14px; font-weight: bold; margin: 0;">
              Please add your task. Otherwise, your attendance will be marked as absent in Razorpay.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">
            Best regards,<br>
            Nexuses Team
          </p>
        </div>
      </div>
    `

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'attendance@nexuses.xyz',
      to: employeeEmail,
      subject,
      html: message,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

