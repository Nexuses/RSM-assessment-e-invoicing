import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import ExcelJS from 'exceljs'

// All supported columns for workmate user
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
].map(col => col.toLowerCase());

// All supported columns for general user
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
].map(col => col.toLowerCase());

// All supported columns - combine both sets
const ALL_SUPPORTED_COLUMNS = [...new Set([...WORKMATE_COLUMNS, ...GENERAL_COLUMNS])];

type RouteParams = {
  params: {
    userId: string
  }
}

// Add these exports to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    console.log("Starting file upload process...")
    
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("Admin check passed, processing form data...")
    
    // Use a try-catch block specifically for formData parsing
    let formData;
    try {
      formData = await request.formData()
    } catch (error) {
      const formError = error as Error;
      console.error("Error parsing form data:", formError)
      return NextResponse.json({ 
        error: `Error parsing form data: ${formError.message || "Unknown error"}. The file may be too large.` 
      }, { status: 413 })
    }
    
    const file = formData.get("file") as File
    const title = formData.get("title") as string

    console.log(`File received: ${file?.name}, size: ${file?.size} bytes, type: ${file?.type}`)

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 })
    }

    // Check file size (limit to 30MB)
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE} bytes)`)
      return NextResponse.json({ 
        error: `File size exceeds the limit of 30MB. Please upload a smaller file or split your data.` 
      }, { status: 413 })
    }

    await connectToDatabase()

    // Find the user
    const userId = await Promise.resolve(params.userId)
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let parsedData: any[] = []
    
    // Handle different file types
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      console.log("Processing Excel file...")
      try {
        const fileBuffer = await file.arrayBuffer()
        console.log(`File buffer size: ${fileBuffer.byteLength} bytes`)
        
        const workbook = new ExcelJS.Workbook()
        
        try {
          await workbook.xlsx.load(fileBuffer)
        } catch (error) {
          const excelLoadError = error as Error;
          console.error("Error loading Excel file:", excelLoadError)
          return NextResponse.json({ 
            error: `Error loading Excel file: ${excelLoadError.message || "Unknown error"}. The file may be corrupted or in an unsupported format.` 
          }, { status: 400 })
        }
        
        // Get the first worksheet
        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
          console.error("No worksheet found in Excel file")
          return NextResponse.json({ error: "No worksheet found in the Excel file." }, { status: 400 })
        }
        
        console.log(`Worksheet found: ${worksheet.name}, row count: ${worksheet.rowCount}`)
        
        // Get headers from the first row
        const headers: string[] = []
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value ? cell.value.toString().trim() : ''
        })
        
        console.log(`Headers found: ${headers.join(', ')}`)
        
        // Check if we have too many rows to process at once
        const MAX_ROWS = 10000; // Set a reasonable limit
        if (worksheet.rowCount > MAX_ROWS) {
          console.warn(`Large file detected: ${worksheet.rowCount} rows. Processing first ${MAX_ROWS} rows.`)
          // We could implement pagination here, but for now just warn and limit
        }
        
        // Process data rows with a limit
        parsedData = []
        const rowLimit = Math.min(worksheet.rowCount, MAX_ROWS);
        
        // Process rows in batches to avoid memory issues
        const BATCH_SIZE = 1000;
        for (let rowNumber = 2; rowNumber <= rowLimit; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          const rowData: Record<string, any> = {};
          
          row.eachCell((cell, colNumber) => {
            if (colNumber <= headers.length && headers[colNumber - 1]) {
              // Convert cell value to string to avoid complex object types
              let value = cell.value;
              if (value !== null && value !== undefined) {
                // Handle date objects
                if (value instanceof Date) {
                  value = value.toISOString();
                } else if (typeof value === 'object') {
                  // Handle rich text or other complex types
                  try {
                    value = value.toString();
                  } catch (e) {
                    value = ''; // If toString fails, use empty string
                  }
                }
              }
              rowData[headers[colNumber - 1]] = value;
            }
          });
          
          // Only add rows that have data
          if (Object.keys(rowData).length > 0) {
            parsedData.push(rowData);
          }
          
          // Log progress for large files
          if (rowNumber % BATCH_SIZE === 0) {
            console.log(`Processed ${rowNumber} rows out of ${rowLimit}`);
          }
        }
        
        console.log(`Parsed ${parsedData.length} rows from Excel file`)
      } catch (error) {
        const excelError = error as Error;
        console.error("Error processing Excel file:", excelError)
        return NextResponse.json({ error: `Error processing Excel file: ${excelError.message || "Unknown error"}` }, { status: 400 })
      }
    } else if (file.name.endsWith('.csv')) {
      console.log("Processing CSV file...")
      try {
        // Process the new file
        const fileContent = await file.text()
        console.log(`CSV file content length: ${fileContent.length} characters`)
        
        // Parse CSV with a streaming approach for large files
        try {
          const result = parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            transform: (value) => value.trim(),
          })
          
          parsedData = result.data
          console.log(`Parsed ${parsedData.length} rows from CSV file`)
        } catch (error) {
          const parseError = error as Error;
          console.error("Error parsing CSV:", parseError)
          
          // Try a more lenient approach - split by lines and commas
          try {
            console.log("Attempting alternative CSV parsing method...")
            const lines = fileContent.split(/\r?\n/);
            const headers = lines[0].split(',').map(h => h.trim());
            
            parsedData = [];
            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue; // Skip empty lines
              
              const values = lines[i].split(',');
              const row: Record<string, any> = {};
              
              for (let j = 0; j < headers.length; j++) {
                if (headers[j]) {
                  row[headers[j]] = values[j] ? values[j].trim() : '';
                }
              }
              
              if (Object.keys(row).length > 0) {
                parsedData.push(row);
              }
            }
            
            console.log(`Parsed ${parsedData.length} rows using alternative CSV parsing`)
            
            if (parsedData.length === 0) {
              throw new Error("Failed to parse any data from the CSV file");
            }
          } catch (fallbackError) {
            console.error("Fallback CSV parsing failed:", fallbackError)
            return NextResponse.json({ error: `Error parsing CSV file: ${parseError.message || "Unknown error"}` }, { status: 400 })
          }
        }
      } catch (error) {
        const csvError = error as Error;
        console.error("Error processing CSV file:", csvError)
        return NextResponse.json({ error: `Error processing CSV file: ${csvError.message || "Unknown error"}` }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file." }, { status: 400 })
    }

    // Basic validation - ensure there's data
    if (!parsedData || parsedData.length === 0) {
      console.error("No data found in the uploaded file")
      return NextResponse.json({ error: "The uploaded file contains no data." }, { status: 400 })
    }

    // Ensure the file has at least some column headers
    const fileHeaders = Object.keys(parsedData[0] || {})
    if (!fileHeaders || fileHeaders.length === 0) {
      console.error("No column headers found in the file")
      return NextResponse.json({ error: "No column headers found in the file." }, { status: 400 })
    }

    // Convert headers to lowercase for case-insensitive comparison
    const lowercaseHeaders = fileHeaders.map(h => h.toLowerCase())
    console.log(`Lowercase headers: ${lowercaseHeaders.join(', ')}`)

    // Check if any of the required columns are present - make this check more lenient
    const hasRequiredColumns = ALL_SUPPORTED_COLUMNS.some(col => 
      lowercaseHeaders.some(header => header.includes(col))
    );
    
    if (!hasRequiredColumns) {
      console.error("No required columns found in the file")
      console.log(`Required columns: ${ALL_SUPPORTED_COLUMNS.join(', ')}`)
      console.log(`File headers: ${lowercaseHeaders.join(', ')}`)
      return NextResponse.json({ 
        error: "The file does not contain any of the required columns. Please check the file format." 
      }, { status: 400 })
    }

    // Check if the data is too large for MongoDB (16MB limit)
    // Instead of checking the entire JSON size, we'll estimate based on row count and column count
    const estimatedSizePerRow = JSON.stringify(parsedData[0]).length;
    const estimatedTotalSize = estimatedSizePerRow * parsedData.length;
    const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15MB to be safe (MongoDB limit is 16MB)
    
    console.log(`Estimated data size: ${estimatedTotalSize} bytes (max: ${MAX_DOCUMENT_SIZE} bytes)`)
    
    if (estimatedTotalSize > MAX_DOCUMENT_SIZE) {
      console.error(`Data size too large for MongoDB: ~${estimatedTotalSize} bytes (max: ${MAX_DOCUMENT_SIZE} bytes)`)
      
      // Instead of rejecting, we'll truncate the data
      const safeRowCount = Math.floor(MAX_DOCUMENT_SIZE / estimatedSizePerRow) - 100; // Leave some margin
      console.log(`Truncating data to ${safeRowCount} rows to fit within MongoDB limits`)
      
      parsedData = parsedData.slice(0, safeRowCount);
      
      // We'll still save the file but warn the user
      console.warn(`File truncated from ${parsedData.length} to ${safeRowCount} rows due to size limits`)
    }

    // Sanitize data to ensure it's JSON-compatible
    parsedData = parsedData.map(row => {
      const sanitizedRow: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(row)) {
        // Handle null/undefined
        if (value === null || value === undefined) {
          sanitizedRow[key] = '';
          continue;
        }
        
        // Convert non-primitive values to strings
        if (typeof value === 'object') {
          try {
            sanitizedRow[key] = JSON.stringify(value);
          } catch (e) {
            sanitizedRow[key] = String(value);
          }
        } else {
          // Convert other types to appropriate JSON-compatible values
          sanitizedRow[key] = value;
        }
      }
      
      return sanitizedRow;
    });

    console.log("Creating new DataFile document...")
    // Create a new DataFile document
    try {
      const dataFile = await DataFile.create({
        data: parsedData,
        columns: fileHeaders,
        filename: file.name,
        originalName: file.name
      })

      console.log(`DataFile created with ID: ${dataFile._id}`)

      // Add the file reference to the user's dataFiles array
      user.dataFiles.push({
        fileId: dataFile._id,
        title,
        createdAt: new Date()
      })

      await user.save()
      console.log("User updated with new file reference")

      // Return a success message with info about truncation if it happened
      const wasDataTruncated = estimatedTotalSize > MAX_DOCUMENT_SIZE;
      
      const response = NextResponse.json({ 
        message: wasDataTruncated ? 
          `File uploaded successfully but was truncated to ${parsedData.length} rows due to size limits` : 
          "File uploaded successfully", 
        fileId: dataFile._id,
        rowCount: parsedData.length,
        truncated: wasDataTruncated
      });
      
      // Add cache control headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
      
      return response;
    } catch (error) {
      const dbError = error as Error;
      console.error("Database error when saving file:", dbError)
      return NextResponse.json({ 
        error: `Error saving file to database: ${dbError.message || "Unknown error"}. This may be due to invalid data format.` 
      }, { status: 500 })
    }
  } catch (error) {
    const err = error as Error;
    console.error("Error uploading file:", err)
    return NextResponse.json({ error: `Internal server error: ${err.message || "Unknown error"}` }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the user
    const userId = await Promise.resolve(params.userId)
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find and remove the file from user's dataFiles array
    const fileIndex = user.dataFiles.findIndex(
      (file) => file.fileId.toString() === fileId
    )

    if (fileIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete the data file
    await DataFile.findByIdAndDelete(fileId)

    // Remove the file from user's dataFiles array
    user.dataFiles.splice(fileIndex, 1)
    await user.save()

    const response = NextResponse.json({ message: "File deleted successfully" });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    const err = error as Error;
    console.error("Error deleting file:", err)
    return NextResponse.json({ error: `Internal server error: ${err.message || "Unknown error"}` }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    const data = await request.json()
    const { title } = data

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: "Valid title is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the user
    const userId = await Promise.resolve(params.userId)
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the file in user's dataFiles array
    const fileIndex = user.dataFiles.findIndex(
      (file) => file.fileId.toString() === fileId
    )

    if (fileIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Update the file title
    user.dataFiles[fileIndex].title = title
    await user.save()

    const response = NextResponse.json({ 
      message: "File title updated successfully",
      title: title
    });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    const err = error as Error;
    console.error("Error updating file title:", err)
    return NextResponse.json({ error: `Internal server error: ${err.message || "Unknown error"}` }, { status: 500 })
  }
} 