import clientPromise from '../mongodb'
import { ObjectId } from 'mongodb'

export interface Employee {
  _id?: string
  name: string
  category: string
  email?: string
  createdAt?: Date
  updatedAt?: Date
}

export async function createEmployee(name: string, category: string, email?: string): Promise<Employee> {
  const client = await clientPromise
  const db = client.db('workform')
  const employees = db.collection<Employee>('employees')

  // Check if employee already exists
  const existingEmployee = await employees.findOne({ name, category })
  if (existingEmployee) {
    throw new Error('Employee with this name already exists in this category')
  }

  const employee: Employee = {
    name,
    category,
    email: email || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await employees.insertOne(employee)
  return { ...employee, _id: result.insertedId.toString() }
}

export async function updateEmployeeEmail(name: string, category: string, email: string): Promise<Employee | null> {
  const client = await clientPromise
  const db = client.db('workform')
  const employees = db.collection<Employee>('employees')

  const result = await employees.findOneAndUpdate(
    { name, category },
    {
      $set: {
        email,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  if (!result) {
    return null
  }

  return {
    ...result,
    _id: result._id.toString(),
  }
}

export async function getAllEmployees(): Promise<Employee[]> {
  const client = await clientPromise
  const db = client.db('workform')
  const employees = db.collection('employees')

  const results = await employees.find({}).sort({ category: 1, name: 1 }).toArray()
  return results.map((emp: any) => ({
    ...emp,
    _id: emp._id.toString(),
  }))
}

export async function getEmployeesByCategory(): Promise<Record<string, Employee[]>> {
  const employees = await getAllEmployees()
  const grouped: Record<string, Employee[]> = {}

  // Define category order with CEO first, then CMO
  const categoryOrder = ['CEO', 'CMO', 'Marketing', 'Data', 'IT', 'Design', 'Accountant']

  employees.forEach((employee) => {
    if (!grouped[employee.category]) {
      grouped[employee.category] = []
    }
    grouped[employee.category].push(employee)
  })

  // Sort categories according to defined order
  const sorted: Record<string, Employee[]> = {}
  categoryOrder.forEach((category) => {
    if (grouped[category]) {
      sorted[category] = grouped[category]
    }
  })

  // Add any remaining categories not in the order
  Object.keys(grouped).forEach((category) => {
    if (!sorted[category]) {
      sorted[category] = grouped[category]
    }
  })

  return sorted
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const client = await clientPromise
  const db = client.db('workform')
  const employees = db.collection<Employee>('employees')

  try {
    const result = await employees.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  } catch (error) {
    return false
  }
}

