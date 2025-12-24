"use client"

import { UserList, UserListRef } from "@/components/admin/user-list"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus } from "lucide-react"
import { CreateUserForm } from "@/components/admin/create-user-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useRef } from "react"

export default function ManageUsersPage() {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const userListRef = useRef<UserListRef>(null)

  const handleUserCreated = () => {
    // Refresh the user list
    userListRef.current?.refreshUsers()
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Manage Users
        </h1>
        <p className="text-zinc-400 mt-2">
          View and manage all users in the system
        </p>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <UserList 
            ref={userListRef} 
            onAddUser={() => setIsCreateUserModalOpen(true)}
          />
        </CardContent>
      </Card>

      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-white [&>button]:text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New User</DialogTitle>
          </DialogHeader>
          <CreateUserForm 
            onSuccess={() => {
              setIsCreateUserModalOpen(false);
              // Refresh the user list after successful user creation
              handleUserCreated();
            }} 
            onUserCreated={handleUserCreated}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

