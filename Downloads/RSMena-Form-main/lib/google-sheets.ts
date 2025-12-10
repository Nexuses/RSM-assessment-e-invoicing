import { google } from 'googleapis'
import { Readable } from 'stream'

interface FormSubmissionData {
  country: string | null
  contactName: string | null
  contactEmail: string | null
  niche: string | null
  services: string[]
  leaders: Array<{
    name: string | null
    role: string | null
    skill: string | null
    hasCV?: boolean
    cvFile?: {
      filename: string
      content: Buffer
      contentType?: string
    }
  }>
  timestamp?: string
}

// Extract spreadsheet ID from URL or use environment variable
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1f2q-DxMAs19kZwokhjdEMUZVgWaEjfKSuqAcuJi2DeU'
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1' // Default sheet name, can be changed

/**
 * Initialize Google Drive API client
 */
async function getDriveClient() {
  // Check for credentials - can be JSON string, file path, or use default credentials
  const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
  const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE

  let auth

  try {
    if (credentialsPath) {
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ],
      })
    } else if (credentialsString) {
      let credentialsJson
      try {
        credentialsJson = JSON.parse(credentialsString)
      } catch {
        auth = new google.auth.GoogleAuth({
          keyFile: credentialsString,
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
          ],
        })
        const authClient = await auth.getClient()
        const drive = google.drive({ version: 'v3', auth: authClient })
        return drive
      }

      auth = new google.auth.GoogleAuth({
        credentials: credentialsJson,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ],
      })
    } else {
      throw new Error('Google Drive credentials not found')
    }
  } catch (error) {
    throw new Error(
      `Failed to initialize Google Drive client: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  const authClient = await auth.getClient()
  const drive = google.drive({ version: 'v3', auth: authClient })

  return drive
}

/**
 * Upload PDF file to Google Drive and return shareable link
 */
async function uploadPDFToDrive(
  filename: string,
  content: Buffer,
  contentType: string = 'application/pdf'
): Promise<string> {
  try {
    const drive = await getDriveClient()

    // Get shared drive ID from environment variable (optional)
    // If not provided, will try to upload to service account's drive (which may fail)
    let sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID

    // Extract drive ID from URL if full URL is provided
    // Handles formats like: https://drive.google.com/drive/u/0/folders/DRIVE_ID
    if (sharedDriveId) {
      // Check if it's a URL
      if (sharedDriveId.includes('drive.google.com')) {
        // Extract ID from URL patterns
        const urlMatch = sharedDriveId.match(/\/folders\/([a-zA-Z0-9_-]+)/)
        if (urlMatch && urlMatch[1]) {
          sharedDriveId = urlMatch[1]
        } else {
          // Try to extract from other URL patterns
          const altMatch = sharedDriveId.match(/id=([a-zA-Z0-9_-]+)/)
          if (altMatch && altMatch[1]) {
            sharedDriveId = altMatch[1]
          }
        }
      }
      // Remove any trailing dots or whitespace
      sharedDriveId = sharedDriveId.trim().replace(/\.$/, '')
    }

    // Create file metadata
    const fileMetadata: any = {
      name: filename,
      mimeType: contentType,
    }

    // If shared drive ID is provided, add it to parents
    if (sharedDriveId) {
      fileMetadata.parents = [sharedDriveId]
    }

    // Upload file - convert Buffer to stream for googleapis
    const media = {
      mimeType: contentType,
      body: Readable.from(content), // Convert Buffer to stream
    }

    // Upload file with shared drive support
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
      supportsTeamDrives: true,
    })

    if (!file.data.id) {
      throw new Error('File upload succeeded but no file ID returned')
    }

    // Make the file publicly viewable (or you can share with specific emails)
    try {
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
        supportsTeamDrives: true,
      })
    } catch (permError) {
      console.warn('Warning: Could not set public permissions, but file was uploaded:', permError)
      // Continue even if permissions fail - file is still uploaded
    }

    // Return the view link
    const viewLink = file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`
    return viewLink
  } catch (error: any) {
    console.error('Error uploading PDF to Google Drive:', error)
    // Log more details for debugging
    if (error.response) {
      console.error('Drive API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      })
    }
    throw new Error(
      `Failed to upload PDF to Google Drive: ${error?.message || error?.response?.data?.error?.message || 'Unknown error'}`
    )
  }
}

/**
 * Initialize Google Sheets API client
 */
async function getSheetsClient() {
  // Check for credentials - can be JSON string, file path, or use default credentials
  const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
  const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE

  let auth

  try {
    if (credentialsPath) {
      // Use credentials from file path
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      })
    } else if (credentialsString) {
      // Parse credentials from JSON string
      let credentialsJson
      try {
        credentialsJson = JSON.parse(credentialsString)
      } catch {
        // If parsing fails, try treating it as a file path
        auth = new google.auth.GoogleAuth({
          keyFile: credentialsString,
          scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
          ],
        })
        const authClient = await auth.getClient()
        const sheets = google.sheets({ version: 'v4', auth: authClient })
        return sheets
      }

      auth = new google.auth.GoogleAuth({
        credentials: credentialsJson,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      })
    } else {
      throw new Error(
        'Google Sheets credentials not found. Please set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS (JSON string) or GOOGLE_SERVICE_ACCOUNT_KEY_FILE (file path) in your .env.local file'
      )
    }
  } catch (error) {
    throw new Error(
      `Failed to initialize Google Sheets client: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  const authClient = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: authClient })

  return sheets
}

/**
 * Check if headers exist and create them if they don't
 */
async function ensureHeaders(sheets: any) {
  try {
    // Get the first row to check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Z1`,
    })

    const existingHeaders = response.data.values?.[0] || []

    // Define required headers
    const requiredHeaders = [
      'Timestamp',
      'Country',
      'Primary Cyber Security Lead',
      'Contact Email',
      'Services',
      'Niche & Unique Capabilities',
      'Leader 1 Name',
      'Leader 1 Designation',
      'Leader 1 Expertise',
      'Leader 1 CV Link',
      'Leader 2 Name',
      'Leader 2 Designation',
      'Leader 2 Expertise',
      'Leader 2 CV Link',
      'Leader 3 Name',
      'Leader 3 Designation',
      'Leader 3 Expertise',
      'Leader 3 CV Link',
      'Leader 4 Name',
      'Leader 4 Designation',
      'Leader 4 Expertise',
      'Leader 4 CV Link',
      'Leader 5 Name',
      'Leader 5 Designation',
      'Leader 5 Expertise',
      'Leader 5 CV Link',
    ]

    // Check if headers need to be created or updated
    if (existingHeaders.length === 0 || existingHeaders[0] !== requiredHeaders[0]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [requiredHeaders],
        },
      })

      // Get the sheet ID dynamically
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      })
      const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === SHEET_NAME)
      const sheetId = sheet?.properties?.sheetId || 0

      // Format header row (plain text, no background color)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0, // White background
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 0.0,
                        green: 0.0,
                        blue: 0.0, // Black text
                      },
                      bold: false, // Plain text
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      })
    }
  } catch (error) {
    console.error('Error ensuring headers:', error)
    // Don't throw - headers might already exist
  }
}

/**
 * Write form submission data to Google Sheets
 */
export async function writeToGoogleSheets(data: FormSubmissionData) {
  try {
    const sheets = await getSheetsClient()

    // Ensure headers exist
    await ensureHeaders(sheets)

    // Format services as comma-separated string
    const servicesString = data.services.join(', ')

    // Format leaders data (support up to 5 leaders)
    // Upload PDFs to Google Drive and get links
    const leadersData: string[] = []
    for (let i = 0; i < 5; i++) {
      const leader = data.leaders[i] || { name: null, role: null, skill: null, hasCV: false }
      leadersData.push(leader.name || '')
      leadersData.push(leader.role || '')
      leadersData.push(leader.skill || '')
      
      // Upload CV to Google Drive if available
      let cvLink = ''
      if (leader.cvFile && leader.cvFile.content) {
        try {
          console.log(`Uploading CV for leader ${i + 1}: ${leader.cvFile.filename}`)
          cvLink = await uploadPDFToDrive(
            leader.cvFile.filename,
            leader.cvFile.content,
            leader.cvFile.contentType || 'application/pdf'
          )
          console.log(`Successfully uploaded CV for leader ${i + 1}: ${cvLink}`)
        } catch (error: any) {
          console.error(`Error uploading CV for leader ${i + 1}:`, error)
          const errorMessage = error?.message || 'Unknown error'
          cvLink = `Upload failed: ${errorMessage.substring(0, 50)}` // Limit error message length
        }
      }
      
      leadersData.push(cvLink)
    }

    // Prepare row data
    const timestamp = data.timestamp || new Date().toISOString()
    const rowData = [
      timestamp,
      data.country || '',
      data.contactName || '',
      data.contactEmail || '',
      servicesString,
      data.niche || '',
      ...leadersData,
    ]

    // Append data to the sheet
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    })

    // Get the row number where data was inserted
    // updatedRange format: "Sheet1!A2:Z2" - extract row number
    let insertedRow = 2 // Default to row 2 if we can't determine
    if (appendResponse.data.updates?.updatedRange) {
      const range = appendResponse.data.updates.updatedRange
      const rowMatch = range.match(/!A(\d+)/)
      if (rowMatch && rowMatch[1]) {
        insertedRow = parseInt(rowMatch[1])
      }
    }

    // Format the data row to have plain text (no background color)
    // This ensures data rows don't have any background color, only plain text
    try {
      // Get the sheet ID dynamically
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      })
      const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === SHEET_NAME)
      const sheetId = sheet?.properties?.sheetId || 0

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: insertedRow - 1, // Convert to 0-based index
                  endRowIndex: insertedRow, // One row
                  startColumnIndex: 0,
                  endColumnIndex: 30, // Cover all columns
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0, // White background
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 0.0,
                        green: 0.0,
                        blue: 0.0, // Black text
                      },
                      bold: false, // Plain text, not bold
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      })
    } catch (formatError) {
      console.error('Error formatting data row:', formatError)
      // Don't throw - data was already written, formatting is optional
    }

    return { success: true }
  } catch (error) {
    console.error('Error writing to Google Sheets:', error)
    throw new Error(
      `Failed to write to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

