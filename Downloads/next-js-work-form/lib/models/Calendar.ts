import clientPromise from '../mongodb'
import { ObjectId } from 'mongodb'

export interface CalendarDay {
  _id?: string
  date: string // Format: YYYY-MM-DD
  status: 'holiday' | 'working'
  createdAt?: Date
  updatedAt?: Date
}

export async function getCalendarDays(year: number, month: number): Promise<CalendarDay[]> {
  const client = await clientPromise
  const db = client.db('workform')
  const calendar = db.collection('calendar')

  // Get start and end dates for the month
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`

  const results = await calendar
    .find({
      date: { $gte: startDate, $lte: endDate }
    })
    .toArray()

  return results.map((day: any) => ({
    ...day,
    _id: day._id.toString(),
  }))
}

export async function setCalendarDay(date: string, status: 'holiday' | 'working'): Promise<CalendarDay> {
  const client = await clientPromise
  const db = client.db('workform')
  const calendar = db.collection('calendar')

  // Check if day already exists
  const existing = await calendar.findOne({ date })

  if (existing) {
    // Update existing
    await calendar.updateOne(
      { date },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    )
    return { ...existing, status, updatedAt: new Date() }
  } else {
    // Create new
    const day: CalendarDay = {
      date,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await calendar.insertOne(day)
    return { ...day, _id: result.insertedId.toString() }
  }
}

export async function getCalendarDay(date: string): Promise<CalendarDay | null> {
  const client = await clientPromise
  const db = client.db('workform')
  const calendar = db.collection('calendar')

  const result = await calendar.findOne({ date })
  if (!result) return null

  return {
    ...result,
    _id: result._id.toString(),
  }
}

