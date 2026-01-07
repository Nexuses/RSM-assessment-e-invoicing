import { NextRequest, NextResponse } from 'next/server'
import { sendSlackReminder } from '@/lib/slack'

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

    const result = await sendSlackReminder(
      employeeName,
      employeeEmail,
      reminderType as 'first' | 'second' | 'final'
    )

    if (result.success) {
      return NextResponse.json({
        message: 'Test Slack message sent successfully',
        employeeEmail,
        employeeName,
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send Slack message', 
          details: result.error,
          help: 'Make sure SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN is configured in your environment variables'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send test Slack message', details: error.message },
      { status: 500 }
    )
  }
}

