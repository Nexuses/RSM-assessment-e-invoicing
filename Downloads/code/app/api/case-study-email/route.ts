import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim()
    const phone = String(body.phone || '').trim()
    const caseStudy = String(body.caseStudy || '').trim()
    const pdfUrl = String(body.pdfUrl || '').trim()

    if (!fullName || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const secure = String(process.env.SMTP_SECURE || 'false') === 'true'
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const fromEmail = process.env.FROM_EMAIL
    const toEmail = process.env.TO_EMAIL

    if (!host || !user || !pass || !fromEmail || !toEmail) {
      return new Response(JSON.stringify({ error: 'Server email is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })

    const subject = 'Case Study Download User details'

    const html = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:24px;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td></td>
          <td style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #eee;">
            <div style="background:#e31e24;color:#ffffff;padding:16px 20px;font-size:18px;font-weight:bold;">Case Study Download User details</div>
            <div style="padding:20px;font-size:14px;color:#222;">
              <p style="margin:0;">You received a new case study download submission. Details below:</p>

              <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
                ${caseStudy ? `<tr>
                  <td style=\"padding:8px 0;color:#666;width:160px;\">Case Study</td>
                  <td style=\"padding:8px 0;color:#111;font-weight:600;\">${escapeHtml(caseStudy)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:8px 0;color:#666;width:160px;">Full Name</td>
                  <td style="padding:8px 0;color:#111;font-weight:600;">${escapeHtml(fullName)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#666;width:160px;">Email</td>
                  <td style="padding:8px 0;color:#111;font-weight:600;">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#666;width:160px;">Phone</td>
                  <td style="padding:8px 0;color:#111;font-weight:600;">${escapeHtml(phone)}</td>
                </tr>
              </table>

              ${pdfUrl ? `<div style=\"margin:0;\">\
                <a href=\"${pdfUrl}\" style=\"display:inline-block;background:#e31e24;color:#fff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:600;\" target=\"_blank\" rel=\"noopener\">Download PDF</a>\
              </div>` : ''}

              <p style="margin:0;color:#666;">Sent automatically by the website form.</p>
            </div>
          </td>
          <td></td>
        </tr>
      </table>
    `

    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject,
      html,
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to send' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}


