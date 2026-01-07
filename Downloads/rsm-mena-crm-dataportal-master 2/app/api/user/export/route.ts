import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { getCurrentUser } from "@/lib/auth"
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, selectedRecords, selectedIndices, format = 'xlsx' } = body
    
    console.log("Export request received:", { 
      type, 
      selectedRecords, 
      selectedIndicesCount: selectedIndices?.length,
      format 
    })

    if (!type || (type === 'selected' && (!selectedRecords || !selectedIndices))) {
      console.log("Invalid export parameters:", { type, selectedRecords, selectedIndices })
      return NextResponse.json({ error: "Invalid export parameters" }, { status: 400 })
    }

    await connectToDatabase()

    // Get user with all data files
    const user = await User.findById(session.id)
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: 'data columns'
      })
      .lean()
      .exec()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.dataFiles || user.dataFiles.length === 0) {
      return NextResponse.json({ error: "No data files found" }, { status: 404 })
    }

    // Combine all data from all files
    let allData = user.dataFiles.flatMap(file => {
      if (!file.fileId || !(file.fileId as any).data) return []
      return (file.fileId as any).data || []
    }).filter(Boolean) // Filter out any null/undefined entries

    // Get columns order from the first file that has columns defined
    let columnsOrder: string[] = []
    for (const file of user.dataFiles) {
      if ((file.fileId as any)?.columns && (file.fileId as any).columns.length > 0) {
        columnsOrder = (file.fileId as any).columns
        break
      }
    }

    // If no columns order is found, get it from the first data item
    if (columnsOrder.length === 0 && allData.length > 0) {
      columnsOrder = Object.keys(allData[0] || {})
    }

    // If exporting selected records, use the selected indices
    if (type === 'selected' && selectedIndices && Array.isArray(selectedIndices)) {
      console.log(`Filtering ${allData.length} records to ${selectedIndices.length} selected records`)
      // Make sure indices are valid
      allData = selectedIndices
        .filter(index => typeof index === 'number' && index >= 0 && index < allData.length)
        .map((index: number) => allData[index])
      console.log(`After filtering: ${allData.length} records to export`)
    }

    if (allData.length === 0) {
      console.log("No data to export after filtering")
      return NextResponse.json({ error: "No data to export" }, { status: 400 })
    }

    // Sanitize data to ensure it's compatible with ExcelJS
    const sanitizedData = allData.map(item => {
      const sanitizedItem: Record<string, string> = {}
      columnsOrder.forEach(col => {
        // Convert any non-string values to strings to avoid ExcelJS issues
        const value = item[col]
        sanitizedItem[col] = value !== null && value !== undefined ? String(value) : ''
      })
      return sanitizedItem
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data')
    
    // Add headers
    worksheet.addRow(columnsOrder)
    
    // Add data rows
    sanitizedData.forEach(item => {
      const row = columnsOrder.map(col => item[col] || '')
      worksheet.addRow(row)
    })

    try {
      let buffer: ArrayBuffer
      let contentType: string
      let filename: string
      
      if (format === 'csv') {
        buffer = await workbook.csv.writeBuffer() as unknown as ArrayBuffer
        contentType = 'text/csv'
        filename = 'exported_data.csv'
      } else {
        buffer = await workbook.xlsx.writeBuffer() as unknown as ArrayBuffer
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = 'exported_data.xlsx'
      }
      
      // Return the file
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } catch (bufferError) {
      console.error("Error generating file buffer:", bufferError)
      return NextResponse.json({ error: "Failed to generate export file" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 