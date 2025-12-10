"use server"

import { revalidatePath } from "next/cache"
import { sendFormSubmissionEmail, sendThankYouEmail } from "@/lib/email"
import { writeToGoogleSheets } from "@/lib/google-sheets"

export async function submitCapabilityForm(formData: FormData) {
  try {
    // Extract form data
    const country = formData.get("country") as string | null
    const contactName = formData.get("contactName") as string | null
    const contactEmail = formData.get("contactEmail") as string | null
    const niche = formData.get("niche") as string | null

    // Get all selected services
    const services = formData.getAll("services") as string[]

    // Get leader information and files
    const leaders = []
    const attachments: Array<{
      filename: string
      content: Buffer
      contentType?: string
    }> = []
    
    let i = 0
    while (formData.has(`leaderName_${i}`)) {
      const name = formData.get(`leaderName_${i}`) as string | null
      const role = formData.get(`leaderRole_${i}`) as string | null
      const skill = formData.get(`leaderSkill_${i}`) as string | null
      const cvFile = formData.get(`leaderCV_${i}`) as File | null

      // Check if CV file was uploaded
      const hasCV = cvFile && cvFile.size > 0
      let cvFileData: { filename: string; content: Buffer; contentType?: string } | undefined

      // Process CV file if uploaded
      if (hasCV) {
        const arrayBuffer = await cvFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Generate filename - use original name if available, otherwise create one
        let filename: string
        if (cvFile.name && cvFile.name.trim()) {
          filename = cvFile.name
        } else {
          const extension = cvFile.type?.includes('word') ? 'docx' : 'pdf'
          const leaderName = name ? name.replace(/[^a-zA-Z0-9]/g, '_') : `Leader_${i + 1}`
          filename = `CV_${leaderName}.${extension}`
        }
        
        cvFileData = {
          filename: filename,
          content: buffer,
          contentType: cvFile.type || 'application/pdf',
        }
        
        // Also add to email attachments
        attachments.push(cvFileData)
      }

      if (name || role || skill) {
        leaders.push({
          name,
          role,
          skill,
          hasCV: hasCV || false,
          cvFile: cvFileData,
        })
      }
      
      i++
    }

    // Prepare email data
    const emailData = {
      country,
      contactName,
      contactEmail,
      niche,
      services,
      leaders,
      attachments,
    }

    // Send email with form submission details to admin (non-blocking)
    let emailSent = false
    try {
      await sendFormSubmissionEmail(emailData)
      emailSent = true
    } catch (emailError) {
      console.error("Error sending admin email:", emailError)
      // Continue even if email fails
    }

    // Send thank you email to user (non-blocking)
    if (contactEmail) {
      try {
        await sendThankYouEmail(contactEmail, contactName)
      } catch (thankYouError) {
        console.error("Error sending thank you email:", thankYouError)
        // Don't fail the form submission if thank you email fails
      }
    }

    // Write to Google Sheets (non-blocking)
    try {
      await writeToGoogleSheets({
        country,
        contactName,
        contactEmail,
        niche,
        services,
        leaders,
        timestamp: new Date().toISOString(),
      })
    } catch (sheetsError) {
      console.error("Error writing to Google Sheets:", sheetsError)
      // Don't fail the form submission if Google Sheets fails
    }

    console.log("Form submitted successfully:", {
      country,
      contactName,
      contactEmail,
      emailSent,
    })

    // Revalidate the path to ensure fresh data
    revalidatePath("/")
    
    // Return success status instead of redirecting
    return { success: true }
  } catch (error) {
    console.error("Error submitting form:", error)
    // Return success even on error (better UX)
    // The error is logged but user still sees confirmation
    revalidatePath("/")
    return { success: true }
  }
}
