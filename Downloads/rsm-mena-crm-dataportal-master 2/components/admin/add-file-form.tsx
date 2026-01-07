"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { addCacheBuster } from "@/lib/utils"

interface AddFileFormProps {
  userId: string
  onSuccess?: () => void
}

export function AddFileForm({ userId, onSuccess }: AddFileFormProps) {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [toastId, setToastId] = useState<string | number | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      return "Invalid file type. Please upload a CSV or Excel file.";
    }
    
    // Check file size (max 30MB)
    const maxSize = 30 * 1024 * 1024; // 30MB in bytes
    if (file.size > maxSize) {
      return `File size exceeds the limit of 30MB. Your file is ${formatFileSize(file.size)}.`;
    }
    
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        e.target.value = ''; // Reset the input
      } else {
        setError('');
        setFile(selectedFile);
      }
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    setProgress(0)

    if (!file) {
      setError("Please upload a data file")
      setLoading(false)
      setProgress(null)
      return
    }

    // Validate file again before submission
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      setProgress(null)
      return;
    }

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title || file.name)

      // Show progress for all files, not just large ones
      setProgress(10)
      
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev === null) return 10;
          // Slow down progress as it gets higher to avoid false completion
          if (prev < 50) return prev + 5;
          if (prev < 80) return prev + 2;
          if (prev < 90) return prev + 0.5;
          return prev;
        });
      }, 1000);

      // Make sure to clear the interval
      setTimeout(() => {
        clearInterval(progressInterval);
      }, 120000); // 2 minute safety timeout
      
      // Use a more robust fetch with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for larger files
      
      console.log(`Uploading file: ${file.name}, size: ${formatFileSize(file.size)}`);
      
      // Show toast notification for upload start with loading indicator
      const id = toast.loading(`Uploading ${file.name}...`);
      setToastId(id);
      
      const response = await fetch(addCacheBuster(`/api/admin/users/${userId}/file`), {
        method: "POST",
        body: formData,
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache-Buster': Date.now().toString()
        }
      });
      
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      setProgress(100);
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();

      // Check if data was truncated
      if (data.truncated) {
        setSuccess(`File uploaded successfully but was truncated to ${data.rowCount} rows due to size limits. Some data may have been omitted.`)
        // Update the toast instead of dismissing and creating a new one
        if (toastId) {
          toast.success(`File truncated to ${data.rowCount} rows due to size limits`, { id: toastId });
        } else {
          toast.warning(`File truncated to ${data.rowCount} rows due to size limits`);
        }
      } else {
        setSuccess(`File uploaded successfully with ${data.rowCount} records`)
        // Update the toast instead of dismissing and creating a new one
        if (toastId) {
          toast.success(`File uploaded with ${data.rowCount} records`, { id: toastId });
        } else {
          toast.success(`File uploaded with ${data.rowCount} records`);
        }
      }
      
      // Reset form
      setTitle("")
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Ensure onSuccess callback is called after successful upload
      if (onSuccess) {
        // Small delay to allow the success message to be visible
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err) {
      console.error("File upload error:", err);
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes("JSON")) {
          setError("Error processing file: The file format appears to be invalid. Please ensure it's a properly formatted CSV or Excel file.");
          if (toastId) {
            toast.error("Invalid file format", { id: toastId });
          } else {
            toast.error("Invalid file format");
          }
        } else if (err.message.includes("aborted")) {
          setError("Upload timed out. The file may be too large or the server is busy. Please try again or use a smaller file.");
          if (toastId) {
            toast.error("Upload timed out", { id: toastId });
          } else {
            toast.error("Upload timed out");
          }
        } else if (err.message.includes("NetworkError") || err.message.includes("Failed to fetch")) {
          setError("Network error occurred. This might be due to the file size being too large for your connection. Try a smaller file or a better connection.");
          if (toastId) {
            toast.error("Network error", { id: toastId });
          } else {
            toast.error("Network error");
          }
        } else {
          setError(err.message || "Failed to upload file");
          if (toastId) {
            toast.error(err.message || "Failed to upload file", { id: toastId });
          } else {
            toast.error(err.message || "Failed to upload file");
          }
        }
      } else {
        setError("An unknown error occurred during upload");
        if (toastId) {
          toast.error("Upload failed", { id: toastId });
        } else {
          toast.error("Upload failed");
        }
      }
    } finally {
      setLoading(false)
      setToastId(null)
      setTimeout(() => setProgress(null), 2000) // Clear progress after a delay
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-zinc-200">File Title (Optional)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for the file"
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file" className="text-zinc-200">Upload Data (CSV/Excel)</Label>
        <Input
          id="file"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          required
          className="bg-zinc-800 border-zinc-700 text-white file:bg-zinc-700 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 hover:file:bg-zinc-600 flex items-center"
          disabled={loading}
        />
        <p className="text-sm text-zinc-400">Upload a CSV or Excel file with the data to be displayed (max 30MB)</p>
        {file && file.size > 5 * 1024 * 1024 && (
          <p className="text-sm text-amber-400 mt-1">
            Large file detected ({formatFileSize(file.size)}). Upload may take longer and very large files might be truncated.
          </p>
        )}
      </div>
      
      {file && (
        <div className="mt-4 p-3 bg-zinc-800 rounded-md border border-zinc-700">
          <div className="flex items-start gap-3">
            <FileText className="h-8 w-8 text-blue-400 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-white break-all">{file.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                <span>Type: {file.type || file.name.split('.').pop()?.toUpperCase() || 'Unknown'}</span>
                <span>Size: {formatFileSize(file.size)}</span>
                <span>Last modified: {new Date(file.lastModified).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {progress !== null && (
        <div className="w-full bg-zinc-700 rounded-full h-2.5 mb-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-xs text-zinc-400 mt-1 text-right">{progress}% uploaded</p>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress !== null ? "Uploading..." : "Processing..."}
          </>
        ) : (
          "Upload File"
        )}
      </Button>
    </form>
  )
} 