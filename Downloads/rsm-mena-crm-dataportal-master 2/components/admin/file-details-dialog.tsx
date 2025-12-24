"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Calendar, Database, Columns, AlertCircle, Upload, Loader2, Pencil, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddFileForm } from "./add-file-form"
import { Input } from "@/components/ui/input"

interface FileInfo {
  id: string
  title: string
  filename: string
  originalName: string
  recordCount: number
  columnCount: number
  createdAt: string
}

interface FileDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  files: FileInfo[]
  userId: string
  onDeleteFile: (userId: string, fileId: string) => Promise<void>
  onEditFileTitle?: (userId: string, fileId: string, newTitle: string) => Promise<void>
  onFileUploadSuccess?: () => Promise<void>
  initialTab?: "files" | "upload"
}

export function FileDetailsDialog({
  isOpen,
  onClose,
  files,
  userId,
  onDeleteFile,
  onEditFileTitle,
  onFileUploadSuccess,
  initialTab = "files"
}: FileDetailsDialogProps) {
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isRefreshingFiles, setIsRefreshingFiles] = useState(false)
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>("")

  // Reset the active tab whenever the dialog opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      console.log(`FileDetailsDialog: Setting activeTab to ${initialTab}`)
      setActiveTab(initialTab)
    }
  }, [initialTab, isOpen])

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileId(fileId)
    try {
      await onDeleteFile(userId, fileId)
    } finally {
      setDeletingFileId(null)
    }
  }

  const confirmDeleteFile = (file: FileInfo) => {
    setFileToDelete(file)
    setIsDeleteAlertOpen(true)
  }

  const handleFileUploadSuccess = async () => {
    // Show loading state
    setIsRefreshingFiles(true)
    
    // Switch back to files tab after successful upload
    setActiveTab("files")
    
    try {
      // Call the parent's refresh function
      if (onFileUploadSuccess) {
        await onFileUploadSuccess()
      }
    } finally {
      // Hide loading state after a short delay to ensure animation is visible
      setTimeout(() => {
        setIsRefreshingFiles(false)
      }, 500)
    }
  }

  const handleEditFile = (file: FileInfo) => {
    setEditingFileId(file.id)
    setEditingTitle(file.title || file.originalName || file.filename)
  }

  const handleSaveTitle = async (fileId: string) => {
    if (onEditFileTitle && editingTitle.trim()) {
      await onEditFileTitle(userId, fileId, editingTitle.trim())
      setEditingFileId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingFileId(null)
    setEditingTitle("")
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateString
    }
  }

  // Sort files by createdAt date (newest first)
  const sortedFiles = [...files].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => !open && onClose()}
        key={`file-dialog-${initialTab}-${isOpen}`}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[650px] [&>button]:text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {activeTab === "files" ? `File Details (${files.length} files)` : "Upload New File"}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="mt-2"
            // Add key to force re-render when initialTab changes
            key={`tabs-${initialTab}-${isOpen}`}
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList className="bg-zinc-800 border border-zinc-700">
                <TabsTrigger 
                  value="files" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Files
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Upload New File
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="files" className="mt-0 relative">
              {isRefreshingFiles && (
                <div className="absolute inset-0 bg-zinc-900/50 flex flex-col items-center justify-center z-10 rounded-md">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-blue-400">Refreshing files...</p>
                </div>
              )}
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {sortedFiles.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      <p>No files available</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 bg-zinc-800 border-zinc-700 text-blue-400 hover:bg-zinc-700 hover:text-blue-300"
                        onClick={() => setActiveTab("upload")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload a file
                      </Button>
                    </div>
                  ) : (
                    sortedFiles.map((file) => (
                      <div 
                        key={file.id} 
                        className="p-4 bg-zinc-800 rounded-md border border-zinc-700 relative"
                      >
                        {deletingFileId === file.id && (
                          <div className="absolute inset-0 bg-zinc-900/70 flex items-center justify-center z-10 rounded-md">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <FileText className="h-10 w-10 text-blue-400 mt-1 flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              {editingFileId === file.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <Input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="bg-zinc-700 border-zinc-600 text-white"
                                    autoFocus
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0 text-green-400 hover:bg-green-950 hover:text-green-300 flex-shrink-0"
                                    onClick={() => handleSaveTitle(file.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 flex-shrink-0"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <h3 className="font-medium text-lg text-white break-all pr-2">
                                  {file.title || file.originalName || file.filename}
                                </h3>
                              )}
                              
                              <div className="flex items-center gap-1">
                                {editingFileId !== file.id && onEditFileTitle && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-950 hover:text-blue-300 flex-shrink-0"
                                    onClick={() => handleEditFile(file)}
                                    disabled={deletingFileId !== null || isRefreshingFiles}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-red-400 hover:bg-red-950 hover:text-red-300 flex-shrink-0"
                                  onClick={() => confirmDeleteFile(file)}
                                  disabled={deletingFileId !== null || isRefreshingFiles || editingFileId === file.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="mt-2 space-y-2">
                              <div className="flex flex-wrap gap-2 text-sm text-white">
                                <Badge variant="outline" className="flex items-center gap-1 bg-zinc-800 border-zinc-700 text-white">
                                  <Database className="h-3 w-3" />
                                  <span>{file.recordCount} records</span>
                                </Badge>
                                
                                <Badge variant="outline" className="flex items-center gap-1 bg-zinc-800 border-zinc-700 text-white">
                                  <Columns className="h-3 w-3" />
                                  <span>{file.columnCount} columns</span>
                                </Badge>
                                
                                <Badge variant="outline" className="flex items-center gap-1 bg-zinc-800 border-zinc-700 text-white">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(file.createdAt)}</span>
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-white">
                                <span className="font-medium text-white">Filename: </span>
                                <span className="break-all">{file.originalName || file.filename}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="upload" className="mt-0">
              <div className="bg-zinc-800 border border-zinc-700 rounded-md p-4">
                <AddFileForm 
                  userId={userId} 
                  onSuccess={handleFileUploadSuccess}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              disabled={isRefreshingFiles}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Are you sure you want to delete the file{" "}
              <span className="font-medium text-white">
                "{fileToDelete?.title || fileToDelete?.originalName || fileToDelete?.filename}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (fileToDelete) {
                  handleDeleteFile(fileToDelete.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 