# Google API Setup Guide for MileIQ Migration Hub

## Prerequisites
- Google account with access to Google Analytics and Search Console for mileiq.com
- Administrator access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "MileIQ Migration Hub" and click "Create"
4. Wait for the project to be created and select it

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google Analytics Reporting API**
   - **Google Search Console API** (also called "Search Console API")
   - **PageSpeed Insights API**

## Step 3: Create API Credentials

### A. Create API Key (for PageSpeed Insights)
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "API Key"
3. Copy the API key and save it securely
4. Click "Restrict Key" and add these restrictions:
   - Application restrictions: HTTP referrers
   - Add your website URLs:
     - `http://localhost/*`
     - `https://yourdomain.com/*`
     - `https://jlcilliers.github.io/*` (if hosting on GitHub Pages)
   - API restrictions: Restrict to PageSpeed Insights API

### B. Create OAuth 2.0 Client ID (for Analytics & Search Console)
1. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
2. If prompted, configure OAuth consent screen first:
   - User Type: Internal (if using workspace) or External
   - App name: MileIQ Migration Hub
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes:
     - `../auth/analytics.readonly`
     - `../auth/webmasters.readonly`
3. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: MileIQ Migration Hub Web Client
   - Authorized JavaScript origins:
     - `http://localhost`
     - `http://localhost:5500` (if using Live Server)
     - `https://yourdomain.com`
     - `https://jlcilliers.github.io` (if using GitHub Pages)
   - Authorized redirect URIs: (same as origins)
4. Copy the Client ID

## Step 4: Get Google Analytics View ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your MileIQ property
3. Go to Admin (gear icon)
4. In the View column, click "View Settings"
5. Copy the "View ID" (it's a number like 123456789)

## Step 5: Configure the Dashboard

1. Open `api-config.js` in your code editor
2. Replace the placeholder values:

```javascript
const API_CONFIG = {
    CLIENT_ID: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
    API_KEY: 'YOUR_ACTUAL_API_KEY',
    GA_VIEW_ID: 'YOUR_VIEW_ID', // e.g., '123456789'
    SITE_URL: 'https://mileiq.com' // Your actual website
};
```

## Step 6: Test the Integration

1. Open `index.html` in a web browser
2. Look for the "Connect Google" button in the dashboard section
3. Click it and sign in with your Google account
4. Grant the necessary permissions
5. The dashboard should start displaying real data

## Troubleshooting

### Common Issues:

1. **"Failed to initialize Google API"**
   - Check that your API key and Client ID are correct
   - Ensure APIs are enabled in Google Cloud Console
   - Check browser console for detailed error messages

2. **"403 Forbidden" errors**
   - Verify the user has access to the Analytics/Search Console properties
   - Check API quotas haven't been exceeded
   - Ensure the correct scopes are configured

3. **"Origin not allowed"**
   - Add your current URL to Authorized JavaScript origins
   - Wait a few minutes for changes to propagate

4. **No data showing**
   - Verify GA View ID is correct
   - Check that the date range has data
   - Ensure the site URL matches exactly in Search Console

### Security Best Practices:

1. **Never commit API keys to public repositories**
   - Consider using environment variables
   - Use `.gitignore` to exclude `api-config.js`
   - Or use a separate config file not tracked by git

2. **Restrict API Keys**
   - Always add HTTP referrer restrictions
   - Limit to specific APIs only

3. **Monitor Usage**
   - Check Google Cloud Console for unusual activity
   - Set up billing alerts

## API Quotas

- **Analytics Reporting API**: 50,000 requests per day
- **Search Console API**: 200 requests per minute
- **PageSpeed Insights API**: 25,000 requests per day

For the dashboard's refresh rate (every 5 minutes), you'll use approximately:
- Analytics: 288 requests/day
- Search Console: 576 requests/day
- PageSpeed: 24 requests/day

## Next Steps

Once connected, the dashboard will:
- Display real-time organic traffic metrics
- Show current search performance
- Monitor Core Web Vitals
- Track top-performing keywords
- Update automatically every 5 minutes

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify all credentials are correctly entered
3. Ensure you have the necessary permissions
4. Review Google's API documentation for updates