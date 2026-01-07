"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Plus, Trash2, Calendar, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  projectName: string
  taskName: string
  outcomeLink: string
  notes: string
}

interface Employee {
  _id?: string
  name: string
  category: string
}

export default function DailyWorkActivityForm() {
  const [employeeName, setEmployeeName] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [previousTasks, setPreviousTasks] = useState<string[]>([])
  const [taskDropdownsOpen, setTaskDropdownsOpen] = useState<Record<string, boolean>>({})
  const todaysDate = new Date().toISOString().split("T")[0]
  const [tasks, setTasks] = useState<Task[]>([{ id: "1", projectName: "", taskName: "", outcomeLink: "", notes: "" }])

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      fetchPreviousTasks()
    } else {
      setPreviousTasks([])
    }
  }, [selectedEmployee])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/admin/employees")
      if (response.ok) {
        const data = await response.json()
        // Flatten employees from all categories
        const allEmployees = Object.values(data.employees || {}).flat() as Employee[]
        // Sort by name
        allEmployees.sort((a, b) => a.name.localeCompare(b.name))
        setEmployees(allEmployees)
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    }
  }

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchPreviousTasks = async () => {
    if (!selectedEmployee) return
    
    try {
      const response = await fetch(`/api/work-activities?employeeId=${selectedEmployee._id}`)
      if (response.ok) {
        const data = await response.json()
        const activities = data.activities || []
        
        // Get current month and year from todaysDate
        const currentDate = new Date(todaysDate)
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()
        
        // Extract unique task names only from current month activities
        const taskNames = new Set<string>()
        activities.forEach((activity: any) => {
          // Check if activity is from current month
          const activityDate = new Date(activity.date)
          const activityMonth = activityDate.getMonth()
          const activityYear = activityDate.getFullYear()
          
          // Only include tasks from the current month
          if (activityMonth === currentMonth && activityYear === currentYear) {
            activity.tasks?.forEach((task: any) => {
              if (task.taskName) {
                taskNames.add(task.taskName)
              }
            })
          }
        })
        
        setPreviousTasks(Array.from(taskNames).sort())
      }
    } catch (error) {
      console.error("Failed to fetch previous tasks:", error)
    }
  }

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      projectName: "",
      taskName: "",
      outcomeLink: "",
      notes: "",
    }
    setTasks([...tasks, newTask])
  }

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== id))
    }
  }

  const updateTask = (id: string, field: keyof Task, value: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployee) {
      alert("Please select an employee")
      return
    }

    try {
      const response = await fetch("/api/work-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName: selectedEmployee.name,
          employeeId: selectedEmployee._id || null,
          date: todaysDate,
          tasks: tasks,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Failed to submit work activity")
        return
      }

      alert("Work activity submitted successfully!")
      
      // Reset form
      setSelectedEmployee(null)
      setEmployeeName("")
      setTasks([{ id: "1", projectName: "", taskName: "", outcomeLink: "", notes: "" }])
    } catch (error) {
      alert("An error occurred. Please try again.")
      console.error("Submission error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <Card className="border-2 border-blue-900 shadow-xl mb-8">
          <CardHeader className="bg-white p-3 md:p-4">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-3 md:gap-4">
              <div className="text-center md:text-left w-full md:w-auto">
                <CardTitle className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 mb-1 md:mb-2">Daily Work Activity</CardTitle>
                <CardDescription className="text-slate-600 text-sm md:text-base">Track your daily tasks and achievements</CardDescription>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses-full-logo-dark_8d412ea3-bf11-4fc6-af9c-bee7e51ef494.png" 
                  alt="Nexuses Logo" 
                  className="h-auto object-contain max-h-[30px] md:max-h-[40px]"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="bg-slate-900 text-white rounded-t-lg p-6 pt-6">
            <CardTitle className="text-2xl">Activity Log</CardTitle>
            <CardDescription className="text-slate-300">Fill in your work details for today</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Employee Information Section */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employeeName" className="text-sm font-semibold text-slate-700">
                    Employee Name
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between border-slate-300 bg-white hover:bg-slate-50"
                      >
                        {selectedEmployee ? selectedEmployee.name : "Select employee..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search employee..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            {filteredEmployees.map((employee) => (
                              <CommandItem
                                key={employee._id}
                                value={employee.name}
                                onSelect={() => {
                                  setSelectedEmployee(employee)
                                  setEmployeeName(employee.name)
                                  setOpen(false)
                                  setSearchQuery("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedEmployee?._id === employee._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{employee.name}</span>
                                  <span className="text-xs text-slate-500">{employee.category}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <input
                    type="hidden"
                    value={employeeName}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Today's Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={todaysDate}
                    readOnly
                    className="border-slate-300 bg-slate-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-600 font-medium">Tasks & Projects</span>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-6">
                {tasks.map((task, index) => (
                  <Card
                    key={task.id}
                    className="border-2 border-slate-200 bg-slate-50/50 transition-all hover:border-slate-300"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Task #{index + 1}</h3>
                        {tasks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`project-${task.id}`} className="text-sm font-medium text-slate-700">
                            Project Name
                          </Label>
                          <Input
                            id={`project-${task.id}`}
                            type="text"
                            placeholder="e.g., Website Redesign"
                            value={task.projectName}
                            onChange={(e) => updateTask(task.id, "projectName", e.target.value)}
                            className="border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-900"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`task-${task.id}`} className="text-sm font-medium text-slate-700">
                            Task Name
                          </Label>
                          {selectedEmployee && previousTasks.length > 0 ? (
                            <Popover 
                              open={taskDropdownsOpen[task.id] || false}
                              onOpenChange={(open) => setTaskDropdownsOpen(prev => ({ ...prev, [task.id]: open }))}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between border-slate-300 bg-white hover:bg-slate-50 text-left font-normal"
                                >
                                  {task.taskName || "Select or type task name..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Search or type new task..."
                                    value={task.taskName}
                                    onValueChange={(value) => {
                                      updateTask(task.id, "taskName", value)
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>No task found. Type to create new.</CommandEmpty>
                                    <CommandGroup>
                                      {previousTasks
                                        .filter((taskName) =>
                                          !task.taskName || taskName.toLowerCase().includes(task.taskName.toLowerCase())
                                        )
                                        .map((taskName) => (
                                          <CommandItem
                                            key={taskName}
                                            value={taskName}
                                            onSelect={() => {
                                              updateTask(task.id, "taskName", taskName)
                                              setTaskDropdownsOpen(prev => ({ ...prev, [task.id]: false }))
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                task.taskName === taskName ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {taskName}
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <Input
                              id={`task-${task.id}`}
                              type="text"
                              placeholder="e.g., Created homepage mockup"
                              value={task.taskName}
                              onChange={(e) => updateTask(task.id, "taskName", e.target.value)}
                              className="border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-900"
                              required
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`outcome-${task.id}`} className="text-sm font-medium text-slate-700">
                            Outcome Link
                          </Label>
                          <Input
                            id={`outcome-${task.id}`}
                            type="url"
                            placeholder="https://example.com/outcome"
                            value={task.outcomeLink}
                            onChange={(e) => updateTask(task.id, "outcomeLink", e.target.value)}
                            className="border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-900"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${task.id}`} className="text-sm font-medium text-slate-700">
                            Notes
                          </Label>
                          <Textarea
                            id={`notes-${task.id}`}
                            placeholder="Add any additional notes or comments about this task..."
                            value={task.notes}
                            onChange={(e) => updateTask(task.id, "notes", e.target.value)}
                            className="border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-900 min-h-24"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  onClick={addTask}
                  variant="outline"
                  className="w-full border-2 border-dashed border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Another Task
                </Button>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 py-6 text-lg font-semibold"
                >
                  Submit Daily Activity
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
