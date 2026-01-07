import { NextResponse } from 'next/server'
import { createEmployee, updateEmployeeEmail } from '@/lib/models/Employee'

const employeesData = [
  // CEO
  { name: 'Neeraj Naval', category: 'CEO', email: 'neeraj@nexuses.in' },
  
  // CMO
  { name: 'Anubhav Singh', category: 'CMO', email: 'anubhav@nexuses.in' },
  
  // Marketing
  { name: 'Abhijeet Sharma', category: 'Marketing', email: 'abhijeet.s@nexuses.in' },
  { name: 'Abhishek Jain', category: 'Marketing', email: 'abhishek.j@nexuses.in' },
  { name: 'Anisha Agrawal', category: 'Marketing', email: 'anisha.a@nexuses.in' },
  { name: 'Arya Mishra', category: 'Marketing', email: 'arya.m@nexuses.in' },
  { name: 'Deepali Singh', category: 'Marketing', email: 'deepali.s@nexuses.in' },
  { name: 'Diksha Birla', category: 'Marketing', email: 'diksha.b@nexuses.in' },
  { name: 'Jayash Bajpai', category: 'Marketing', email: 'jayash.b@nexuses.in' },
  { name: 'Linzy Adhikari', category: 'Marketing', email: 'linzy.a@nexuses.in' },
  { name: 'Nishant Bhandarkar', category: 'Marketing', email: 'nishant.b@nexuses.in' },
  { name: 'Priyanshi Sharma', category: 'Marketing', email: 'priyanshi.s@nexuses.in' },
  { name: 'Sanjeev Reddy', category: 'Marketing', email: 'sanjeev.r@nexuses.in' },
  { name: 'Shivali Rao', category: 'Marketing', email: 'shivali.r@nexuses.in' },
  { name: 'Shreya Shrivastava', category: 'Marketing', email: 'shreya.s@nexuses.in' },
  { name: 'Shuchita Rana', category: 'Marketing', email: 'shuchita.r@nexuses.in' },
  { name: 'Sourav', category: 'Marketing', email: 'sourav.s@nexuses.in' },
  
  // Data
  { name: 'Mohammad Aslam', category: 'Data', email: 'm.aslam@nexuses.in' },
  { name: 'Kumari Seema', category: 'Data', email: 'K.Seema@nexuses.in' },
  { name: 'Rajat Sahu', category: 'Data', email: 'rajat.s@nexuses.in' },
  { name: 'Faisal Pasha', category: 'Data', email: 'faisal.p@nexuses.in' },
  
  // IT
  { name: 'Arpit Mishra', category: 'IT', email: 'arpit.m@nexuses.in' },
  { name: 'Ekansh Kandulna', category: 'IT', email: 'ekansh.k@nexuses.in' },
  { name: 'Shubham Mahawar', category: 'IT', email: 'shubham.m@nexuses.in' },
  { name: 'Ayan Khan', category: 'IT', email: 'ayan.k@nexuses.in' },
  { name: 'Ujjwal Tiwari', category: 'IT', email: 'ujjwal.t@nexuses.in' },
  
  // Design
  { name: 'Ashvani Prakash', category: 'Design', email: 'ashvani@nexuses.in' },
  { name: 'Sharon Fernandez', category: 'Design', email: 'sharon.f@nexuses.in' },
  { name: 'Arjun Kumar', category: 'Design', email: 'arjun.k@nexuses.in' },
  { name: 'Harsha Chauhan', category: 'Design', email: 'harsha.c@nexuses.in' },
  { name: 'Indhu Peethala', category: 'Design', email: 'peethala.i@nexuses.in' },
  { name: 'Naman Bhatnagar', category: 'Design', email: 'naman.b@nexuses.in' },
  { name: 'Rasika (Anvi)', category: 'Design', email: 'rasika.d@nexuses.in' },
  { name: 'Rasika Ratnaparkhi', category: 'Design', email: 'rasika.r@nexuses.in' },
  { name: 'Sahil Khan', category: 'Design', email: 'sahil.k@nexuses.in' },
  { name: 'Soumya Pawar', category: 'Design', email: 'soumya.p@nexuses.in' },
  { name: 'Tushar Dichwalkar', category: 'Design', email: 'tushar.rd@nexuses.in' },
  
  // Accountant
  { name: 'Mohammad Saquib', category: 'Accountant', email: 'm.saquib@nexuses.in' },
]

export async function POST() {
  try {
    const results = []
    const updated = []
    const errors = []

    for (const employee of employeesData) {
      try {
        // Try to create new employee
        const created = await createEmployee(employee.name, employee.category, employee.email)
        results.push(created)
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          // If employee exists, update email if provided
          if (employee.email) {
            try {
              const updatedEmployee = await updateEmployeeEmail(
                employee.name,
                employee.category,
                employee.email
              )
              if (updatedEmployee) {
                updated.push(updatedEmployee)
              }
            } catch (updateError: any) {
              errors.push({ employee, error: updateError.message })
            }
          }
        } else {
          errors.push({ employee, error: error.message })
        }
      }
    }

    return NextResponse.json(
      {
        message: `Seeded ${results.length} new employees and updated ${updated.length} existing employees with emails`,
        created: results.length,
        updated: updated.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to seed employees', details: error.message },
      { status: 500 }
    )
  }
}

