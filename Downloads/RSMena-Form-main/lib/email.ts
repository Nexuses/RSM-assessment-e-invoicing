import nodemailer from 'nodemailer'

interface EmailData {
  country: string | null
  contactName: string | null
  contactEmail: string | null
  niche: string | null
  services: string[]
  leaders: Array<{
    name: string | null
    role: string | null
    skill: string | null
  }>
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType?: string
  }>
}

export async function sendFormSubmissionEmail(data: EmailData) {
  // Get SMTP configuration from environment variables
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpSecure = process.env.SMTP_SECURE === 'true'
  const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com'
  const toEmail = process.env.TO_EMAIL || fromEmail // Use TO_EMAIL if set, otherwise use FROM_EMAIL

  // Validate required environment variables
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Missing required SMTP configuration in environment variables')
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  // Format services list
  const servicesList = data.services.length > 0 
    ? data.services.map(service => `  • ${service}`).join('\n')
    : '  None selected'

  // Format leaders list
  const leadersList = data.leaders.length > 0
    ? data.leaders.map((leader, index) => 
        `Leader ${index + 1}:\n` +
        `  Name: ${leader.name || 'N/A'}\n` +
        `  Designation: ${leader.role || 'N/A'}\n` +
        `  Primary Technical Expertise: ${leader.skill || 'N/A'}`
      ).join('\n\n')
    : '  None provided'

  // Create email content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .top-logo { text-align: center; padding: 20px; border: 2px solid #009bdd; background-color: transparent; margin-bottom: 0; }
        .top-logo img { max-height: 60px; width: auto; }
        .header { background-color: #009BDD; color: white; padding: 20px; border-radius: 0 0 5px 5px; }
        .header-content { display: flex; align-items: center; gap: 15px; }
        .logo { height: 55px; }
        .header-title { margin: 0; font-size: 24px; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .section { margin-bottom: 20px; padding: 15px; background-color: white; border-left: 4px solid #11A537; }
        .section-title { color: #11A537; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .field { margin-bottom: 10px; }
        .field-label { font-weight: bold; color: #005C94; }
        .field-value { margin-top: 5px; }
        .footer { margin-top: 20px; padding: 15px; background-color: #f4f4f4; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="top-logo">
          <img src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM/logorsm.png" alt="RSM Logo" />
        </div>
        <div class="header">
          <div class="header-content">
            <svg width="104" height="44" viewBox="0 0 104 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo">
              <g clip-path="url(#clip0_1_9)">
                <path d="M103.037 0.215576H38.2588V11.012H103.037V0.215576Z" fill="#009BDE"/>
                <path d="M8.43971 0.215576H0.213867V11.012H8.43971V0.215576Z" fill="#919093"/>
                <path d="M33.6315 0.215576H13.0669V11.012H33.6315V0.215576Z" fill="#3F9C35"/>
                <path d="M56.0644 27.1605C56.0644 24.6242 55.2075 22.5677 53.5623 21.2653C51.8829 19.9286 49.9293 19.603 47.0331 19.603H38.2417V43.0466H43.0058V23.8358H47.2044C48.3869 23.8358 49.2609 23.9901 49.8264 24.3328C50.6662 24.8298 51.1631 25.7381 51.1631 27.1776C51.1631 29.6282 49.6551 30.4851 47.6843 30.4851H44.5139V34.7351H46.4161L51.3859 43.0809H56.9041L51.3859 33.9468C54.5906 32.9871 56.0644 30.3137 56.0644 27.1605Z" fill="#63666A"/>
                <path d="M70.5279 29.78C67.1519 28.6147 63.3303 28.4776 63.3303 25.907C63.3303 24.2618 64.8384 23.4907 66.9805 23.4907C69.0884 23.4907 70.9564 23.6792 74.1267 24.5189V20.2689C71.4019 19.4977 69.4312 19.2235 66.8606 19.2235C62.2164 19.2235 58.292 21.0743 58.292 25.787C58.292 29.5058 60.1428 31.3909 63.8102 32.6419C67.0662 33.7558 70.7507 33.9786 70.7507 36.4978C70.7507 38.3829 68.917 39.1712 66.2779 39.1712C63.7073 39.1712 62.0964 38.9655 58.8232 38.0915V42.3587C61.5652 43.1813 63.8616 43.4041 66.535 43.4041C72.3616 43.4041 75.7719 40.8678 75.7719 36.155C75.7548 32.4191 73.3213 30.7397 70.5279 29.78Z" fill="#63666A"/>
                <path d="M96.799 19.603L88.436 43.0638H92.9774L98.2899 28.1544H98.3585V43.0638H103.037V19.603H96.799Z" fill="#63666A"/>
                <path d="M90.0643 34.2038L84.5975 19.603H78.2739V43.0466H82.901V28.1544H82.9695L87.6994 40.8016L90.0643 34.2038Z" fill="#63666A"/>
                <path d="M103.037 0.215576H38.2588V11.012H103.037V0.215576Z" fill="#009BDE"/>
                <path d="M8.43971 0.215576H0.213867V11.012H8.43971V0.215576Z" fill="#919093"/>
                <path d="M33.6315 0.215576H13.0669V11.012H33.6315V0.215576Z" fill="#3F9C35"/>
                <path d="M56.0644 27.1605C56.0644 24.6242 55.2075 22.5677 53.5623 21.2653C51.8829 19.9286 49.9293 19.603 47.0331 19.603H38.2417V43.0466H43.0058V23.8358H47.2044C48.3869 23.8358 49.2609 23.9901 49.8264 24.3328C50.6662 24.8298 51.1631 25.7381 51.1631 27.1776C51.1631 29.6282 49.6551 30.4851 47.6843 30.4851H44.5139V34.7351H46.4161L51.3859 43.0809H56.9041L51.3859 33.9468C54.5906 32.9871 56.0644 30.3137 56.0644 27.1605Z" fill="#63666A"/>
                <path d="M70.5279 29.78C67.1519 28.6147 63.3303 28.4776 63.3303 25.907C63.3303 24.2618 64.8384 23.4907 66.9805 23.4907C69.0884 23.4907 70.9564 23.6792 74.1267 24.5189V20.2689C71.4019 19.4977 69.4312 19.2235 66.8606 19.2235C62.2164 19.2235 58.292 21.0743 58.292 25.787C58.292 29.5058 60.1428 31.3909 63.8102 32.6419C67.0662 33.7558 70.7507 33.9786 70.7507 36.4978C70.7507 38.3829 68.917 39.1712 66.2779 39.1712C63.7073 39.1712 62.0964 38.9655 58.8232 38.0915V42.3587C61.5652 43.1813 63.8616 43.4041 66.535 43.4041C72.3616 43.4041 75.7719 40.8678 75.7719 36.155C75.7548 32.4191 73.3213 30.7397 70.5279 29.78Z" fill="#63666A"/>
                <path d="M96.799 19.603L88.436 43.0638H92.9774L98.2899 28.1544H98.3585V43.0638H103.037V19.603H96.799Z" fill="#63666A"/>
                <path d="M90.0643 34.2038L84.5975 19.603H78.2739V43.0466H82.901V28.1544H82.9695L87.6994 40.8016L90.0643 34.2038Z" fill="#63666A"/>
              </g>
              <defs>
                <clipPath id="clip0_1_9">
                  <rect width="103.139" height="43.6825" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <h1 class="header-title">RSM MENA Cyber Capability Map</h1>
          </div>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">1. Member Firm Identification</div>
            <div class="field">
              <div class="field-label">RSM Member Firm / Country:</div>
              <div class="field-value">${data.country || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Primary Cyber Security Lead:</div>
              <div class="field-value">${data.contactName || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="field-label">Contact Email:</div>
              <div class="field-value">${data.contactEmail || 'N/A'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">2. Service Capabilities</div>
            <div class="field">
              <div class="field-label">Selected Services:</div>
              <div class="field-value">
                <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${servicesList}</pre>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">3. Niche & Unique Capabilities</div>
            <div class="field">
              <div class="field-label">Unique Capabilities:</div>
              <div class="field-value">${data.niche || 'None provided'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">4. Leadership & Expertise Profile</div>
            <div class="field">
              <div class="field-value">
                <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${leadersList || 'None provided'}</pre>
              </div>
            </div>
          </div>

          ${data.attachments && data.attachments.length > 0 ? `
          <div class="section">
            <div class="section-title">5. Attached Documents</div>
            <div class="field">
              <div class="field-label">CV Files Attached:</div>
              <div class="field-value">
                <ul style="list-style-type: disc; padding-left: 20px;">
                  ${data.attachments.map(att => `<li>${att.filename}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>This email was automatically generated from the RSM MENA Cyber Security Capability Map form submission.</p>
            <p>&copy; 2025 RSM International Association. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
RSM MENA Cyber Capability Map - New Submission

1. Member Firm Identification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RSM Member Firm / Country: ${data.country || 'N/A'}
Primary Cyber Security Lead: ${data.contactName || 'N/A'}
Contact Email: ${data.contactEmail || 'N/A'}

2. Service Capabilities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Selected Services:
${servicesList}

3. Niche & Unique Capabilities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.niche || 'None provided'}

4. Leadership & Expertise Profile
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${leadersList || 'None provided'}

${data.attachments && data.attachments.length > 0 ? `
5. Attached Documents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CV Files Attached:
${data.attachments.map(att => `  • ${att.filename}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This email was automatically generated from the RSM MENA Cyber Security Capability Map form submission.
© 2025 RSM International Association. All rights reserved.
  `

  // Send email
  const info = await transporter.sendMail({
    from: fromEmail,
    to: toEmail, // Recipient email (configure via TO_EMAIL env var, defaults to FROM_EMAIL)
    replyTo: data.contactEmail || undefined,
    subject: `RSM MENA Cyber Capability Map - New Submission - ${data.country || 'Unknown Country'}`,
    text: textContent,
    html: htmlContent,
    attachments: data.attachments || [],
  })

  return info
}

/**
 * Send thank you email to the user
 */
export async function sendThankYouEmail(contactEmail: string, contactName: string | null) {
  // Get SMTP configuration from environment variables
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpSecure = process.env.SMTP_SECURE === 'true'
  const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com'

  // Validate required environment variables
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Missing required SMTP configuration in environment variables')
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  const userName = contactName || 'Valued Member'

  // Create email content with same design
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .top-logo { text-align: center; padding: 20px; border: 2px solid #009bdd; background-color: transparent; margin-bottom: 0; }
        .top-logo img { max-height: 60px; width: auto; }
        .header { background-color: #009BDD; color: white; padding: 20px; border-radius: 0 0 5px 5px; }
        .header-content { display: flex; align-items: center; gap: 15px; }
        .logo { height: 55px; }
        .header-title { margin: 0; font-size: 24px; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .section { margin-bottom: 20px; padding: 30px 20px; background-color: white; text-align: center; }
        .section-title { color: #11A537; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .thank-you-icon { width: 80px; height: 80px; margin: 0 auto 25px; }
        .thank-you-title { color: #333; font-size: 24px; font-weight: bold; margin-bottom: 15px; }
        .thank-you-message { color: #666; font-size: 16px; line-height: 1.8; text-align: center; }
        .footer { margin-top: 20px; padding: 15px; background-color: #f4f4f4; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="top-logo">
          <img src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM/logorsm.png" alt="RSM Logo" />
        </div>
        <div class="header">
          <div class="header-content">
            <svg width="104" height="44" viewBox="0 0 104 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo">
              <g clip-path="url(#clip0_1_9)">
                <path d="M103.037 0.215576H38.2588V11.012H103.037V0.215576Z" fill="#009BDE"/>
                <path d="M8.43971 0.215576H0.213867V11.012H8.43971V0.215576Z" fill="#919093"/>
                <path d="M33.6315 0.215576H13.0669V11.012H33.6315V0.215576Z" fill="#3F9C35"/>
                <path d="M56.0644 27.1605C56.0644 24.6242 55.2075 22.5677 53.5623 21.2653C51.8829 19.9286 49.9293 19.603 47.0331 19.603H38.2417V43.0466H43.0058V23.8358H47.2044C48.3869 23.8358 49.2609 23.9901 49.8264 24.3328C50.6662 24.8298 51.1631 25.7381 51.1631 27.1776C51.1631 29.6282 49.6551 30.4851 47.6843 30.4851H44.5139V34.7351H46.4161L51.3859 43.0809H56.9041L51.3859 33.9468C54.5906 32.9871 56.0644 30.3137 56.0644 27.1605Z" fill="#63666A"/>
                <path d="M70.5279 29.78C67.1519 28.6147 63.3303 28.4776 63.3303 25.907C63.3303 24.2618 64.8384 23.4907 66.9805 23.4907C69.0884 23.4907 70.9564 23.6792 74.1267 24.5189V20.2689C71.4019 19.4977 69.4312 19.2235 66.8606 19.2235C62.2164 19.2235 58.292 21.0743 58.292 25.787C58.292 29.5058 60.1428 31.3909 63.8102 32.6419C67.0662 33.7558 70.7507 33.9786 70.7507 36.4978C70.7507 38.3829 68.917 39.1712 66.2779 39.1712C63.7073 39.1712 62.0964 38.9655 58.8232 38.0915V42.3587C61.5652 43.1813 63.8616 43.4041 66.535 43.4041C72.3616 43.4041 75.7719 40.8678 75.7719 36.155C75.7548 32.4191 73.3213 30.7397 70.5279 29.78Z" fill="#63666A"/>
                <path d="M96.799 19.603L88.436 43.0638H92.9774L98.2899 28.1544H98.3585V43.0638H103.037V19.603H96.799Z" fill="#63666A"/>
                <path d="M90.0643 34.2038L84.5975 19.603H78.2739V43.0466H82.901V28.1544H82.9695L87.6994 40.8016L90.0643 34.2038Z" fill="#63666A"/>
                <path d="M103.037 0.215576H38.2588V11.012H103.037V0.215576Z" fill="#009BDE"/>
                <path d="M8.43971 0.215576H0.213867V11.012H8.43971V0.215576Z" fill="#919093"/>
                <path d="M33.6315 0.215576H13.0669V11.012H33.6315V0.215576Z" fill="#3F9C35"/>
                <path d="M56.0644 27.1605C56.0644 24.6242 55.2075 22.5677 53.5623 21.2653C51.8829 19.9286 49.9293 19.603 47.0331 19.603H38.2417V43.0466H43.0058V23.8358H47.2044C48.3869 23.8358 49.2609 23.9901 49.8264 24.3328C50.6662 24.8298 51.1631 25.7381 51.1631 27.1776C51.1631 29.6282 49.6551 30.4851 47.6843 30.4851H44.5139V34.7351H46.4161L51.3859 43.0809H56.9041L51.3859 33.9468C54.5906 32.9871 56.0644 30.3137 56.0644 27.1605Z" fill="#63666A"/>
                <path d="M70.5279 29.78C67.1519 28.6147 63.3303 28.4776 63.3303 25.907C63.3303 24.2618 64.8384 23.4907 66.9805 23.4907C69.0884 23.4907 70.9564 23.6792 74.1267 24.5189V20.2689C71.4019 19.4977 69.4312 19.2235 66.8606 19.2235C62.2164 19.2235 58.292 21.0743 58.292 25.787C58.292 29.5058 60.1428 31.3909 63.8102 32.6419C67.0662 33.7558 70.7507 33.9786 70.7507 36.4978C70.7507 38.3829 68.917 39.1712 66.2779 39.1712C63.7073 39.1712 62.0964 38.9655 58.8232 38.0915V42.3587C61.5652 43.1813 63.8616 43.4041 66.535 43.4041C72.3616 43.4041 75.7719 40.8678 75.7719 36.155C75.7548 32.4191 73.3213 30.7397 70.5279 29.78Z" fill="#63666A"/>
                <path d="M96.799 19.603L88.436 43.0638H92.9774L98.2899 28.1544H98.3585V43.0638H103.037V19.603H96.799Z" fill="#63666A"/>
                <path d="M90.0643 34.2038L84.5975 19.603H78.2739V43.0466H82.901V28.1544H82.9695L87.6994 40.8016L90.0643 34.2038Z" fill="#63666A"/>
              </g>
              <defs>
                <clipPath id="clip0_1_9">
                  <rect width="103.139" height="43.6825" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <h1 class="header-title">RSM MENA Cyber Capability Map</h1>
          </div>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">Thank You for Your Submission</div>
            <div class="thank-you-icon">
              <div style="width: 80px; height: 80px; margin: 0 auto; background-color: #11A537; border-radius: 50%; display: inline-block; line-height: 80px; text-align: center;">
                <span style="color: white; font-size: 45px; font-weight: bold; vertical-align: middle;">✓</span>
              </div>
            </div>
            <h2 class="thank-you-title">Thank You!</h2>
            <div class="thank-you-message">
              <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
                Dear ${userName},
              </p>
              <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.8;">
                Thank you for submitting the form. We will get back to you soon.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>This email was automatically generated from the RSM MENA Cyber Security Capability Map form submission.</p>
            <p>&copy; 2025 RSM International Association. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
RSM MENA Cyber Capability Map

Thank You!

Dear ${userName},

Thank you for submitting the form. We will get back to you soon.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This email was automatically generated from the RSM MENA Cyber Security Capability Map form submission.
© 2025 RSM International Association. All rights reserved.
  `

  // Send email
  const info = await transporter.sendMail({
    from: fromEmail,
    to: contactEmail,
    subject: 'Thank You for Your Submission - RSM MENA Cyber Capability Map',
    text: textContent,
    html: htmlContent,
  })

  return info
}

