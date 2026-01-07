import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { isAdmin } from "@/lib/auth"
import mongoose from "mongoose"

type RouteParams = {
  params: {
    userId: string
  }
}

// Add these exports to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()

    // Get the userId from params
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // First, get the user document to ensure we have all fields including alternativeEmails
    const userDoc = await User.findById(userId)
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Get alternativeEmails from the document before converting to lean
    const alternativeEmailsFromDoc = userDoc.alternativeEmails || []
    
    // Now get the user with populated data files using lean for performance
    const user = await User.findById(userId)
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: "filename originalName data columns createdAt"
      })
      .lean()
      .exec()
    
    // Remove password from the user object for security
    if (user && (user as any).password) {
      delete (user as any).password
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for and clean up missing file references
    const hasMissingFiles = user.dataFiles && user.dataFiles.some(file => !file.fileId);
    
    if (hasMissingFiles) {
      try {
        // Get the actual user document (not lean) so we can update it
        const userDoc = await User.findById(user._id);
        if (userDoc && userDoc.dataFiles) {
          // Filter out missing file references
          userDoc.dataFiles = userDoc.dataFiles.filter(file => 
            file && file.fileId && file.fileId.toString()
          );
          await userDoc.save();
          
          // Update our local copy for the response
          user.dataFiles = user.dataFiles.filter(file => file && file.fileId);
        }
      } catch (err) {
        console.error("Error cleaning up file references:", err);
      }
    }
    
    // Calculate total records across all files
    const totalRecords = user.dataFiles ? user.dataFiles.reduce((sum, file) => {
      if (!file || !file.fileId) return sum;
      const dataFile = file.fileId as any;
      return sum + (dataFile?.data?.length || 0);
    }, 0) : 0;

    // Get the most recent file's date
    let mostRecentDate = null;
    if (user.dataFiles && user.dataFiles.length > 0) {
      // Filter out any entries with missing fileId references
      const validFiles = user.dataFiles.filter(file => file && file.fileId);
      if (validFiles.length > 0) {
        mostRecentDate = validFiles.reduce((latest, file) => {
          const fileDate = new Date(file.createdAt);
          return fileDate > latest ? fileDate : latest;
        }, new Date(0));
      }
    }

    // Format files with metadata
    const files = user.dataFiles ? user.dataFiles
      .filter(file => file) // Ensure file exists
      .map(file => {
        if (!file || !file.fileId) {
          return {
            id: 'missing',
            title: file ? file.title || 'Missing File' : 'Missing File',
            filename: 'File not found',
            originalName: 'File not found',
            recordCount: 0,
            columnCount: 0,
            createdAt: file ? file.createdAt : new Date()
          };
        }
        
        const dataFile = file.fileId as any;
        try {
          return {
            id: dataFile._id ? dataFile._id.toString() : 'missing',
            title: file.title || 'Untitled',
            filename: dataFile.filename || "Unknown",
            originalName: dataFile.originalName || "Unknown",
            recordCount: dataFile.data?.length || 0,
            columnCount: dataFile.columns?.length || 0,
            createdAt: file.createdAt
          };
        } catch (err) {
          console.error("Error formatting file data:", err);
          return {
            id: 'error',
            title: file.title || 'Error',
            filename: 'Error processing file',
            originalName: 'Error',
            recordCount: 0,
            columnCount: 0,
            createdAt: file.createdAt
          };
        }
      }) : [];

    // Sort files by creation date (newest first)
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get alternativeEmails - use the value from the document we fetched earlier
    // or try to get it from the lean object as fallback
    let alternativeEmails: string[] = alternativeEmailsFromDoc || []
    
    // Fallback: try to get from lean object if not found in document
    if (alternativeEmails.length === 0 && user && typeof user === 'object') {
      const userObj = user as any
      if (userObj.alternativeEmails) {
        if (Array.isArray(userObj.alternativeEmails)) {
          alternativeEmails = userObj.alternativeEmails
        }
      }
    }

    const formattedUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      title: user.title,
      credits: user.credits || 0,
      alternativeEmails: alternativeEmails,
      totalFiles: files.length,
      totalRecords: totalRecords,
      lastUpload: mostRecentDate,
      createdAt: user.createdAt,
      files: files
    };
    
    console.log("Formatted user alternativeEmails:", formattedUser.alternativeEmails)

    const timestamp = Date.now();
    const response = NextResponse.json(formattedUser);
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('X-Response-Time', timestamp.toString());
    
    return response;
  } catch (error) {
    console.error("Error fetching user:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Error details:", { errorMessage, errorStack })
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()

    // Get the userId from params
    const { userId } = await params

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete all associated data files
    for (const dataFile of user.dataFiles) {
      await DataFile.findByIdAndDelete(dataFile.fileId)
    }

    // Delete the user
    await User.findByIdAndDelete(userId)

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 