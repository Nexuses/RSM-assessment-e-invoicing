import { NextRequest, NextResponse } from 'next/server'
import { getCalendarDays, setCalendarDay } from '@/lib/models/Calendar'

// GET - Get calendar days for a specific month
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())

    const days = await getCalendarDays(year, month)
    
    // Convert to map for easier lookup
    const daysMap: Record<string, 'holiday' | 'working'> = {}
    days.forEach(day => {
      daysMap[day.date] = day.status
    })

    return NextResponse.json({ days: daysMap }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch calendar days', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Set calendar day status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, status } = body

    if (!date || !status || !['holiday', 'working'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid date or status' },
        { status: 400 }
      )
    }

    const day = await setCalendarDay(date, status)

    return NextResponse.json(
      { message: 'Calendar day updated successfully', day },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update calendar day', details: error.message },
      { status: 500 }
    )
  }
}

