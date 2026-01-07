// Slack User ID mapping
// To get Slack user IDs:
// 1. Go to Slack workspace
// 2. Click on user profile
// 3. Click "More" -> "Copy member ID"
// Or use Slack API: https://api.slack.com/methods/users.lookupByEmail

export const emailToSlackUserId: Record<string, string> = {
  // Add mappings here as: 'email@nexuses.in': 'U12345678'
  // Example:
  // 'arpit.m@nexuses.in': 'U12345678',
  // 'neeraj@nexuses.in': 'U87654321',
}

