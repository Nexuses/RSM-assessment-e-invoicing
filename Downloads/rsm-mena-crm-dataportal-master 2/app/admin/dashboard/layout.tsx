import type React from "react"
import { AdminSidebar } from "@/components/layout/admin-sidebar"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gradient-to-b from-[#1a1f2e] to-[#2d3748]">
      <div className="w-64 h-full">
        <AdminSidebar />
      </div>
      <div className="flex-1 overflow-auto bg-gradient-to-b from-[#1a1f2e] to-[#2d3748]">{children}</div>
    </div>
  )
}

