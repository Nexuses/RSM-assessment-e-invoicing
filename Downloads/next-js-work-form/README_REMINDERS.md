# Automated Task Reminder System

This system automatically sends email reminders to employees and Slack messages (via email) to employees who haven't submitted their daily tasks.

## Setup

1. **Install Dependencies**
   ```bash
   npm install nodemailer @types/nodemailer
   ```

2. **Environment Variables**
   Add these to your `.env.local` file:
   ```
   FROM_EMAIL=attendance@nexuses.xyz
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=Abdjajidjaidiadoj
   SMTP_PASS=BHOh3WcvE9UKhAuB0XBO5yTDFqFTXYpLaZ3h8/Nj0Thy
   SMTP_SECURE=false
   
   # Slack Email Integration (sends email to Slack channel)
   SLACK_WEBHOOK_EMAIL=attendance-aaaasu7xaacfbshy7emt74hzzy@nexuses.slack.com
   
   CRON_SECRET=your-secret-key-here
   ```

## Reminder Schedule (Indian Time - IST)

- **7:00 PM**: First reminder email and Slack message (via email)
- **10:00 PM**: Second reminder email and Slack message (via email)
- **11:59 PM**: Final reminder email and Slack message (via email) (attendance will be marked as absent)

## How It Works

1. The system checks if today is a working day (not a holiday or weekend)
2. Finds all employees who haven't submitted tasks for today
3. Sends email reminders to those employees
4. Sends Slack messages via email to the Slack channel (using Slack's email integration)
5. Uses red-themed email templates (formal, no "warning" text)

## Slack Integration

The system uses Slack's email integration feature. Messages are sent as emails to the Slack channel email address, which automatically posts them to the channel. The `@username` format in messages will be converted to mentions by Slack.

## Cron Jobs

If deploying on Vercel, the `vercel.json` file is configured with cron jobs. For other platforms:

- Use a cron service (e.g., cron-job.org, EasyCron) to call:
  - `https://your-domain.com/api/reminders/7pm` at 7:00 PM IST
  - `https://your-domain.com/api/reminders/10pm` at 10:00 PM IST
  - `https://your-domain.com/api/reminders/11-59pm` at 11:59 PM IST

Add `Authorization: Bearer YOUR_CRON_SECRET` header to secure the endpoints.

## Manual Testing

You can manually trigger reminders by calling:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/reminders/7pm
```

