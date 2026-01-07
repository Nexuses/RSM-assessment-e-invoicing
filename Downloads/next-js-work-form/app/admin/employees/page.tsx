"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LogOut, Plus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

const CATEGORIES = ['CEO', 'CMO', 'Marketing', 'Data', 'IT', 'Design', 'Accountant']

export default function EmployeesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeesByCategory, setEmployeesByCategory] = useState<Record<string, Employee[]>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeCategory, setNewEmployeeCategory] = useState("")
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    checkAuth()
    fetchEmployees()
  }, [])

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

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim() || !newEmployeeCategory) {
      setError("Please fill in all required fields")
      return
    }

    // Validate email if provided
    if (newEmployeeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployeeEmail)) {
      setError("Please enter a valid email address")
      return
    }

    setIsAdding(true)
    setError("")

    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newEmployeeName.trim(),
          category: newEmployeeCategory,
          email: newEmployeeEmail.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to add employee")
        setIsAdding(false)
        return
      }

      // Reset form and close dialog
      setNewEmployeeName("")
      setNewEmployeeCategory("")
      setIsDialogOpen(false)
      setError("")
      
      // Refresh employee list
      await fetchEmployees()
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleSeedEmployees = async () => {
    if (!confirm("This will add all employees with their email addresses. Continue?")) {
      return
    }

    setIsSeeding(true)
    setError("")

    try {
      const response = await fetch("/api/admin/employees/seed", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to seed employees")
        setIsSeeding(false)
        return
      }

      alert(`Successfully seeded ${data.created} employees!`)
      fetchEmployees()
    } catch (error) {
      setError("An error occurred. Please try again.")
      console.error("Seed error:", error)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/employees?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchEmployees()
      } else {
        alert("Failed to delete employee")
      }
    } catch (error) {
      alert("An error occurred while deleting the employee")
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
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
                  <p className="text-slate-600 mt-2">Manage employee records and information</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSeedEmployees}
                    disabled={isSeeding}
                    className="border-slate-300"
                  >
                    {isSeeding ? "Seeding..." : "Seed Employees"}
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-slate-900 text-white hover:bg-slate-800">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>
                        Add a new employee to the system. Select the appropriate category.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Employee Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter employee name"
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newEmployeeCategory} onValueChange={setNewEmployeeCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={newEmployeeEmail}
                          onChange={(e) => setNewEmployeeEmail(e.target.value)}
                        />
                      </div>
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                          {error}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
        setIsDialogOpen(false)
        setNewEmployeeName("")
        setNewEmployeeCategory("")
        setNewEmployeeEmail("")
        setError("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddEmployee}
                        disabled={isAdding}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                      >
                        {isAdding ? "Adding..." : "Add Employee"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              {Object.keys(employeesByCategory).length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-slate-600">
                      <p className="mb-4">No employees found.</p>
                      <p className="text-sm">Click "Add Employee" to get started, or seed the database with initial employees.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* CEO and CMO in one row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['CEO', 'CMO'].map((category) => {
                      const employees = employeesByCategory[category] || []
                      if (employees.length === 0) return null

                      return (
                        <Card key={category}>
                          <CardHeader>
                            <CardTitle className="text-xl">{category}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {employees.map((employee) => (
                                <div
                                  key={employee._id}
                                  onClick={() => router.push(`/admin/employee/${employee._id}`)}
                                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">{employee.name}</span>
                                    {employee.email && (
                                      <span className="text-xs text-slate-500 mt-1">{employee.email}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Other categories */}
                  {CATEGORIES.filter(cat => cat !== 'CEO' && cat !== 'CMO').map((category) => {
                    const employees = employeesByCategory[category] || []
                    if (employees.length === 0) return null

                    return (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle className="text-xl">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {employees.map((employee) => (
                              <div
                                key={employee._id}
                                onClick={() => router.push(`/admin/employee/${employee._id}`)}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{employee.name}</span>
                                  {employee.email && (
                                    <span className="text-xs text-slate-500 mt-1">{employee.email}</span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteEmployee(employee._id!)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

