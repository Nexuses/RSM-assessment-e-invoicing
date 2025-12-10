# Google Sheets Integration Setup

This guide will help you set up Google Sheets API to automatically save form submissions to your Google Sheet.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the required APIs:
   - Go to "APIs & Services" > "Library"
   - Search for and enable **"Google Sheets API"**
   - Search for and enable **"Google Drive API"** (needed for PDF uploads)
   - Click "Enable" for both

## Step 2: Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - **Name**: RSM Form Submission (or any name you prefer)
   - **Description**: Service account for form submissions
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 3: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create" - this will download a JSON file

## Step 4: Share Google Sheet with Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1f2q-DxMAs19kZwokhjdEMUZVgWaEjfKSuqAcuJi2DeU/edit
2. Click the "Share" button (top right)
3. Copy the **email address** from the service account JSON file (it looks like: `your-service-account@project-id.iam.gserviceaccount.com`)
4. Paste it in the "Add people and groups" field
5. Give it **Editor** permissions
6. Click "Send" (you can uncheck "Notify people" if you want)

## Step 5: Add Credentials to Environment Variables

You have two options for providing credentials:

### Option A: JSON String (Recommended for production)

1. Open the downloaded JSON file
2. Copy the entire contents
3. Add it to your `.env.local` file:

```env
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account","project_id":"your-project-id",...}'
```

**Important Notes:**
- The entire JSON must be on a single line
- Use single quotes around the JSON string
- Escape any single quotes inside the JSON if needed

### Option B: File Path (Easier for development)

1. Save the downloaded JSON file in your project (e.g., `credentials/google-service-account.json`)
2. Add `.gitignore` entry to exclude it: `credentials/google-service-account.json`
3. Add to your `.env.local` file:

```env
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./credentials/google-service-account.json
```

### Optional: Configure Sheet Settings

You can also customize the spreadsheet and sheet name:

```env
GOOGLE_SHEET_ID=1f2q-DxMAs19kZwokhjdEMUZVgWaEjfKSuqAcuJi2DeU
GOOGLE_SHEET_NAME=Sheet1
```

## Step 6: Test the Integration

1. Restart your Next.js development server
2. Submit a test form
3. Check your Google Sheet - you should see:
   - Headers automatically created in the first row
   - Form submission data in the second row

## Troubleshooting

### Error: "GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is required"
- Make sure you've added the credentials to `.env.local`
- Restart your development server after adding environment variables

### Error: "The caller does not have permission"
- Make sure you've shared the Google Sheet with the service account email
- The service account needs "Editor" permissions

### Error: "Unable to parse range"
- Make sure the sheet name is correct (default is "Sheet1")
- Check that the spreadsheet ID is correct in `lib/google-sheets.ts`

## Sheet Structure

The Google Sheet will automatically have these columns:
- Timestamp
- Country
- Primary Cyber Security Lead
- Contact Email
- Services (comma-separated)
- Niche & Unique Capabilities
- Leader 1-5: Name, Designation, Expertise (for up to 5 leaders)

Headers are automatically created and formatted with:
- Blue background (#009BDD)
- White bold text

