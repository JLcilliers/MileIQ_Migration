// Google API Configuration for MileIQ Migration Hub
// This file handles the integration with Google Analytics and Search Console APIs

// Configuration object - MileIQ Google API Credentials
const API_CONFIG = {
    // Google Cloud Project credentials
    CLIENT_ID: '668166969696-hr08cm473kkfqaen39d076pal3ls62so.apps.googleusercontent.com', // OAuth 2.0 Client ID
    API_KEY: 'AIzaSyC7KLfN6tu3u37BtcBJjnZi28xKz_Y1NJA', // API Key for PageSpeed Insights and other APIs
    
    // Scopes for API access
    SCOPES: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'
    ],
    
    // Discovery docs for APIs
    DISCOVERY_DOCS: [
        'https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta',
        'https://www.googleapis.com/discovery/v1/apis/webmasters/v3/rest'
    ],
    
    // GA4 Property ID
    GA4_PROPERTY_ID: '321430282', // GA4 Property ID for MileIQ
    
    // Your website URL for Search Console
    SITE_URL: 'https://mileiq.com' // MileIQ website URL
};

// Google API loader
let gapiLoaded = false;
let authInstance = null;

// Load the Google API client library
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi.load('client:auth2', () => {
                initializeGoogleAPI().then(resolve).catch(reject);
            });
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Initialize Google API client
async function initializeGoogleAPI() {
    try {
        await gapi.client.init({
            apiKey: API_CONFIG.API_KEY,
            clientId: API_CONFIG.CLIENT_ID,
            scope: API_CONFIG.SCOPES.join(' '),
            plugin_name: 'MileIQ Migration Hub' // Add this for new Google requirements
        });
        
        // Initialize auth2 after client
        await gapi.auth2.init({
            client_id: API_CONFIG.CLIENT_ID,
            scope: API_CONFIG.SCOPES.join(' ')
        });
        
        authInstance = gapi.auth2.getAuthInstance();
        gapiLoaded = true;
        
        // Listen for sign-in state changes
        authInstance.isSignedIn.listen(updateSigninStatus);
        
        // Handle initial sign-in state
        updateSigninStatus(authInstance.isSignedIn.get());
        
        console.log('Google API initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Google API:', error);
        console.error('Error details:', error.details || error.error || error);
        showNotification('Failed to initialize Google API. Check console for details.', 'error');
        return false;
    }
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
        
        // Start fetching data
        fetchGoogleAnalyticsData();
        fetchSearchConsoleData();
        
        // Set up automatic refresh
        setInterval(() => {
            fetchGoogleAnalyticsData();
            fetchSearchConsoleData();
        }, 300000); // Refresh every 5 minutes
        
    } else {
        if (connectButton) connectButton.style.display = 'inline-flex';
        if (disconnectButton) disconnectButton.style.display = 'none';
        if (statusIndicator) {
            statusIndicator.textContent = 'Disconnected';
            statusIndicator.className = 'api-status disconnected';
        }
    }
}

// Sign in to Google
function signInToGoogle() {
    if (authInstance) {
        authInstance.signIn().then(() => {
            showNotification('Successfully connected to Google APIs!', 'success');
        }).catch(error => {
            console.error('Sign-in error:', error);
            showNotification('Failed to sign in. Please try again.', 'error');
        });
    }
}

// Sign out from Google
function signOutFromGoogle() {
    if (authInstance) {
        authInstance.signOut().then(() => {
            showNotification('Disconnected from Google APIs', 'info');
        });
    }
}

// Fetch Google Analytics data (GA4)
async function fetchGoogleAnalyticsData() {
    if (!authInstance || !authInstance.isSignedIn.get()) {
        console.log('Not signed in to Google');
        return;
    }
    
    try {
        // First, try to load the client library properly
        await gapi.client.load('analyticsdata', 'v1beta');
        
        const response = await gapi.client.analyticsdata.properties.runReport({
            property: 'properties/321430282', // Your GA4 property ID from the file
            requestBody: {
                dateRanges: [{
                    startDate: '30daysAgo',
                    endDate: 'today'
                }],
                dimensions: [
                    { name: 'sessionDefaultChannelGroup' }
                ],
                metrics: [
                    { name: 'sessions' },
                    { name: 'totalUsers' },
                    { name: 'bounceRate' },
                    { name: 'averageSessionDuration' },
                    { name: 'conversions' }
                ],
                dimensionFilter: {
                    filter: {
                        fieldName: 'sessionDefaultChannelGroup',
                        stringFilter: {
                            value: 'Organic Search'
                        }
                    }
                }
            }
        });
        
        if (response.result.rows && response.result.rows.length > 0) {
            const row = response.result.rows[0];
            const metrics = row.metricValues;
            
            // Update dashboard with real data
            updateMetric('ga-traffic', formatNumber(metrics[0].value)); // Sessions
            updateMetric('ga-bounce', (parseFloat(metrics[2].value * 100).toFixed(1)) + '%');
            updateMetric('ga-session', formatDuration(metrics[3].value));
            updateMetric('ga-conversions', formatNumber(metrics[4].value || '0'));
            
            // Store data in localStorage
            const gaData = {
                traffic: metrics[0].value,
                bounceRate: metrics[2].value,
                avgSession: metrics[3].value,
                conversions: metrics[4].value || '0',
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('mileiq_ga_data', JSON.stringify(gaData));
            
            console.log('Google Analytics data updated successfully');
        }
        
    } catch (error) {
        console.error('Error fetching Google Analytics data:', error);
        showNotification('Failed to fetch Analytics data', 'error');
    }
}

// Fetch Google Search Console data
async function fetchSearchConsoleData() {
    if (!authInstance || !authInstance.isSignedIn.get()) {
        console.log('Not signed in to Google');
        return;
    }
    
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const response = await gapi.client.webmasters.searchanalytics.query({
            siteUrl: API_CONFIG.SITE_URL,
            resource: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['date'],
                aggregationType: 'byProperty'
            }
        });
        
        if (response.result.rows) {
            // Calculate totals
            let totalImpressions = 0;
            let totalClicks = 0;
            let totalPosition = 0;
            let count = 0;
            
            response.result.rows.forEach(row => {
                totalImpressions += row.impressions;
                totalClicks += row.clicks;
                totalPosition += row.position;
                count++;
            });
            
            const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
            const avgPosition = count > 0 ? (totalPosition / count) : 0;
            
            // Update dashboard
            updateMetric('gsc-impressions', formatNumber(totalImpressions));
            updateMetric('gsc-clicks', formatNumber(totalClicks));
            updateMetric('gsc-ctr', avgCtr.toFixed(1) + '%');
            updateMetric('gsc-position', avgPosition.toFixed(1));
            
            // Store data
            const gscData = {
                impressions: totalImpressions,
                clicks: totalClicks,
                ctr: avgCtr,
                position: avgPosition,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('mileiq_gsc_data', JSON.stringify(gscData));
        }
        
        // Fetch top keywords
        await fetchTopKeywords();
        
    } catch (error) {
        console.error('Error fetching Search Console data:', error);
        showNotification('Failed to fetch Search Console data', 'error');
    }
}

// Fetch top performing keywords
async function fetchTopKeywords() {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const response = await gapi.client.webmasters.searchanalytics.query({
            siteUrl: API_CONFIG.SITE_URL,
            resource: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['query'],
                rowLimit: 10,
                aggregationType: 'byProperty'
            }
        });
        
        if (response.result.rows) {
            const rankingsContainer = document.getElementById('top-rankings');
            if (rankingsContainer) {
                rankingsContainer.innerHTML = '';
                
                response.result.rows.slice(0, 4).forEach(row => {
                    const rankingItem = document.createElement('div');
                    rankingItem.className = 'ranking-item';
                    rankingItem.innerHTML = `
                        <span class="keyword">${row.keys[0]}</span>
                        <span class="position">#${Math.round(row.position)}</span>
                    `;
                    rankingsContainer.appendChild(rankingItem);
                });
            }
        }
        
    } catch (error) {
        console.error('Error fetching top keywords:', error);
    }
}

// Fetch Core Web Vitals from PageSpeed Insights API
async function fetchCoreWebVitals() {
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(API_CONFIG.SITE_URL)}&key=${API_CONFIG.API_KEY}&category=performance`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.lighthouseResult) {
            const metrics = data.lighthouseResult.audits;
            
            // Update Core Web Vitals
            if (metrics['largest-contentful-paint']) {
                updateMetric('cwv-lcp', (metrics['largest-contentful-paint'].numericValue / 1000).toFixed(1) + 's');
            }
            if (metrics['first-input-delay']) {
                updateMetric('cwv-fid', Math.round(metrics['first-input-delay'].numericValue) + 'ms');
            }
            if (metrics['cumulative-layout-shift']) {
                updateMetric('cwv-cls', metrics['cumulative-layout-shift'].displayValue);
            }
            
            // Overall score
            const score = Math.round(data.lighthouseResult.categories.performance.score * 100);
            updateMetric('cwv-score', score + '/100');
            
            // Update status indicators based on score
            updateWebVitalsStatus(score);
        }
        
    } catch (error) {
        console.error('Error fetching Core Web Vitals:', error);
        showNotification('Failed to fetch Core Web Vitals', 'error');
    }
}

// Update Web Vitals status indicator
function updateWebVitalsStatus(score) {
    const statusElement = document.getElementById('vitals-status');
    if (statusElement) {
        const badge = statusElement.querySelector('.status-badge');
        if (badge) {
            if (score >= 90) {
                badge.className = 'status-badge success';
                badge.textContent = 'Good';
            } else if (score >= 50) {
                badge.className = 'status-badge warning';
                badge.textContent = 'Needs Improvement';
            } else {
                badge.className = 'status-badge danger';
                badge.textContent = 'Poor';
            }
        }
    }
}

// Utility functions
function formatNumber(num) {
    return parseInt(num).toLocaleString();
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Initialize API on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add connect button to dashboard if not exists
    addApiControlButtons();
    
    // Google API credentials are now configured - proceed with initialization
    console.log('Google API credentials configured, initializing...');
    
    // Load Google API
    loadGoogleAPI().then(() => {
        console.log('Google API loaded successfully');
    }).catch(error => {
        console.error('Failed to load Google API:', error);
    });
    
    // Also fetch Core Web Vitals (doesn't require auth)
    fetchCoreWebVitals();
    setInterval(fetchCoreWebVitals, 3600000); // Update every hour
});

// Add API control buttons to the dashboard
function addApiControlButtons() {
    const dashboardSection = document.querySelector('.dashboard-section .container h2');
    if (dashboardSection && !document.getElementById('api-controls')) {
        const apiControls = document.createElement('div');
        apiControls.id = 'api-controls';
        apiControls.style.cssText = 'float: right; display: flex; align-items: center; gap: 1rem;';
        apiControls.innerHTML = `
            <span id="api-status" class="api-status disconnected">Disconnected</span>
            <button id="google-connect-btn" class="btn-connect" onclick="signInToGoogle()">
                <i class="fas fa-sign-in-alt"></i> Connect Google
            </button>
            <button id="google-disconnect-btn" class="btn-disconnect" onclick="signOutFromGoogle()" style="display: none;">
                <i class="fas fa-sign-out-alt"></i> Disconnect
            </button>
        `;
        dashboardSection.parentElement.insertBefore(apiControls, dashboardSection.nextSibling);
    }
}

// Export functions for global use
window.signInToGoogle = signInToGoogle;
window.signOutFromGoogle = signOutFromGoogle;
window.refreshDashboard = function() {
    if (authInstance && authInstance.isSignedIn.get()) {
        fetchGoogleAnalyticsData();
        fetchSearchConsoleData();
        fetchCoreWebVitals();
    } else {
        // Original mock data refresh
        initializeDashboard();
    }
    updateLastUpdated();
};