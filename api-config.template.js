// Google API Configuration Template for MileIQ Migration Hub
// IMPORTANT: Copy this file to 'api-config.js' and fill in your actual credentials
// Never commit the actual api-config.js file with real credentials to version control

// Configuration object - Replace with your actual credentials
const API_CONFIG = {
    // Google Cloud Project credentials
    // Get from: https://console.cloud.google.com/apis/credentials
    CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // OAuth 2.0 Client ID
    API_KEY: 'YOUR_API_KEY', // API Key for PageSpeed Insights
    
    // Scopes for API access (DO NOT CHANGE)
    SCOPES: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'
    ],
    
    // Discovery docs for APIs (DO NOT CHANGE)
    DISCOVERY_DOCS: [
        'https://analyticsreporting.googleapis.com/$discovery/rest?version=v4',
        'https://www.googleapis.com/discovery/v1/apis/searchconsole/v1/rest'
    ],
    
    // Your Google Analytics View ID
    // Find in Google Analytics: Admin → View Settings → View ID
    GA_VIEW_ID: 'YOUR_VIEW_ID', // e.g., '123456789'
    
    // Your website URL for Search Console
    // Must match exactly as it appears in Search Console
    SITE_URL: 'https://mileiq.com' // Include https:// or http://
};

// The rest of the code from api-config.js should be copied here as well
// This template only shows the configuration section that needs to be customized