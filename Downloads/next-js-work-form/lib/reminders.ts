import { getAllEmployees } from './models/Employee'
import { getAllWorkActivities } from './models/WorkActivity'
import { getCalendarDay } from './models/Calendar'
import { sendReminderEmail } from './email'
import { sendSlackReminder } from './slack'

export async function getEmployeesWithoutTasks(date: string) {
  // Check if it's a working day
  const calendarDay = await getCalendarDay(date)
  const dayOfWeek = new Date(date).getDay()
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
  
  // If explicitly marked as holiday, don't send reminders
  if (calendarDay?.status === 'holiday') {
    return []
  }
  
  // If it's a weekend and not explicitly marked as working, don't send reminders
  if (isWeekendDay && calendarDay?.status !== 'working') {
    return []
  }

  // Get all employees
  const employees = await getAllEmployees()

  // Get all work activities for the date
  const activities = await getAllWorkActivities()
  const todayActivities = activities.filter(activity => activity.date === date)
  const employeesWithTasks = new Set(
    todayActivities.map(activity => activity.employeeName.toLowerCase())
  )

  // Filter employees without tasks who have email
  const employeesWithoutTasks = employees.filter(
    employee => 
      employee.email && 
      !employeesWithTasks.has(employee.name.toLowerCase())
  )

  return employeesWithoutTasks
}

function isWeekend(date: string): boolean {
  const d = new Date(date)
  const day = d.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

export async function sendReminders(reminderType: 'first' | 'second' | 'final') {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const employeesWithoutTasks = await getEmployeesWithoutTasks(today)

  const results = []

  for (const employee of employeesWithoutTasks) {
    if (!employee.email) continue

    // Send email
    const emailResult = await sendReminderEmail(
      employee.email,
      employee.name,
      reminderType
    )

    // Send Slack message via email
    const slackResult = await sendSlackReminder(
      employee.name,
      employee.email,
      reminderType
    )

    results.push({
      employee: employee.name,
      email: emailResult.success,
      slack: slackResult.success,
      errors: {
        email: emailResult.error,
        slack: slackResult.error,
      },
    })
  }

  return {
    total: employeesWithoutTasks.length,
    results,
  }
}

