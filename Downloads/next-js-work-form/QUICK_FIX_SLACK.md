# Quick Fix: Slack Bot Token Issue

## Problem
You're getting "404 no_team" error because:
1. The token you have starts with `xoxe.xoxp-` which is **NOT a bot token**
2. Bot tokens must start with `xoxb-`

## Solution: Get the Correct Bot Token

### Step-by-Step:

1. **Go to Slack API Apps**
   - Visit: https://api.slack.com/apps
   - Sign in with your workspace

2. **Select Your App**
   - Click on your app (or create a new one if needed)

3. **Go to OAuth & Permissions**
   - In the left sidebar, click **"OAuth & Permissions"**

4. **Find the Bot Token**
   - Scroll down to **"OAuth Tokens for Your Workspace"** section
   - Look for **"Bot User OAuth Token"** (NOT "User OAuth Token")
   - The token should start with `xoxb-`
   - Example: `xoxb-1234567890-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx`

5. **Copy the Correct Token**
   - Click the **"Copy"** button next to "Bot User OAuth Token"
   - ⚠️ Make sure it starts with `xoxb-`

6. **Update .env.local**
   - Open your `.env.local` file
   - Replace the current token with:
     ```
     SLACK_BOT_TOKEN=xoxb-your-actual-bot-token-here
     SLACK_CHANNEL_ID=C0A7J6SSR08
     ```
   - Make sure to remove any old `SLACK_WEBHOOK_URL` if it's invalid

7. **Restart Your Server**
   - Stop the server (Ctrl+C)
   - Start again: `npm run dev`

8. **Test Again**
   - Go to employee dashboard
   - Click "Send Test Slack" button

## Token Types Explained

- ✅ **Bot Token** (`xoxb-...`) - This is what you need! Used for bot actions
- ❌ **User Token** (`xoxp-...`) - For user actions, not what you need
- ❌ **OAuth Token** (`xoxe-...`) - For OAuth flows, not what you need

## If You Don't Have a Bot Token Yet

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to **"OAuth & Permissions"**
4. Add scopes: `chat:write`, `chat:write.public`
5. Click **"Install to Workspace"**
6. After installation, you'll see the **"Bot User OAuth Token"** (starts with `xoxb-`)
7. Copy that token

## Still Having Issues?

Check:
- ✅ Token starts with `xoxb-` (not `xoxp-` or `xoxe-`)
- ✅ Bot has `chat:write` scope
- ✅ Bot is installed to your workspace
- ✅ Channel ID is correct (`C0A7J6SSR08`)
- ✅ Server was restarted after updating `.env.local`

