const SLACK_WEBHOOK_EMAIL = process.env.SLACK_WEBHOOK_EMAIL || 'attendance-aaaasu7xaacfbshy7emt74hzzy@nexuses.slack.com'

export async function sendSlackReminder(
  employeeName: string,
  employeeEmail: string,
  reminderType: 'first' | 'second' | 'final'
) {
  try {
    // Format message to tag user by name (Slack email integration will convert @username to mention)
    const message = reminderType === 'final'
      ? `@${employeeName} Please add your task immediately. Otherwise, your attendance will be marked as absent in Razorpay.`
      : `@${employeeName} Please add your task. Otherwise, your attendance will be marked as absent in Razorpay.`

    // Send via email to Slack channel (Slack email integration)
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'Abdjajidjaidiadoj',
        pass: process.env.SMTP_PASS || 'BHOh3WcvE9UKhAuB0XBO5yTDFqFTXYpLaZ3h8/Nj0Thy',
      },
    })

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'attendance@nexuses.xyz',
      to: SLACK_WEBHOOK_EMAIL,
      subject: `Task Reminder: ${employeeName}`,
      text: message,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Slack send error:', error)
    return { success: false, error: error.message }
  }
}

