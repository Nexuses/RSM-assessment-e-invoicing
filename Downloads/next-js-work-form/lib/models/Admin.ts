import clientPromise from '../mongodb'

export interface Admin {
  _id?: string
  email: string
  password: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}

export async function createAdmin(email: string, password: string, name: string): Promise<Admin> {
  const client = await clientPromise
  const db = client.db('workform')
  const admins = db.collection<Admin>('admins')

  // Check if admin already exists
  const existingAdmin = await admins.findOne({ email })
  if (existingAdmin) {
    throw new Error('Admin with this email already exists')
  }

  // Hash password
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash(password, 10)

  const admin: Admin = {
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await admins.insertOne(admin)
  return { ...admin, _id: result.insertedId.toString() }
}

export async function findAdminByEmail(email: string): Promise<Admin | null> {
  const client = await clientPromise
  const db = client.db('workform')
  const admins = db.collection<Admin>('admins')

  return await admins.findOne({ email })
}

export async function verifyAdminPassword(admin: Admin, password: string): Promise<boolean> {
  const bcrypt = require('bcryptjs')
  return await bcrypt.compare(password, admin.password)
}

