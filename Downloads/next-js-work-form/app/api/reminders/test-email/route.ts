import { NextRequest, NextResponse } from 'next/server'
import { sendReminderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeEmail, employeeName, reminderType = 'first' } = body

    if (!employeeEmail || !employeeName) {
      return NextResponse.json(
        { error: 'Employee email and name are required' },
        { status: 400 }
      )
    }

    const result = await sendReminderEmail(
      employeeEmail,
      employeeName,
      reminderType as 'first' | 'second' | 'final'
    )

    if (result.success) {
      return NextResponse.json({
        message: 'Test email sent successfully',
        employeeEmail,
        employeeName,
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    )
  }
}

