import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { hashPassword, isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import type { IDataFile } from "@/lib/models/dataFile"
import mongoose from "mongoose"
import ExcelJS from 'exceljs'

interface PopulatedUserDataFile {
  fileId: IDataFile & { _id: mongoose.Types.ObjectId }
  title: string
  createdAt: Date
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId
  email: string
  role: string
  title?: string
  logoUrl?: string
  createdAt: Date
  updatedAt: Date
  dataFiles: PopulatedUserDataFile[]
}

// All supported columns - all are optional to support both old and new data formats
const ALL_SUPPORTED_COLUMNS = [
  'S_No',
  'Account_name',
  'Industry_client',
  'Industry_Nexuses',
  'Type_of_Company',
  'priority',
  'Sales_Manager',
  'No_of_Employees',
  'Revenue',
  'Contact_Name',
  'Designation',
  'Contact_Number_Personal',
  'Phone_Status',
  'Email_id',
  'Email_Status',
  'Person_Linkedin_Url',
  'Website',
  'Company_Linkedin_Url',
  'Technologies',
  'City',
  'State',
  'Country_Contact_Person',
  'Company_Address',
  'Company_Headquarter',
  'Workmates_Remark',
  'TM_Remarks'
]

// Define the required columns for each user type
const WORKMATE_COLUMNS = [
  's_no',
  'account_name',
  'industry_client',
  'industry_nexuses',
  'type_of_company',
  'priority',
  'sales_manager',
  'no_of_employees',
  'revenue',
  'contact_name',
  'designation',
  'contact_number_personal',
  'phone_status',
  'email_id',
  'email_status',
  'person_linkedin_url',
  'website',
  'company_linkedin_url',
  'technologies',
  'city',
  'state',
  'country_contact_person',
  'company_address',
  'company_headquarter',
  'workmates_remark',
  'tm_remarks'
]

const GENERAL_COLUMNS = [
  'first_name',
  'last_name',
  'title',
  'company_name',
  'email',
  'email_status',
  'seniority',
  'departments',
  'personal_phone',
  'company_phone',
  'employees',
  'industry',
  'person_linkedin_url',
  'contact_country',
  'website',
  'technologies',
  'company_address',
  'company_linkedin_url',
  'company_country',
  'annual_revenue'
]

// Add these exports to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()

    // Get all users with their data files, excluding admin users, sorted by creation date (newest first)
    const users = await User.find({ role: { $ne: "admin" } })
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: "filename originalName data columns createdAt"
      })
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 }) // Sort by creation date in descending order (newest first)
      .lean()
      .exec()

    // Clean up missing file references and format the response
    const timestamp = Date.now();
    const formattedUsers = await Promise.all(users.map(async user => {
      try {
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
            // Continue with the user data we have
          }
        }
        
        // Calculate total records across all files
        const totalRecords = user.dataFiles ? user.dataFiles.reduce((sum, file) => {
          if (!file || !file.fileId) return sum;
          const dataFile = file.fileId as IDataFile;
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

        return {
          id: user._id,
          email: user.email,
          role: user.role,
          userType: user.userType,
          title: user.title,
          credits: user.credits || 0,
          totalFiles: files.length,
          totalRecords: totalRecords,
          lastUpload: mostRecentDate,
          createdAt: user.createdAt,
          files: files
        };
      } catch (err) {
        console.error("Error processing user:", err);
        // Return a minimal valid user object to prevent the entire response from failing
        return {
          id: user._id,
          email: user.email || 'unknown',
          role: user.role || 'user',
          userType: user.userType,
          title: user.title,
          credits: user.credits || 0,
          totalFiles: 0,
          totalRecords: 0,
          lastUpload: null,
          createdAt: user.createdAt || new Date(),
          files: []
        };
      }
    }))

    const response = NextResponse.json(formattedUsers);
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('X-Response-Time', timestamp.toString());
    
    return response;
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const title = formData.get("title") as string
    const userType = formData.get("userType") as "workmate" | "general"
    const file = formData.get("file") as File | null

    if (!email || !password || !title || !userType) {
      return NextResponse.json({ error: "Email, password, title, and user type are required" }, { status: 400 })
    }

    if (!["workmate", "general"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if email is already in use
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    let dataFile = null
    let parsedData: any[] = []

    // Only process file if it was provided
    if (file && file.size > 0) {
      const fileBuffer = await file.arrayBuffer()

      // Handle Excel files
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(fileBuffer)
        
        // Get the first worksheet
        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
          return NextResponse.json({ error: "No worksheet found in the Excel file." }, { status: 400 })
        }
        
        // Get headers from the first row
        const headers: string[] = []
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value ? cell.value.toString().trim() : ''
        })
        
        // Process data rows
        parsedData = []
        worksheet.eachRow((row, rowNumber) => {
          // Skip header row
          if (rowNumber === 1) return
          
          const rowData: Record<string, any> = {}
          row.eachCell((cell, colNumber) => {
            if (colNumber <= headers.length && headers[colNumber - 1]) {
              rowData[headers[colNumber - 1]] = cell.value
            }
          })
          
          // Only add rows that have data
          if (Object.keys(rowData).length > 0) {
            parsedData.push(rowData)
          }
        })
      } 
      // Handle CSV files
      else if (file.name.endsWith('.csv')) {
        const fileContent = await file.text()
        const result = parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          transform: (value) => value.trim(),
        })
        parsedData = result.data
      } else {
        return NextResponse.json({ error: "Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file." }, { status: 400 })
      }

      // Basic validation
      if (!parsedData || parsedData.length === 0) {
        return NextResponse.json({ error: "The uploaded file contains no data." }, { status: 400 })
      }

      const fileHeaders = Object.keys(parsedData[0] || {})
      if (!fileHeaders || fileHeaders.length === 0) {
        return NextResponse.json({ error: "No column headers found in the file." }, { status: 400 })
      }

      // Create a new data file
      dataFile = await DataFile.create({
        data: parsedData,
        columns: fileHeaders,
        filename: file.name,
        originalName: file.name
      })
    }

    // Create a new user with optional uploaded file
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      email,
      password: hashedPassword,
      role: "user",
      userType,
      title,
      credits: 0,
      dataFiles: dataFile ? [{
        fileId: dataFile._id,
        title,
        createdAt: new Date()
      }] : []
    })

    // Return success response with user data
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        credits: user.credits,
        files: dataFile ? [{
          id: dataFile._id,
          title,
          recordCount: parsedData.length
        }] : []
      }
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

