// Modern Google API Configuration using Google Identity Services (GIS)
// Fixed version with proper OAuth implementation

const API_CONFIG = {
    // OAuth 2.0 Client ID
    CLIENT_ID: '668166969696-hr08cm473kkfqaen39d076pal3ls62so.apps.googleusercontent.com',
    
    // API Key
    API_KEY: 'AIzaSyC7KLfN6tu3u37BtcBJjnZi28xKz_Y1NJA',
    
    // GA4 Property ID
    GA4_PROPERTY_ID: '321430282',
    
    // Website URL
    SITE_URL: 'https://mileiq.com',
    
    // Scopes needed
    SCOPES: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly'
};

// Global variables
let tokenClient;
let accessToken = null;
let gapiInited = false;
let gisInited = false;

// Load the GIS script dynamically
function loadGISScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.google && window.google.accounts) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize Google Identity Services
async function initializeGoogleAuth() {
    try {
        console.log('Loading Google Identity Services...');
        await loadGISScript();
        
        // Initialize the token client with proper error handling
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: API_CONFIG.CLIENT_ID,
                scope: API_CONFIG.SCOPES,
                callback: (response) => {
                    if (response.error) {
                        console.error('OAuth error:', response);
                        updateSigninStatus(false);
                        return;
                    }
                    accessToken = response.access_token;
                    console.log('Access token obtained successfully');
                    updateSigninStatus(true);
                    fetchDashboardData();
                },
                error_callback: (error) => {
                    console.error('Token client error:', error);
                    updateSigninStatus(false);
                }
            });
            
            gisInited = true;
            console.log('Google Identity Services initialized successfully');
            
            // Check if user has existing session
            checkExistingSession();
        } else {
            throw new Error('Google Identity Services failed to load properly');
        }
    } catch (error) {
        console.error('Failed to initialize Google Identity Services:', error);
        // Fallback to mock data
        updateSigninStatus(false);
        if (typeof initializeDashboard === 'function') {
            initializeDashboard();
        }
    }
}

// Check for existing session
function checkExistingSession() {
    // Check if we have a stored token (you might want to use sessionStorage)
    const storedToken = sessionStorage.getItem('google_access_token');
    if (storedToken) {
        accessToken = storedToken;
        validateToken();
    }
}

// Validate stored token
async function validateToken() {
    if (!accessToken) return;
    
    try {
        // Test the token with a simple API call
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
        if (response.ok) {
            const data = await response.json();
            if (data.expires_in > 0) {
                console.log('Existing token is valid');
                updateSigninStatus(true);
                fetchDashboardData();
                return;
            }
        }
        // Token is invalid
        sessionStorage.removeItem('google_access_token');
        accessToken = null;
        updateSigninStatus(false);
    } catch (error) {
        console.error('Token validation failed:', error);
        sessionStorage.removeItem('google_access_token');
        accessToken = null;
        updateSigninStatus(false);
    }
}

// Sign in function with error handling
function signInToGoogle() {
    if (!tokenClient) {
        console.error('Token client not initialized');
        alert('Authentication system is not ready. Please refresh the page and try again.');
        return;
    }
    
    try {
        // Request access token with consent prompt
        tokenClient.requestAccessToken({
            prompt: 'consent',
            hint: '', // You can add user email here if known
        });
    } catch (error) {
        console.error('Sign in failed:', error);
        alert('Sign in failed. Please try again.');
    }
}

// Sign out function
function signOutFromGoogle() {
    if (accessToken) {
        // Revoke the token
        google.accounts.oauth2.revoke(accessToken, () => {
            console.log('Access token revoked');
        });
    }
    
    accessToken = null;
    sessionStorage.removeItem('google_access_token');
    updateSigninStatus(false);
    
    // Reset to mock data
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    const connectButton = document.getElementById('google-connect-btn');
    const disconnectButton = document.getElementById('google-disconnect-btn');
    const statusIndicator = document.getElementById('api-status');
    
    if (isSignedIn && accessToken) {
        // Store token for session persistence
        sessionStorage.setItem('google_access_token', accessToken);
        
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

// Fetch dashboard data using REST APIs
async function fetchDashboardData() {
    if (!accessToken) {
        console.log('No access token available');
        return;
    }
    
    console.log('Fetching dashboard data...');
    
    // Fetch all data sources
    Promise.all([
        fetchGoogleAnalyticsData(),
        fetchSearchConsoleData(),
        fetchCoreWebVitals()
    ]).then(() => {
        console.log('All dashboard data fetched successfully');
        if (typeof updateLastUpdated === 'function') {
            updateLastUpdated();
        }
    }).catch(error => {
        console.error('Error fetching dashboard data:', error);
    });
}

// Fetch Google Analytics GA4 data
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
        ],
        dimensions: [{ name: 'date' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
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
            processAnalyticsData(data);
        } else {
            const errorText = await response.text();
            console.error('GA4 API error:', response.status, errorText);
            
            // Check for specific errors
            if (response.status === 403) {
                console.error('Permission denied. Make sure the GA4 property ID is correct and you have access.');
            } else if (response.status === 401) {
                console.error('Authentication failed. Token may have expired.');
                // Try to refresh token
                signInToGoogle();
            }
        }
    } catch (error) {
        console.error('Error fetching Google Analytics data:', error);
    }
}

// Process Analytics data
function processAnalyticsData(data) {
    if (!data.rows || data.rows.length === 0) {
        console.log('No Analytics data available');
        return;
    }
    
    // Calculate totals
    let totalSessions = 0;
    let totalUsers = 0;
    let totalBounceRate = 0;
    let totalDuration = 0;
    let totalConversions = 0;
    let dataPoints = data.rows.length;
    
    data.rows.forEach(row => {
        const metrics = row.metricValues;
        totalSessions += parseInt(metrics[0].value || 0);
        totalUsers += parseInt(metrics[1].value || 0);
        totalBounceRate += parseFloat(metrics[2].value || 0);
        totalDuration += parseFloat(metrics[3].value || 0);
        totalConversions += parseInt(metrics[4]?.value || 0);
    });
    
    // Update UI
    updateMetric('ga-traffic', formatNumber(totalSessions));
    updateMetric('ga-bounce', (totalBounceRate / dataPoints * 100).toFixed(1) + '%');
    updateMetric('ga-session', formatDuration(totalDuration / dataPoints));
    updateMetric('ga-conversions', formatNumber(totalConversions));
    
    console.log('Google Analytics data updated');
}

// Fetch Search Console data
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
        rowLimit: 30,
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
            processSearchConsoleData(data);
        } else {
            const errorText = await response.text();
            console.error('Search Console API error:', response.status, errorText);
            
            if (response.status === 403) {
                console.error('Permission denied. Make sure the site URL is correct and you have verified ownership.');
            }
        }
    } catch (error) {
        console.error('Error fetching Search Console data:', error);
    }
}

// Process Search Console data
function processSearchConsoleData(data) {
    if (!data.rows || data.rows.length === 0) {
        console.log('No Search Console data available');
        return;
    }
    
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalPosition = 0;
    let count = 0;
    
    data.rows.forEach(row => {
        totalImpressions += row.impressions || 0;
        totalClicks += row.clicks || 0;
        totalPosition += row.position || 0;
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

// Fetch Core Web Vitals using PageSpeed Insights API
async function fetchCoreWebVitals() {
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(API_CONFIG.SITE_URL)}&key=${API_CONFIG.API_KEY}&category=performance&strategy=mobile`;
    
    try {
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            processCoreWebVitals(data);
        } else {
            console.error('PageSpeed API error:', response.status);
        }
    } catch (error) {
        console.error('Error fetching Core Web Vitals:', error);
    }
}

// Process Core Web Vitals data
function processCoreWebVitals(data) {
    if (!data.lighthouseResult) {
        console.log('No Core Web Vitals data available');
        return;
    }
    
    const metrics = data.lighthouseResult.audits;
    
    // LCP (Largest Contentful Paint)
    if (metrics['largest-contentful-paint']) {
        const lcp = (metrics['largest-contentful-paint'].numericValue / 1000).toFixed(1);
        updateMetric('cwv-lcp', lcp + 's');
    }
    
    // FID (First Input Delay) - using Total Blocking Time as proxy
    if (metrics['total-blocking-time']) {
        const tbt = Math.round(metrics['total-blocking-time'].numericValue);
        updateMetric('cwv-fid', tbt + 'ms');
    }
    
    // CLS (Cumulative Layout Shift)
    if (metrics['cumulative-layout-shift']) {
        const cls = metrics['cumulative-layout-shift'].displayValue || '0';
        updateMetric('cwv-cls', cls);
    }
    
    // Overall performance score
    if (data.lighthouseResult.categories.performance) {
        const score = Math.round(data.lighthouseResult.categories.performance.score * 100);
        updateMetric('cwv-score', score + '/100');
    }
    
    console.log('Core Web Vitals updated');
}

// Utility functions
function updateMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        // Add animation class
        element.classList.add('metric-updated');
        setTimeout(() => {
            element.classList.remove('metric-updated');
        }, 1000);
    }
}

function formatNumber(num) {
    const number = parseInt(num) || 0;
    return number.toLocaleString();
}

function formatDuration(seconds) {
    const totalSeconds = Math.floor(seconds) || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Google Identity Services...');
    
    // Initialize authentication
    initializeGoogleAuth();
    
    // Fetch Core Web Vitals (doesn't require auth)
    fetchCoreWebVitals();
    
    // Set up periodic refresh for Core Web Vitals
    setInterval(fetchCoreWebVitals, 3600000); // Update every hour
    
    // Initialize mock data if available
    if (typeof initializeDashboard === 'function') {
        setTimeout(() => {
            if (!accessToken) {
                console.log('No authentication, using mock data');
                initializeDashboard();
            }
        }, 2000);
    }
});

// Export functions for global use
window.signInToGoogle = signInToGoogle;
window.signOutFromGoogle = signOutFromGoogle;
window.refreshDashboard = function() {
    if (accessToken) {
        console.log('Refreshing dashboard with live data...');
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

// Handle page visibility changes to refresh token if needed
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && accessToken) {
        // Validate token when page becomes visible
        validateToken();
    }
});

console.log('api-config-fixed.js loaded successfully');