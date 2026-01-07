"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LayoutDashboard, ChevronRight, Users, Briefcase, Code, Palette, Calculator, Crown, TrendingUp, Database } from "lucide-react"

interface Employee {
  _id?: string
  name: string
  category: string
}

interface AdminSidebarProps {
  employeesByCategory: Record<string, Employee[]>
}

const CATEGORIES = ['CEO', 'CMO', 'Marketing', 'Data', 'IT', 'Design', 'Accountant']

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'CEO': Crown,
  'CMO': TrendingUp,
  'Marketing': Briefcase,
  'Data': Database,
  'IT': Code,
  'Design': Palette,
  'Accountant': Calculator,
}

export function AdminSidebar({ employeesByCategory }: AdminSidebarProps) {
  const pathname = usePathname()
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})

  // Determine which category should be open based on current pathname
  useEffect(() => {
    if (pathname?.startsWith('/admin/employee/')) {
      const employeeId = pathname.replace('/admin/employee/', '')
      const newOpenCategories: Record<string, boolean> = {}
      
      // Find which category contains this employee
      CATEGORIES.forEach((category) => {
        const employees = employeesByCategory[category] || []
        const hasEmployee = employees.some(emp => emp._id === employeeId)
        newOpenCategories[category] = hasEmployee
      })
      
      setOpenCategories(newOpenCategories)
    } else {
      // Close all categories when not on an employee page
      setOpenCategories({})
    }
  }, [pathname, employeesByCategory])

  return (
    <Sidebar>
      <SidebarHeader className="!p-0 border-b border-sidebar-border">
        <div className="flex items-center justify-center h-16 px-4">
          <img 
            src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses-full-logo-dark_8d412ea3-bf11-4fc6-af9c-bee7e51ef494.png" 
            alt="Nexuses Logo" 
            className="object-contain h-[29px] w-auto group-data-[collapsible=icon]:h-[24px]"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Main Navigation */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/admin"}
                  className={`rounded-lg transition-all duration-200 h-11 ${
                    pathname === "/admin"
                      ? "!bg-[#0E172B] !text-white shadow-md hover:!bg-[#0E172B] [&_svg]:!text-white"
                      : "hover:bg-[#0E172B] text-slate-700 hover:text-white [&_svg]:hover:text-white"
                  }`}
                >
                  <Link href="/admin" className="flex items-center gap-3 w-full">
                    <LayoutDashboard className="shrink-0" style={{ width: '20px', height: '20px' }} />
                    <span className="font-semibold text-base">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/admin/employees"}
                  className={`rounded-lg transition-all duration-200 h-11 ${
                    pathname === "/admin/employees"
                      ? "!bg-[#0E172B] !text-white shadow-md hover:!bg-[#0E172B] [&_svg]:!text-white"
                      : "hover:bg-[#0E172B] text-slate-700 hover:text-white [&_svg]:hover:text-white"
                  }`}
                >
                  <Link href="/admin/employees" className="flex items-center gap-3 w-full">
                    <Users className="shrink-0" style={{ width: '20px', height: '20px' }} />
                    <span className="font-semibold text-base">All Employees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Employee Categories with Nested Employees */}
              {CATEGORIES.map((category) => {
                const employees = employeesByCategory[category] || []
                if (employees.length === 0) return null

                const CategoryIcon = CATEGORY_ICONS[category] || Users
                const isOpen = openCategories[category] || false

                return (
                  <Collapsible 
                    key={category} 
                    open={isOpen}
                    onOpenChange={(open) => {
                      setOpenCategories(prev => ({ ...prev, [category]: open }))
                    }}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          className="rounded-lg transition-all duration-200 h-11 w-full justify-between hover:bg-[#0E172B] text-slate-700 hover:text-white [&_svg]:hover:text-white"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <CategoryIcon className="h-5 w-5 shrink-0" />
                            <span className="font-semibold text-base">{category}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {employees.map((employee) => {
                            const employeePath = `/admin/employee/${employee._id}`
                            const isActive = pathname === employeePath
                            
                            return (
                              <SidebarMenuSubItem key={employee._id}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive}
                                  className={`${
                                    isActive 
                                      ? "!bg-[#0E172B] !text-white" 
                                      : "hover:bg-[#0E172B] hover:text-white"
                                  }`}
                                >
                                  <Link href={employeePath} className="flex items-center gap-2">
                                    <span className="text-sm">{employee.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

