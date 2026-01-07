import { NextResponse } from 'next/server'
import { sendReminders } from '@/lib/reminders'

export async function GET(request: Request) {
  // Verify cron secret if needed
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendReminders('first')
    return NextResponse.json({
      message: '7 PM reminders sent',
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send reminders', details: error.message },
      { status: 500 }
    )
  }
}

