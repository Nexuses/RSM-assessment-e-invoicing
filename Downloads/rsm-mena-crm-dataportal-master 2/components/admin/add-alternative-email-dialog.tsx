"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { X, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createNoCacheOptions, addCacheBuster } from "@/lib/utils"

interface AddAlternativeEmailDialogProps {
  userId: string
  userEmail: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddAlternativeEmailDialog({ 
  userId, 
  userEmail, 
  isOpen, 
  onClose, 
  onSuccess 
}: AddAlternativeEmailDialogProps) {
  const [alternativeEmail, setAlternativeEmail] = useState("")
  const [existingEmails, setExistingEmails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [loadingEmails, setLoadingEmails] = useState(true)

  const fetchExistingEmails = useCallback(async () => {
    if (!userId) return
    
    try {
      setLoadingEmails(true)
      const response = await fetch(
        addCacheBuster(`/api/admin/users/${userId}`), 
        createNoCacheOptions()
      )
      if (response.ok) {
        const user = await response.json()
        
        // Ensure we have an array
        const emails = Array.isArray(user.alternativeEmails) 
          ? user.alternativeEmails 
          : (user.alternativeEmails ? [user.alternativeEmails] : [])
        
        setExistingEmails(emails)
      }
    } catch (error) {
      toast.error("Failed to load alternative emails")
    } finally {
      setLoadingEmails(false)
    }
  }, [userId])

  // Fetch existing alternative emails when dialog opens
  useEffect(() => {
    if (isOpen && userId) {
      // Set loading state and fetch (don't clear existing emails until we have new data)
      setLoadingEmails(true)
      fetchExistingEmails()
    } else if (!isOpen) {
      // Reset state when dialog closes
      setAlternativeEmail("")
      setExistingEmails([])
    }
  }, [isOpen, userId, fetchExistingEmails])

  const handleSubmit = async () => {
    if (!alternativeEmail || !alternativeEmail.trim()) {
      toast.error("Please enter an alternative email")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(alternativeEmail.trim())) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/alternative-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alternativeEmail: alternativeEmail.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add alternative email')
      }

      // Show success toast
      toast.success("Alternative email added successfully!")
      
      // Clear input
      setAlternativeEmail("")
      
      // Update the existing emails list directly from the response
      if (data.alternativeEmails) {
        const emails = Array.isArray(data.alternativeEmails) 
          ? data.alternativeEmails 
          : [data.alternativeEmails]
        setExistingEmails(emails)
      } else {
        // Fallback: refresh from server after a short delay
        setTimeout(async () => {
          await fetchExistingEmails()
        }, 300)
      }
      
      // Update parent component (non-blocking)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add alternative email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as an alternative email?`)) {
      return
    }

    setIsRemoving(email)
    try {
      const response = await fetch(`/api/admin/users/${userId}/alternative-email?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove alternative email')
      }

      // Refresh existing emails
      await fetchExistingEmails()
      toast.success("Alternative email removed successfully")
      // Update parent component (non-blocking)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove alternative email. Please try again.")
    } finally {
      setIsRemoving(null)
    }
  }

  const handleClose = () => {
    setAlternativeEmail("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-white [&>button]:text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Alternative Email</DialogTitle>
        </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="primary-email" className="text-zinc-400">
                  Primary Email
                </Label>
                <Input
                  id="primary-email"
                  value={userEmail}
                  disabled
                  className="bg-zinc-800 text-zinc-300 border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternative-email" className="text-zinc-400">
                  Alternative Email
                </Label>
                <Input
                  id="alternative-email"
                  type="email"
                  value={alternativeEmail}
                  onChange={(e) => setAlternativeEmail(e.target.value)}
                  className="bg-zinc-800 text-white border-zinc-700"
                  placeholder="Enter alternative email address"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit()
                    }
                  }}
                />
                <p className="text-xs text-zinc-500">
                  Users can login with this email using the same password
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-400">
                    Alternative Emails {existingEmails.length > 0 && `(${existingEmails.length})`}
                  </Label>
                  {loadingEmails && (
                    <span className="text-xs text-zinc-500">Loading...</span>
                  )}
                </div>
                {loadingEmails ? (
                  <div className="text-center py-4 text-zinc-400 text-sm">Loading alternative emails...</div>
                ) : existingEmails.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-zinc-800 rounded-md border border-zinc-700 min-h-[60px]">
                    {existingEmails.map((email) => (
                      <Badge
                        key={email}
                        variant="outline"
                        className="bg-zinc-900 text-zinc-300 border-zinc-600 flex items-center gap-2 pr-1 py-1.5"
                      >
                        <span className="text-sm">{email}</span>
                        <button
                          onClick={() => handleRemove(email)}
                          disabled={isRemoving === email}
                          className="hover:bg-zinc-700 rounded-full p-0.5 transition-colors ml-1"
                          title="Remove alternative email"
                        >
                          {isRemoving === email ? (
                            <X className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-red-400" />
                          )}
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-800 rounded-md border border-zinc-700 border-dashed text-center">
                    <p className="text-sm text-zinc-500 italic">
                      No alternative emails added yet
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Add an alternative email above to allow login with a different email address
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={async () => {
                  await fetchExistingEmails()
                }}
                disabled={loadingEmails}
                className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs"
              >
                {loadingEmails ? "Refreshing..." : "Refresh"}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Close
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading || !alternativeEmail.trim()}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isLoading ? "Adding..." : "Add Alternative Email"}
                </Button>
              </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

