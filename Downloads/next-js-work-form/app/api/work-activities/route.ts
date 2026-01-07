import { NextRequest, NextResponse } from 'next/server'
import { createWorkActivity, getAllWorkActivities, getWorkActivitiesByEmployee, getWorkActivitiesByEmployeeId, deleteWorkActivity } from '@/lib/models/WorkActivity'
import { z } from 'zod'

const workActivitySchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required'),
  employeeId: z.string().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  tasks: z.array(
    z.object({
      id: z.string(),
      projectName: z.string(),
      taskName: z.string(),
      outcomeLink: z.string(),
      notes: z.string(),
    })
  ),
})

// GET - Get work activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeName = searchParams.get('employeeName')
    const employeeId = searchParams.get('employeeId')

    let activities

    if (employeeId) {
      activities = await getWorkActivitiesByEmployeeId(employeeId)
    } else if (employeeName) {
      activities = await getWorkActivitiesByEmployee(employeeName)
    } else {
      activities = await getAllWorkActivities()
    }

    return NextResponse.json({ activities }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch work activities', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update work activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = workActivitySchema.parse(body)

    const activity = await createWorkActivity(
      validatedData.employeeName,
      validatedData.employeeId || null,
      validatedData.date,
      validatedData.tasks
    )

    return NextResponse.json(
      { message: 'Work activity saved successfully', activity },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save work activity', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete work activity
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    const deleted = await deleteWorkActivity(activityId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Work activity deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete work activity', details: error.message },
      { status: 500 }
    )
  }
}

