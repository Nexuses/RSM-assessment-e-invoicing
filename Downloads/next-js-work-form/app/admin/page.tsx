"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LogOut, Calendar, Users, CheckCircle2, Clock, FileText, TrendingUp, Activity, BarChart3 } from "lucide-react"

interface Admin {
  _id?: string
  email: string
  name: string
}

interface Employee {
  _id?: string
  name: string
  category: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [employeesByCategory, setEmployeesByCategory] = useState<Record<string, Employee[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [calendarDays, setCalendarDays] = useState<Record<string, 'holiday' | 'working'>>({})
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    submittedToday: 0,
    pendingToday: 0,
    tasksToday: 0,
    tasksThisWeek: 0,
    tasksThisMonth: 0,
    submissionRate: 0,
    recentActivities: [] as any[],
    categoryDistribution: {} as Record<string, number>
  })

  // Auto-update to current month when month changes
  useEffect(() => {
    const checkCurrentMonth = () => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const displayedMonth = currentDate.getMonth()
      const displayedYear = currentDate.getFullYear()

      // If we're viewing a different month than the current month, update to current month
      if (currentMonth !== displayedMonth || currentYear !== displayedYear) {
        setCurrentDate(new Date())
      }
    }

    // Check on mount and set interval to check periodically
    checkCurrentMonth()
    const interval = setInterval(checkCurrentMonth, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [currentDate])

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchStats()
  }, [])

  // Refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchCalendarDays()
  }, [currentDate])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/admin/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployeesByCategory(data.employees || {})
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch all employees
      const employeesResponse = await fetch("/api/admin/employees")
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : { employees: {} }
      
      // Calculate total employees
      const allEmployees: Employee[] = Object.values(employeesData.employees || {}).flat() as Employee[]
      const totalEmployees = allEmployees.length

      // Fetch all work activities
      const activitiesResponse = await fetch("/api/work-activities")
      const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : { activities: [] }
      const allActivities = activitiesData.activities || []

      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's activities
      const todayActivities = allActivities.filter((act: any) => act.date === today)
      const submittedToday = new Set(todayActivities.map((act: any) => act.employeeName?.toLowerCase())).size
      const pendingToday = totalEmployees - submittedToday
      
      // Count tasks
      const tasksToday = todayActivities.reduce((sum: number, act: any) => sum + (act.tasks?.length || 0), 0)
      
      // Get this week's activities (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeekActivities = allActivities.filter((act: any) => {
        const actDate = new Date(act.date)
        return actDate >= weekAgo
      })
      const tasksThisWeek = thisWeekActivities.reduce((sum: number, act: any) => sum + (act.tasks?.length || 0), 0)
      
      // Get this month's activities
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const thisMonthActivities = allActivities.filter((act: any) => {
        const actDate = new Date(act.date)
        return actDate >= monthStart
      })
      const tasksThisMonth = thisMonthActivities.reduce((sum: number, act: any) => sum + (act.tasks?.length || 0), 0)
      
      // Calculate submission rate
      const submissionRate = totalEmployees > 0 ? Math.round((submittedToday / totalEmployees) * 100) : 0
      
      // Get recent activities (last 5)
      const recentActivities = allActivities
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((act: any) => ({
          employeeName: act.employeeName,
          date: act.date,
          taskCount: act.tasks?.length || 0
        }))
      
      // Category distribution
      const categoryDistribution: Record<string, number> = {}
      allEmployees.forEach((emp: Employee) => {
        categoryDistribution[emp.category] = (categoryDistribution[emp.category] || 0) + 1
      })

      setStats({
        totalEmployees,
        submittedToday,
        pendingToday,
        tasksToday,
        tasksThisWeek,
        tasksThisMonth,
        submissionRate,
        recentActivities,
        categoryDistribution
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchCalendarDays = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const response = await fetch(`/api/admin/calendar?year=${year}&month=${month}`)
      if (response.ok) {
        const data = await response.json()
        setCalendarDays(data.days || {})
      }
    } catch (error) {
      console.error("Failed to fetch calendar days:", error)
    }
  }

  const handleSetDayStatus = async (date: string, status: 'holiday' | 'working') => {
    try {
      const response = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date, status }),
      })

      if (response.ok) {
        fetchCalendarDays()
      }
    } catch (error) {
      console.error("Failed to update calendar day:", error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayDate = new Date(year, month, day)
      const dayOfWeek = dayDate.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
      
      days.push({
        day,
        date: dateStr,
        isWeekend,
        status: calendarDays[dateStr] || (isWeekend ? 'holiday' : 'working'),
      })
    }

    return days
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1))
  }

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/me")
      if (!response.ok) {
        router.push("/admin/login")
        return
      }
      const data = await response.json()
      setAdmin(data.admin)
    } catch (error) {
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar employeesByCategory={employeesByCategory} />

        <main className="flex-1 flex flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
            <SidebarTrigger />
            <div className="flex-1 pt-2" />
            {admin && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">{admin.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </header>

          <div className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-slate-600 mt-2">Welcome back, {admin?.name}</p>
                </div>
                <Button
                  onClick={() => setIsCalendarOpen(true)}
                  className="bg-[#0E172B] text-white hover:bg-[#0E172B]/90"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-slate-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                    <p className="text-xs text-slate-500 mt-1">Active employees</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Submitted Today</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.submittedToday}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.totalEmployees > 0 ? `${stats.submissionRate}% submission rate` : 'No employees'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Today</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.pendingToday}</div>
                    <p className="text-xs text-slate-500 mt-1">Awaiting submission</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.tasksToday}</div>
                    <p className="text-xs text-slate-500 mt-1">Total tasks submitted</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Weekly Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Tasks This Week</span>
                        <span className="text-lg font-bold text-slate-900">{stats.tasksThisWeek}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Tasks This Month</span>
                        <span className="text-lg font-bold text-slate-900">{stats.tasksThisMonth}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Category Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{category}</span>
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {stats.recentActivities.length > 0 ? (
                        stats.recentActivities.map((activity, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 truncate flex-1">{activity.employeeName}</span>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="text-xs text-slate-500">
                                {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {activity.taskCount} tasks
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>Manage employee records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/admin/employees")}
                    >
                      View Employees
                    </Button>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className="blur-sm pointer-events-none">
                    <CardHeader>
                      <CardTitle>Reports</CardTitle>
                      <CardDescription>Generate and view reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" disabled>
                        View Reports
                      </Button>
                    </CardContent>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-slate-700 mb-2">Coming Soon</h3>
                      <p className="text-sm text-slate-500">This feature is under development</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Calendar Dialog */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              Calendar - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </DialogTitle>
            <DialogDescription>
              Mark dates as Holiday or Working. Weekends are automatically holidays.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  ← Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  Next →
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentDate).map((dayData, index) => {
                if (dayData === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const { day, date, isWeekend, status } = dayData
                const isToday = date === new Date().toISOString().split('T')[0]

                return (
                  <div
                    key={date}
                    className={`aspect-square border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isToday
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-400'
                    } ${
                      status === 'holiday'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    } ${isWeekend ? 'cursor-not-allowed opacity-75' : ''}`}
                    onClick={() => {
                      // Weekends are always holiday and cannot be changed
                      if (isWeekend) {
                        return
                      }
                      // Toggle between holiday and working for weekdays
                      const newStatus = status === 'holiday' ? 'working' : 'holiday'
                      handleSetDayStatus(date, newStatus)
                    }}
                    title={isWeekend ? 'Weekends are automatically holidays' : `Click to toggle: ${status === 'holiday' ? 'Working' : 'Holiday'}`}
                  >
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs mt-1 ${
                        status === 'holiday'
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : 'bg-green-100 text-green-700 border-green-300'
                      }`}
                    >
                      {status === 'holiday' ? 'Holiday' : 'Working'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

