// Modern Google API Configuration using Google Identity Services (GIS)
// This replaces the deprecated gapi.auth2 library

const API_CONFIG = {
    // Your OAuth 2.0 Client ID
    CLIENT_ID: '668166969696-hr08cm473kkfqaen39d076pal3ls62so.apps.googleusercontent.com',
    
    // Your API Key
    API_KEY: 'AIzaSyC7KLfN6tu3u37BtcBJjnZi28xKz_Y1NJA',
    
    // GA4 Property ID
    GA4_PROPERTY_ID: '321430282',
    
    // Your website URL
    SITE_URL: 'https://mileiq.com',
    
    // Scopes needed for API access
    SCOPES: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly'
};

// Global variables
let tokenClient;
let accessToken = null;

// Initialize Google Identity Services
function initializeGoogleAuth() {
    // Load the GIS library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        // Initialize the token client
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: API_CONFIG.CLIENT_ID,
            scope: API_CONFIG.SCOPES,
            callback: (response) => {
                accessToken = response.access_token;
                console.log('Access token obtained');
                updateSigninStatus(true);
                fetchDashboardData();
            },
        });
        console.log('Google Identity Services initialized');
    };
    document.body.appendChild(script);
}

// Sign in function
function signInToGoogle() {
    tokenClient.requestAccessToken({prompt: 'consent'});
}

// Sign out function
function signOutFromGoogle() {
    accessToken = null;
    updateSigninStatus(false);
    google.accounts.oauth2.revoke(accessToken, () => {
        console.log('Access token revoked');
    });
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    const connectButton = document.getElementById('google-connect-btn');
    const disconnectButton = document.getElementById('google-disconnect-btn');
    const statusIndicator = document.getElementById('api-status');
    
    if (isSignedIn) {
        if (connectButton) connectButton.style.display = 'none';
        if (disconnectButton) disconnectButton.style.display = 'inline-flex';
        if (statusIndicator) {
            statusIndicator.textContent = 'Connected';
            statusIndicator.className = 'api-status connected';
        }
    } else {
        if (connectButton) connectButton.style.display = 'inline-flex';
        if (disconnectButton) disconnectButton.style.display = 'none';
        if (statusIndicator) {
            statusIndicator.textContent = 'Disconnected';
            statusIndicator.className = 'api-status disconnected';
        }
    }
}

// Fetch dashboard data using REST APIs with access token
async function fetchDashboardData() {
    if (!accessToken) {
        console.log('No access token available');
        return;
    }
    
    // Fetch Google Analytics data
    fetchGoogleAnalyticsData();
    
    // Fetch Search Console data
    fetchSearchConsoleData();
    
    // Fetch Core Web Vitals
    fetchCoreWebVitals();
}

// Fetch Google Analytics GA4 data using REST API
async function fetchGoogleAnalyticsData() {
    if (!accessToken) return;
    
    const propertyId = `properties/${API_CONFIG.GA4_PROPERTY_ID}`;
    const url = `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`;
    
    const requestBody = {
        dateRanges: [{
            startDate: '30daysAgo',
            endDate: 'today'
        }],
        metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' }
        ]
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.rows && data.rows.length > 0) {
                const metrics = data.rows[0].metricValues;
                
                updateMetric('ga-traffic', formatNumber(metrics[0].value));
                updateMetric('ga-bounce', (parseFloat(metrics[2].value * 100).toFixed(1)) + '%');
                updateMetric('ga-session', formatDuration(metrics[3].value));
                updateMetric('ga-conversions', formatNumber(metrics[4]?.value || '0'));
                
                console.log('Google Analytics data updated');
            }
        } else {
            console.error('GA4 API error:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching Google Analytics data:', error);
    }
}

// Fetch Search Console data using REST API
async function fetchSearchConsoleData() {
    if (!accessToken) return;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(API_CONFIG.SITE_URL)}/searchAnalytics/query`;
    
    const requestBody = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['date'],
        aggregationType: 'byProperty'
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.rows) {
                let totalImpressions = 0;
                let totalClicks = 0;
                let totalPosition = 0;
                let count = 0;
                
                data.rows.forEach(row => {
                    totalImpressions += row.impressions;
                    totalClicks += row.clicks;
                    totalPosition += row.position;
                    count++;
                });
                
                const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
                const avgPosition = count > 0 ? (totalPosition / count) : 0;
                
                updateMetric('gsc-impressions', formatNumber(totalImpressions));
                updateMetric('gsc-clicks', formatNumber(totalClicks));
                updateMetric('gsc-ctr', avgCtr.toFixed(1) + '%');
                updateMetric('gsc-position', avgPosition.toFixed(1));
                
                console.log('Search Console data updated');
            }
        } else {
            console.error('Search Console API error:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching Search Console data:', error);
    }
}

// Fetch Core Web Vitals using PageSpeed Insights API
async function fetchCoreWebVitals() {
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(API_CONFIG.SITE_URL)}&key=${API_CONFIG.API_KEY}&category=performance`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.lighthouseResult) {
            const metrics = data.lighthouseResult.audits;
            
            if (metrics['largest-contentful-paint']) {
                updateMetric('cwv-lcp', (metrics['largest-contentful-paint'].numericValue / 1000).toFixed(1) + 's');
            }
            if (metrics['total-blocking-time']) {
                updateMetric('cwv-fid', Math.round(metrics['total-blocking-time'].numericValue) + 'ms');
            }
            if (metrics['cumulative-layout-shift']) {
                updateMetric('cwv-cls', metrics['cumulative-layout-shift'].displayValue);
            }
            
            const score = Math.round(data.lighthouseResult.categories.performance.score * 100);
            updateMetric('cwv-score', score + '/100');
            
            console.log('Core Web Vitals updated');
        }
    } catch (error) {
        console.error('Error fetching Core Web Vitals:', error);
    }
}

// Utility functions
function updateMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function formatNumber(num) {
    return parseInt(num).toLocaleString();
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing new Google Identity Services...');
    initializeGoogleAuth();
    
    // Also fetch Core Web Vitals (doesn't require auth)
    fetchCoreWebVitals();
    setInterval(fetchCoreWebVitals, 3600000); // Update every hour
});

// Export functions for global use
window.signInToGoogle = signInToGoogle;
window.signOutFromGoogle = signOutFromGoogle;
window.refreshDashboard = function() {
    if (accessToken) {
        fetchDashboardData();
    } else {
        console.log('Not authenticated - using mock data');
        if (typeof initializeDashboard === 'function') {
            initializeDashboard();
        }
    }
    if (typeof updateLastUpdated === 'function') {
        updateLastUpdated();
    }
};