import { NextRequest, NextResponse } from 'next/server'
import { createEmployee, getAllEmployees, getEmployeesByCategory, deleteEmployee } from '@/lib/models/Employee'
import { z } from 'zod'

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  email: z.string().email().optional().or(z.literal('')),
})

// GET - Get all employees grouped by category
export async function GET() {
  try {
    const employeesByCategory = await getEmployeesByCategory()
    return NextResponse.json({ employees: employeesByCategory }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = employeeSchema.parse(body)

    const employee = await createEmployee(
      validatedData.name, 
      validatedData.category,
      validatedData.email || undefined
    )

    return NextResponse.json(
      { message: 'Employee created successfully', employee },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Employee with this name already exists in this category') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create employee', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete employee
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    const deleted = await deleteEmployee(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete employee', details: error.message },
      { status: 500 }
    )
  }
}

