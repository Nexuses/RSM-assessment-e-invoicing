"use client"

import { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
  HeaderGroup,
  Row,
  Cell,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, MoreHorizontal, Upload, Loader2, FileText, ChevronRight, Clock, X, UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddFileForm } from "./add-file-form"
import { AddCreditsDialog } from "./add-credits-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { FileDetailsDialog } from "./file-details-dialog"
import { toast } from "sonner"
import { createNoCacheOptions, addCacheBuster } from "@/lib/utils"

interface FileInfo {
  id: string
  title: string
  filename: string
  originalName: string
  recordCount: number
  columnCount: number
  createdAt: string
}

interface User {
  id: string
  email: string
  role: string
  userType?: string
  title?: string
  credits: number
  totalFiles: number
  totalRecords: number
  lastUpload: string | null
  createdAt: string
  files: FileInfo[]
}

export interface UserListRef {
  refreshUsers: () => void
}

interface UserListProps {
  onAddUser?: () => void
}

export const UserList = forwardRef<UserListRef, UserListProps>(({ onAddUser }, ref) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isAddCreditsDialogOpen, setIsAddCreditsDialogOpen] = useState(false)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [isFileDetailsDialogOpen, setIsFileDetailsDialogOpen] = useState(false)
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("")
  const [selectedUserFiles, setSelectedUserFiles] = useState<FileInfo[]>([])
  const [refreshingUsers, setRefreshingUsers] = useState<Set<string>>(new Set())
  const [sortByLastUpdate, setSortByLastUpdate] = useState(false)
  const [globalFilter, setGlobalFilter] = useState("")
  const [fileDialogMode, setFileDialogMode] = useState<"view" | "upload">("view")
  const [fileDetailsDialogInitialTab, setFileDetailsDialogInitialTab] = useState<"upload" | "files">("files")

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const usersResponse = await fetch(addCacheBuster("/api/admin/users"), createNoCacheOptions())
      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  // New function to refresh a single user's data
  const refreshSingleUser = async (userId: string) => {
    try {
      // Add this user to the refreshing set
      setRefreshingUsers(prev => new Set(prev).add(userId))
      
      const userResponse = await fetch(
        addCacheBuster(`/api/admin/users/${userId}`), 
        createNoCacheOptions()
      )
      
      if (userResponse.ok) {
        const updatedUser = await userResponse.json()
        
        // Update just this user in the users array
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? updatedUser : user
          )
        )
        
        // Update selectedUserFiles if this is the currently selected user and dialog is open
        if (isFileDetailsDialogOpen && selectedUserId === userId && updatedUser.files) {
          setSelectedUserFiles([...updatedUser.files])
        }
      } else {
        // If we can't get the specific user, fall back to refreshing all users
        console.warn("Failed to refresh single user, refreshing all users instead")
        await fetchUsers()
        
        // Update selectedUserFiles if this is the currently selected user and dialog is open
        if (isFileDetailsDialogOpen && selectedUserId === userId) {
          const updatedUserData = users.find(user => user.id === userId)
          if (updatedUserData && updatedUserData.files) {
            setSelectedUserFiles([...updatedUserData.files])
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
      toast.error("Failed to refresh user data")
    } finally {
      // Remove this user from the refreshing set
      setRefreshingUsers(prev => {
        const updated = new Set(prev)
        updated.delete(userId)
        return updated
      })
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Expose the refresh function through the ref
  useImperativeHandle(ref, () => ({
    refreshUsers: fetchUsers
  }))

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      // Update the users state immediately
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
      return true
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  const handleDeleteFile = async (userId: string, fileId: string) => {
    try {
      // Show loading toast
      toast.loading("Deleting file...")
      
      // Add this user to the refreshing set
      setRefreshingUsers(prev => new Set(prev).add(userId))
      
      // Update local state first for immediate UI feedback
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                files: user.files.filter(file => file.id !== fileId),
                totalFiles: user.totalFiles - 1
              } 
            : user
        )
      )
      
      // Also update selectedUserFiles if file details dialog is open
      if (isFileDetailsDialogOpen && selectedUserId === userId) {
        setSelectedUserFiles(prev => prev.filter(file => file.id !== fileId))
      }
      
      const deleteResponse = await fetch(
        addCacheBuster(`/api/admin/users/${userId}/file?fileId=${fileId}`),
        createNoCacheOptions('DELETE')
      )

      if (deleteResponse.ok) {
        // Dismiss loading toast and show success
        toast.dismiss()
        toast.success("File deleted successfully")
        
        // Fetch the updated user data
        const userResponse = await fetch(
          addCacheBuster(`/api/admin/users/${userId}`), 
          createNoCacheOptions()
        );
        
        if (userResponse.ok) {
          const updatedUser = await userResponse.json();
          
          // Update the user in the users list
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === userId ? updatedUser : user
            )
          );
          
          // Update the selectedUserFiles with the fresh data if dialog is open
          if (isFileDetailsDialogOpen && selectedUserId === userId && updatedUser && updatedUser.files) {
            setSelectedUserFiles([...updatedUser.files]);
          }
          
          // Remove from refreshing set
          setRefreshingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(userId);
            return updated;
          });
        } else {
          // If we can't get the specific user, fall back to refreshing all users
          await fetchUsers();
          
          // Find the updated user in the refreshed list and update selectedUserFiles if dialog is open
          if (isFileDetailsDialogOpen && selectedUserId === userId) {
            const updatedUserData = users.find(user => user.id === userId);
            if (updatedUserData && updatedUserData.files) {
              setSelectedUserFiles([...updatedUserData.files]);
            }
          }
          
          // Remove from refreshing set
          setRefreshingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(userId);
            return updated;
          });
        }
      } else {
        // If there's an error, refresh just this user to ensure correct state
        toast.dismiss()
        toast.error("Failed to delete file")
        await refreshSingleUser(userId)
        
        // Update the selectedUserFiles with the fresh data if dialog is open
        if (isFileDetailsDialogOpen && selectedUserId === userId) {
          const updatedUserData = users.find(user => user.id === userId);
          if (updatedUserData && updatedUserData.files) {
            setSelectedUserFiles([...updatedUserData.files]);
          }
        }
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      // If there's an error, refresh just this user to ensure correct state
      toast.dismiss()
      toast.error("Failed to delete file")
      await refreshSingleUser(userId)
      
      // Update the selectedUserFiles with the fresh data if dialog is open
      if (isFileDetailsDialogOpen && selectedUserId === userId) {
        const updatedUserData = users.find(user => user.id === userId);
        if (updatedUserData && updatedUserData.files) {
          setSelectedUserFiles([...updatedUserData.files]);
        }
      }
    }
  }

  const handleEditFileTitle = async (userId: string, fileId: string, newTitle: string) => {
    try {
      // Show loading toast
      toast.loading("Updating file title...")
      
      // Add this user to the refreshing set
      setRefreshingUsers(prev => new Set(prev).add(userId))
      
      const updateResponse = await fetch(
        addCacheBuster(`/api/admin/users/${userId}/file?fileId=${fileId}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({ title: newTitle })
        }
      )

      if (updateResponse.ok) {
        // Dismiss loading toast and show success
        toast.dismiss()
        toast.success("File title updated successfully")
        
        // Update local state first for immediate UI feedback
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { 
                  ...user, 
                  files: user.files.map(file => 
                    file.id === fileId 
                      ? { ...file, title: newTitle }
                      : file
                  )
                } 
              : user
          )
        )
        
        // Also update selectedUserFiles if file details dialog is open
        if (isFileDetailsDialogOpen && selectedUserId === userId) {
          setSelectedUserFiles(prev => 
            prev.map(file => 
              file.id === fileId 
                ? { ...file, title: newTitle }
                : file
            )
          )
        }
        
        // Remove from refreshing set
        setRefreshingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      } else {
        // If update fails, show error and refresh data
        toast.dismiss()
        toast.error("Failed to update file title")
        
        // Fetch the updated user data
        await refreshSingleUser(userId)
        
        // Remove from refreshing set
        setRefreshingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      }
    } catch (error) {
      console.error("Error updating file title:", error)
      toast.dismiss()
      toast.error("Failed to update file title")
      
      // Remove from refreshing set
      setRefreshingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    }
  }

  const handleAddFileClick = (userId: string) => {
    setSelectedUserId(userId)
    setSelectedUserFiles([])
    setIsFileDetailsDialogOpen(true)
    setFileDetailsDialogInitialTab("upload")
  }

  const handleAddFileSuccess = async () => {
    // Refresh the users list after adding a file
    await fetchUsers()
    
    // If the file dialog is open for a specific user, update their files
    if (selectedUserId) {
      const updatedUser = users.find(user => user.id === selectedUserId)
      if (updatedUser) {
        setSelectedUserFiles([...updatedUser.files])
      }
    }
  }

  const handleAddCredits = (userId: string) => {
    setSelectedUserId(userId)
    setIsAddCreditsDialogOpen(true)
  }

  const handleAddCreditsSuccess = (newCredits: number) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === selectedUserId 
          ? { ...user, credits: newCredits } 
          : user
      )
    )
  }

  const handleDeleteUserClick = (userId: string, email: string) => {
    setSelectedUserId(userId)
    setSelectedUserEmail(email)
    setIsDeleteUserDialogOpen(true)
  }

  const handleShowAllFiles = (userId: string, files: FileInfo[]) => {
    setSelectedUserId(userId)
    setSelectedUserFiles(files)
    setIsFileDetailsDialogOpen(true)
    setFileDetailsDialogInitialTab("files")
  }
  
  // Handler for file upload success from the file details dialog
  const handleFileUploadFromDialog = async () => {
    if (selectedUserId) {
      try {
        // Fetch the updated user data
        const userResponse = await fetch(
          addCacheBuster(`/api/admin/users/${selectedUserId}`), 
          createNoCacheOptions()
        );
        
        if (userResponse.ok) {
          const updatedUser = await userResponse.json();
          
          // Update the user in the users list
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === selectedUserId ? updatedUser : user
            )
          );
          
          // Update the selectedUserFiles with the fresh data
          if (updatedUser && updatedUser.files) {
            setSelectedUserFiles([...updatedUser.files]);
          }
        } else {
          // If there's an error, fall back to refreshing all users
          console.warn("Failed to refresh single user, refreshing all users instead");
          await fetchUsers();
          
          // Find the updated user in the refreshed list and update selectedUserFiles
          const updatedUserData = users.find(user => user.id === selectedUserId);
          if (updatedUserData && updatedUserData.files) {
            setSelectedUserFiles([...updatedUserData.files]);
          }
        }
      } catch (error) {
        console.error("Error refreshing user data after file upload:", error);
        toast.error("Failed to refresh user data");
      }
    }
  }

  // Function to sort users by last update time
  const sortUsersByLastUpdate = (usersToSort: User[]) => {
    if (!sortByLastUpdate) return usersToSort;
    
    return [...usersToSort].sort((a, b) => {
      // Convert lastUpload to dates or use createdAt as fallback
      const dateA = a.lastUpload ? new Date(a.lastUpload).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.lastUpload ? new Date(b.lastUpload).getTime() : new Date(b.createdAt).getTime();
      
      // Sort in descending order (newest first)
      return dateB - dateA;
    });
  };

  // Remove the sortUsersByLastUpdate function and replace with a memoized sorted users array
  const displayedUsers = useMemo(() => {
    if (!sortByLastUpdate) return users;
    
    return [...users].sort((a, b) => {
      // Convert lastUpload to dates or use createdAt as fallback
      const dateA = a.lastUpload ? new Date(a.lastUpload).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.lastUpload ? new Date(b.lastUpload).getTime() : new Date(b.createdAt).getTime();
      
      // Sort in descending order (newest first)
      return dateB - dateA;
    });
  }, [users, sortByLastUpdate]);

  // Function to handle global search
  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
  };

  // Filter users based on global search
  const filteredUsers = useMemo(() => {
    if (!globalFilter) return displayedUsers;
    
    const searchTerm = globalFilter.toLowerCase();
    return displayedUsers.filter(user => {
      return (
        user.email.toLowerCase().includes(searchTerm) ||
        (user.title && user.title.toLowerCase().includes(searchTerm)) ||
        (user.userType && user.userType.toLowerCase().includes(searchTerm))
      );
    });
  }, [displayedUsers, globalFilter]);

  // Email column with dropdown menu
  const emailColumn: ColumnDef<User> = {
    accessorKey: "email",
    header: ({ column }: { column: Column<User> }) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="-ml-3 h-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                <span>Email {column.getFilterValue() ? `(Filtered)` : ""}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuLabel className="text-zinc-400">Sort</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  // Disable custom sort and use table sorting
                  if (sortByLastUpdate) {
                    setSortByLastUpdate(false);
                  }
                  column.toggleSorting(false);
                }} 
                className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
              >
                <div className="flex items-center">
                  {sorting.length > 0 && sorting[0].id === "email" && !sorting[0].desc && <span>✓ </span>}
                  <span className="ml-1">Asc</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  // Disable custom sort and use table sorting
                  if (sortByLastUpdate) {
                    setSortByLastUpdate(false);
                  }
                  column.toggleSorting(true);
                }} 
                className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
              >
                <div className="flex items-center">
                  {sorting.length > 0 && sorting[0].id === "email" && sorting[0].desc && <span>✓ </span>}
                  <span className="ml-1">Desc</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    cell: ({ row }: { row: Row<User> }) => <div className="font-medium">{row.getValue("email")}</div>,
    size: 200, // Set fixed width for email column
  };

  const columns: ColumnDef<User>[] = [
    {
      id: "serialNumber",
      header: "Sl No.",
      cell: ({ row }) => {
        // Get the current page and page size
        const pageIndex = table.getState().pagination.pageIndex
        const pageSize = table.getState().pagination.pageSize
        // Calculate the serial number
        const serialNumber = pageIndex * pageSize + row.index + 1
        return <div className="text-center">{serialNumber}</div>
      },
      size: 70, // Set fixed width for serial number column
    },
    emailColumn,
    {
      accessorKey: "userType",
      header: "User Type",
      cell: ({ row }) => {
        const userType = row.getValue("userType") as string
        return userType ? (
          <Badge variant={userType === "workmate" ? "default" : "outline"} className={
            userType === "workmate" 
              ? "bg-blue-600 text-white hover:bg-blue-700" 
              : "bg-white text-black hover:bg-gray-100 border-gray-200"
          }>
            {userType === "workmate" ? "Workmate User" : "General User"}
          </Badge>
        ) : (
          <span>-</span>
        );
      },
      size: 120, // Set fixed width for user type column
    },
    {
      accessorKey: "credits",
      header: "Credits",
      size: 60,
      cell: ({ row }) => {
        const credits = row.getValue("credits") as number
        
        // Determine badge styling based on credit amount
        const getBadgeStyling = (credits: number) => {
          if (credits >= 500) {
            return "bg-green-200 text-green-800 border-green-600 hover:bg-green-200 font-bold"; // Green for 500+
          }
          if (credits >= 200) {
            return "bg-yellow-200 text-yellow-800 border-yellow-500 hover:bg-yellow-200 font-bold"; // Yellow for 200-499
          }
          if (credits >= 50) {
            return "bg-orange-200 text-orange-800 border-orange-500 hover:bg-orange-200 font-bold"; // Orange for 50-199
          }
          return "bg-red-200 text-red-800 border-red-600 hover:bg-red-200 font-bold"; // Red for under 50
        };
        
        return (
          <div className="flex items-center">
            <Badge className={`${getBadgeStyling(credits)} font-medium text-xs px-2.5 py-1 border`}>
              {credits}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "totalFiles",
      header: "File Count",
      cell: ({ row }) => {
        const count = row.getValue("totalFiles") as number
        return (
          <div className="font-medium text-center">
            {count}
          </div>
        )
      },
      size: 100, // Set fixed width for file count column
    },
    {
      accessorKey: "files",
      header: "Latest File",
      cell: ({ row }) => {
        const files = row.getValue("files") as FileInfo[]
        const userId = row.original.id
        const isRefreshing = refreshingUsers.has(userId)
        
        // If there are no files
        if (!files || files.length === 0) {
          return <div className="text-zinc-500 italic">No files</div>
        }
        
        // Sort files by creation date (newest first) and get the latest one
        const latestFile = [...files].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        // Get the display name (original name or filename)
        const displayName = latestFile.originalName || latestFile.filename;
        
        // Function to truncate filename with ellipsis in the middle if too long
        const truncateFilename = (name: string, maxLength = 25) => {
          if (name.length <= maxLength) return name;
          
          const ext = name.lastIndexOf('.') > 0 ? name.substring(name.lastIndexOf('.')) : '';
          const nameWithoutExt = name.substring(0, name.length - ext.length);
          
          const frontChars = Math.floor((maxLength - 3) / 2);
          const endChars = Math.ceil((maxLength - 3) / 2);
          
          return `${nameWithoutExt.substring(0, frontChars)}...${nameWithoutExt.substring(nameWithoutExt.length - endChars)}${ext}`;
        };
        
        const truncatedName = truncateFilename(displayName);
        
        return (
          <div className="flex flex-col gap-1 relative">
            {isRefreshing && (
              <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center z-10 rounded">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-sm font-medium truncate" title={displayName}>
                  {truncatedName}
                </div>
                <span className="text-xs text-zinc-400">
                  {latestFile.recordCount} rows
                </span>
              </div>
            </div>
            
            {files.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-1 text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 justify-start px-2"
                onClick={() => handleShowAllFiles(userId, files)}
                disabled={isRefreshing}
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                View all {files.length} files
              </Button>
            )}
          </div>
        )
      },
      size: 250, // Set fixed width for files column
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string
        return new Date(createdAt).toLocaleDateString()
      },
      size: 120, // Set fixed width for created at column
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuLabel className="text-zinc-400">Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handleAddFileClick(user.id)}
                className="text-blue-400 hover:bg-zinc-800 hover:text-blue-400 focus:bg-zinc-800 focus:text-blue-400"
              >
                Add File
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleAddCredits(user.id)}
                className="text-green-400 hover:bg-zinc-800 hover:text-green-400 focus:bg-zinc-800 focus:text-green-400"
              >
                Add Credits
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleShowAllFiles(user.id, user.files)}
                className="text-blue-400 hover:bg-zinc-800 hover:text-blue-400 focus:bg-zinc-800 focus:text-blue-400"
              >
                View All Files
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={() => handleDeleteUserClick(user.id, user.email)}
                className="text-red-400 hover:bg-zinc-800 hover:text-red-400 focus:bg-zinc-800 focus:text-red-400"
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 70, // Set fixed width for actions column
    },
  ]

  const table = useReactTable({
    data: filteredUsers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange", // Enable column resizing
    defaultColumn: {
      minSize: 50, // Min column width
      maxSize: 500, // Max column width
    },
    filterFns: {
      employeeSize: (row, columnId, value) => {
        const employeeCount = parseInt(row.getValue<string>(columnId).replace(/[^0-9]/g, '')) || 0;
        switch (value) {
          case '1-10': return employeeCount >= 1 && employeeCount <= 10;
          case '11-20': return employeeCount >= 11 && employeeCount <= 20;
          case '21-50': return employeeCount >= 21 && employeeCount <= 50;
          case '51-100': return employeeCount >= 51 && employeeCount <= 100;
          case '101-200': return employeeCount >= 101 && employeeCount <= 200;
          case '201-500': return employeeCount >= 201 && employeeCount <= 500;
          case '501-1000': return employeeCount >= 501 && employeeCount <= 1000;
          case '1001-2000': return employeeCount >= 1001 && employeeCount <= 2000;
          case '2001-5000': return employeeCount >= 2001 && employeeCount <= 5000;
          case '5001-10000': return employeeCount >= 5001 && employeeCount <= 10000;
          case '10001+': return employeeCount >= 10001;
          // Keep backward compatibility with old filter values
          case 'lt100': return employeeCount < 100;
          case '100-500': return employeeCount >= 100 && employeeCount <= 500;
          case 'gt500': return employeeCount > 500;
          default: return true;
        }
      },
      revenue: (row, columnId, value) => {
        const revenue = parseFloat(row.getValue<string>(columnId).replace(/[^0-9.-]+/g, "")) || 0;
        switch (value) {
          case 'lt1M': return revenue < 1000000;
          case '1M-50M': return revenue >= 1000000 && revenue <= 50000000;
          case 'gt50M': return revenue > 50000000;
          default: return true;
        }
      }
    },
    state: {
      sorting,
      columnFilters,
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#1C1C1C]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Safely get the row model and rows
  let rows: any[] = [];
  try {
    const rowModel = table?.getRowModel?.();
    rows = rowModel?.rows || [];
  } catch (error) {
    console.error("Error getting row model:", error);
    // Fall back to empty array if there's an error
    rows = [];
  }

  return (
    <>
      <AddCreditsDialog
        userId={selectedUserId || ""}
        isOpen={isAddCreditsDialogOpen}
        onClose={() => {
          setIsAddCreditsDialogOpen(false)
          setSelectedUserId(null)
        }}
        onSuccess={handleAddCreditsSuccess}
      />
      <DeleteUserDialog
        userId={selectedUserId || ""}
        userEmail={selectedUserEmail}
        isOpen={isDeleteUserDialogOpen}
        onClose={() => {
          setIsDeleteUserDialogOpen(false)
          setSelectedUserId(null)
          setSelectedUserEmail("")
        }}
        onSuccess={async () => {
          if (selectedUserId) {
            try {
              // Update local state first for immediate UI feedback
              setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUserId))
              // Then refresh from server to ensure consistency
              await fetchUsers()
            } catch (error) {
              console.error("Error in deletion process:", error)
              // If there's an error, refresh the table to ensure correct state
              await fetchUsers()
            }
          }
        }}
      />
      {isFileDetailsDialogOpen && selectedUserId && (
        <FileDetailsDialog
          isOpen={isFileDetailsDialogOpen}
          onClose={() => {
            setIsFileDetailsDialogOpen(false)
            setSelectedUserId(null)
            setSelectedUserFiles([])
          }}
          files={selectedUserFiles}
          userId={selectedUserId}
          onDeleteFile={handleDeleteFile}
          onEditFileTitle={handleEditFileTitle}
          onFileUploadSuccess={handleFileUploadFromDialog}
          initialTab={fileDetailsDialogInitialTab}
        />
      )}
      <div className="space-y-4">
        {/* Search bar in its own row */}
        <div className="flex items-center">
          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Search users..."
              value={globalFilter}
              onChange={handleGlobalSearch}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-2.5 top-2.5 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        
        {/* Subtle divider */}
        <div className="border-t border-zinc-800/50 my-3"></div>
        
        {/* Filter options in a separate row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Filters:</span>
            <Button
              variant={sortByLastUpdate ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSortByLastUpdate(prev => {
                  if (!prev) {
                    setSorting([]);
                  }
                  return !prev;
                });
              }}
              className={sortByLastUpdate 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200" 
                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors duration-200"
              }
            >
              <Clock className={`mr-2 h-4 w-4 ${sortByLastUpdate ? "text-white" : "text-zinc-400"}`} />
              Recently Updated
              {sortByLastUpdate && <span className="ml-1.5 text-xs bg-blue-800/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">Active</span>}
            </Button>
            
            {(globalFilter || columnFilters.length > 0 || sorting.length > 0 || sortByLastUpdate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGlobalFilter("");
                  setColumnFilters([]);
                  setSorting([]);
                  setSortByLastUpdate(false);
                }}
                className="border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-colors duration-200"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
          
          {/* Active filters indicators */}
          {(columnFilters.length > 0 || sorting.length > 0) && (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xs text-zinc-500">Active filters:</div>
              {columnFilters.map((filter, index) => (
                <Badge key={index} variant="outline" className="bg-zinc-900 text-zinc-300 border-zinc-700">
                  {filter.id}: {String(filter.value)}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setColumnFilters(prev => prev.filter((_, i) => i !== index));
                    }}
                  />
                </Badge>
              ))}
              {sorting.length > 0 && !sortByLastUpdate && (
                <Badge variant="outline" className="bg-zinc-900 text-zinc-300 border-zinc-700">
                  {sorting[0].id} {sorting[0].desc ? "↓" : "↑"}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => setSorting([])}
                  />
                </Badge>
              )}
            </div>
          )}
          
          {/* Add User Button */}
          {onAddUser && (
            <Button 
              onClick={onAddUser}
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-4 py-2 rounded-md transition-all duration-200 shadow-md flex items-center gap-2 hover:shadow-blue-500/20 ml-auto"
            >
              <UserPlus className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              Add New User
            </Button>
          )}
        </div>
        
        <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
                  {table.getHeaderGroups().map((headerGroup) => (
                    headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id} 
                          className="text-zinc-400 bg-zinc-900 h-12"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-zinc-800 hover:bg-zinc-900"
                    >
                      {row.getVisibleCells().map((cell: any) => (
                        <TableCell 
                          key={cell.id} 
                          className="text-zinc-300"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-400">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 p-4 bg-[#1C1C1C] border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  )
})

