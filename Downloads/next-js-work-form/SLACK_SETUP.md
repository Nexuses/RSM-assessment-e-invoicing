# Slack Integration Setup Guide

This guide will help you set up Slack integration for the task reminder system. You can use either **Incoming Webhooks** (recommended) or **Bot Token** (more flexible).

## Method 1: Incoming Webhook (Recommended - Easier)

### Step-by-Step Instructions:

1. **Go to Slack API Apps**
   - Visit: https://api.slack.com/apps
   - Sign in with your Slack workspace

2. **Create a New App**
   - Click **"Create New App"** button
   - Select **"From scratch"**
   - Enter app name: `Task Reminder Bot` (or any name you prefer)
   - Select your workspace
   - Click **"Create App"**

3. **Enable Incoming Webhooks**
   - In the left sidebar, click **"Incoming Webhooks"**
   - Toggle **"Activate Incoming Webhooks"** to **ON**

4. **Add Webhook to Workspace**
   - Scroll down to **"Webhook URLs for Your Workspace"**
   - Click **"Add New Webhook to Workspace"**
   - Select the channel where you want reminders (e.g., `#attendance`)
   - Click **"Allow"**

5. **Copy the Webhook URL**
   - You'll see a webhook URL that looks like:
     ```
     https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
     ```
   - Click **"Copy"** to copy the URL

6. **Add to Environment Variables**
   - Open your `.env.local` file
   - Add:
     ```
     SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/ACTUAL/WEBHOOK/URL
     SLACK_CHANNEL_ID=C0A7J6SSR08
     ```
   - Replace with your actual webhook URL

7. **Restart Your Server**
   - Stop your development server (Ctrl+C)
   - Start it again: `npm run dev`

**✅ Done!** The webhook is pre-configured for your selected channel, so messages will automatically go there.

---

## Method 2: Bot Token (Alternative - More Flexible)

### Step-by-Step Instructions:

1. **Go to Slack API Apps**
   - Visit: https://api.slack.com/apps
   - Sign in with your Slack workspace

2. **Create or Select App**
   - Create a new app (same as Method 1, steps 1-2)
   - OR select an existing app

3. **Configure OAuth & Permissions**
   - In the left sidebar, click **"OAuth & Permissions"**
   - Scroll down to **"Scopes"** section
   - Under **"Bot Token Scopes"**, click **"Add an OAuth Scope"**
   - Add these scopes:
     - `chat:write` - Send messages as the bot
     - `chat:write.public` - Send messages to public channels
     - `users:read` - Read user information (optional, helps with tagging)

4. **Install App to Workspace**
   - Scroll up to **"OAuth Tokens for Your Workspace"**
   - Click **"Install to Workspace"** button
   - Review the permissions
   - Click **"Allow"**

5. **Copy Bot Token** ⚠️ IMPORTANT
   - After installation, you'll see **"Bot User OAuth Token"** section
   - The token MUST start with `xoxb-` (not `xoxp-` or `xoxe-`)
   - It will look like: `xoxb-1234567890-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx`
   - Click **"Copy"** to copy the token
   - ⚠️ **DO NOT** copy the "User OAuth Token" (starts with `xoxp-`) or "OAuth Access Token" (starts with `xoxe-`)
   - ⚠️ You need the **"Bot User OAuth Token"** which starts with `xoxb-`

6. **Get Channel ID**
   - In Slack, right-click on your channel (e.g., `#attendance`)
   - Click **"View channel details"** (or **"Open channel details"**)
   - Scroll down to find **"Channel ID"** (starts with `C`)
   - OR use the channel ID you already have: `C0A7J6SSR08`

7. **Add to Environment Variables**
   - Open your `.env.local` file
   - Add:
     ```
     SLACK_BOT_TOKEN=xoxb-your-actual-bot-token-here
     SLACK_CHANNEL_ID=C0A7J6SSR08
     ```
   - Replace with your actual bot token

8. **Restart Your Server**
   - Stop your development server (Ctrl+C)
   - Start it again: `npm run dev`

**✅ Done!** The bot can now send messages to any channel you specify.

---

## Which Method Should You Use?

### Use **Incoming Webhook (Method 1)** if:
- ✅ You only need to send messages to one channel
- ✅ You want the simplest setup
- ✅ You don't need advanced features

### Use **Bot Token (Method 2)** if:
- ✅ You need to send messages to multiple channels
- ✅ You want more control over message formatting
- ✅ You need to interact with Slack API features

---

## Testing Your Setup

1. Go to any employee dashboard in the admin panel
2. Click **"Send Test Slack"** button
3. Check your Slack channel - you should see a message with the employee tagged

## Troubleshooting

### "Failed to send Slack message" Error

1. **Check Environment Variables**
   - Make sure `SLACK_WEBHOOK_URL` or `SLACK_BOT_TOKEN` is set
   - Restart your server after adding environment variables

2. **Verify Webhook URL Format**
   - Should start with: `https://hooks.slack.com/services/`
   - Should have 3 parts separated by `/`

3. **Check Bot Permissions** (for Bot Token method)
   - Make sure bot has `chat:write` scope
   - Make sure bot is installed to your workspace

4. **Check Channel ID** (for Bot Token method)
   - Make sure the channel ID is correct
   - The bot must be a member of the channel

5. **Check Server Logs**
   - Look for error messages in your terminal/console
   - Common errors will be logged there

---

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Check your server logs
3. Verify your Slack app is properly configured
4. Make sure you've restarted your server after adding environment variables

