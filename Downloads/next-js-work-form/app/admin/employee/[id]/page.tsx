"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LogOut, ExternalLink, Calendar, Trash2, Mail, MessageSquare } from "lucide-react"

interface Admin {
  _id?: string
  email: string
  name: string
}

interface Employee {
  _id?: string
  name: string
  category: string
  email?: string
}

interface Task {
  id: string
  projectName: string
  taskName: string
  outcomeLink: string
  notes: string
  oldTaskName?: string
  isUpdated?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface WorkActivity {
  _id?: string
  employeeName: string
  employeeId?: string
  date: string
  tasks: Task[]
  createdAt?: Date
  updatedAt?: Date
}

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employeesByCategory, setEmployeesByCategory] = useState<Record<string, Employee[]>>({})
  const [workActivities, setWorkActivities] = useState<WorkActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [linkPreviewError, setLinkPreviewError] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchEmployee()
    fetchWorkActivities()
  }, [employeeId])

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

  const fetchEmployee = async () => {
    try {
      const response = await fetch("/api/admin/employees")
      if (response.ok) {
        const data = await response.json()
        const allEmployees = Object.values(data.employees || {}).flat() as Employee[]
        const found = allEmployees.find((emp) => emp._id === employeeId)
        setEmployee(found || null)
      }
    } catch (error) {
      console.error("Failed to fetch employee:", error)
    }
  }

  const fetchWorkActivities = async () => {
    try {
      const response = await fetch(`/api/work-activities?employeeId=${employeeId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkActivities(data.activities || [])
      }
    } catch (error) {
      console.error("Failed to fetch work activities:", error)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this work activity? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/work-activities?id=${activityId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || "Failed to delete work activity")
        return
      }

      // Refresh the activities list
      fetchWorkActivities()
    } catch (error) {
      alert("An error occurred. Please try again.")
      console.error("Delete error:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setLinkPreviewError(false)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedTask(null)
    setLinkPreviewError(false)
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

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Employee not found</div>
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
              <div className="mb-6">
                <div className="flex items-start justify-between w-full">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{employee.name}</h1>
                    <p className="text-slate-600 mt-2">
                      {employee.category} • Employee Dashboard
                      {employee.email && (
                        <span className="block text-sm mt-1 text-slate-500">{employee.email}</span>
                      )}
                    </p>
                  </div>
                  {employee.email && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/reminders/test-email', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                employeeEmail: employee.email,
                                employeeName: employee.name,
                                reminderType: 'first',
                              }),
                            })
                            const data = await response.json()
                            if (response.ok) {
                              alert('Test email sent successfully!')
                            } else {
                              alert(`Failed to send email: ${data.error || 'Unknown error'}`)
                            }
                          } catch (error) {
                            alert('Error sending test email')
                            console.error(error)
                          }
                        }}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Test Email
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/reminders/test-slack', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                employeeEmail: employee.email,
                                employeeName: employee.name,
                                reminderType: 'first',
                              }),
                            })
                            const data = await response.json()
                            if (response.ok) {
                              alert('Test Slack message sent successfully!')
                            } else {
                              alert(`Failed to send Slack message: ${data.error || 'Unknown error'}`)
                            }
                          } catch (error: any) {
                            alert(`Error sending test Slack message: ${error.message || 'Unknown error'}`)
                            console.error(error)
                          }
                        }}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Test Slack
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Activities by Date */}
              <div className="space-y-6">
                {workActivities.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-slate-600">
                        <p>No work activities found for this employee.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  workActivities.map((activity) => (
                    <Card key={activity._id} className="border-2 border-slate-200 overflow-hidden">
                      <CardHeader className="bg-[#0E172B] border-b p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-white" />
                            <CardTitle className="text-xl text-white">{formatDate(activity.date)}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {activity.updatedAt && activity.createdAt && 
                             activity.updatedAt.toString() !== activity.createdAt.toString() && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Updated
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteActivity(activity._id!)}
                              className="text-white hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="w-[200px]">Project Name</TableHead>
                              <TableHead>Task Name</TableHead>
                              <TableHead className="w-[200px]">Outcome Link</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activity.tasks.map((task, index) => (
                              <TableRow 
                                key={task.id || index}
                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => handleTaskClick(task)}
                              >
                                <TableCell className="font-medium">{task.projectName}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span>{task.taskName}</span>
                                    {task.isUpdated && (
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                        Re-updated
                                      </Badge>
                                    )}
                                    {task.oldTaskName && (
                                      <span className="text-xs text-slate-500 italic">
                                        (was: {task.oldTaskName})
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {task.outcomeLink ? (
                                    <a
                                      href={task.outcomeLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span className="truncate max-w-[150px]">{task.outcomeLink}</span>
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                  <p className="text-sm text-slate-600 line-clamp-2">{task.notes || "-"}</p>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Task Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Task Details</DialogTitle>
            <DialogDescription>View complete task information</DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6 mt-4">
              {/* Task Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Project Name</Label>
                  <p className="text-base text-slate-900 bg-slate-50 p-3 rounded-md">{selectedTask.projectName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Task Name</Label>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <p className="text-base text-slate-900">{selectedTask.taskName}</p>
                      {selectedTask.isUpdated && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                          Re-updated
                        </Badge>
                      )}
                    </div>
                    {selectedTask.oldTaskName && (
                      <p className="text-xs text-slate-500 italic mt-1">
                        Previous: {selectedTask.oldTaskName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Outcome Link */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Outcome Link</Label>
                {selectedTask.outcomeLink ? (
                  <div className="space-y-3">
                    <a
                      href={selectedTask.outcomeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span className="truncate">{selectedTask.outcomeLink}</span>
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                    
                    {/* Link Preview */}
                    <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                      {linkPreviewError ? (
                        <div className="bg-slate-50 p-8 text-center">
                          <p className="text-slate-500">No preview available</p>
                          <p className="text-xs text-slate-400 mt-2">Click the link above to view the content</p>
                        </div>
                      ) : (
                        <iframe
                          src={selectedTask.outcomeLink}
                          className="w-full h-[400px] border-0"
                          onError={() => setLinkPreviewError(true)}
                          onLoad={(e) => {
                            // Check if iframe loaded successfully
                            try {
                              const iframe = e.target as HTMLIFrameElement
                              // If we can't access content, it might be blocked
                              if (!iframe.contentWindow) {
                                setLinkPreviewError(true)
                              }
                            } catch (err) {
                              setLinkPreviewError(true)
                            }
                          }}
                          title="Link Preview"
                          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 bg-slate-50 p-3 rounded-md">No link provided</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Notes</Label>
                <p className="text-base text-slate-900 bg-slate-50 p-3 rounded-md min-h-[100px] whitespace-pre-wrap">
                  {selectedTask.notes || "No notes provided"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

