// MileIQ Migration Hub JavaScript

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedProgress();
    updateProgressBar();
    updateLastUpdated();
    initializeDashboard();
    expandFirstPhase();
    initializeRoadmap();
    updateMigrationStats();
});

// LocalStorage Keys
const STORAGE_KEYS = {
    checklistProgress: 'mileiq_checklist_progress',
    uploadedFiles: 'mileiq_uploaded_files',
    dashboardData: 'mileiq_dashboard_data'
};

// Load saved progress from localStorage
function loadSavedProgress() {
    const savedProgress = localStorage.getItem(STORAGE_KEYS.checklistProgress);
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        Object.keys(progress).forEach(itemId => {
            const checkbox = document.getElementById(itemId);
            if (checkbox) {
                checkbox.checked = progress[itemId];
            }
        });
    }

    const savedFiles = localStorage.getItem(STORAGE_KEYS.uploadedFiles);
    if (savedFiles) {
        const files = JSON.parse(savedFiles);
        Object.keys(files).forEach(itemId => {
            displayUploadedFiles(itemId, files[itemId]);
        });
    }
}

// Save progress to localStorage
function saveProgress() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const progress = {};
    
    checkboxes.forEach(checkbox => {
        progress[checkbox.id] = checkbox.checked;
    });
    
    localStorage.setItem(STORAGE_KEYS.checklistProgress, JSON.stringify(progress));
    updateProgressBar();
    updateMigrationStats();
}

// Update progress bar
function updateProgressBar() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const total = checkboxes.length;
    const checked = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked').length;
    const percentage = Math.round((checked / total) * 100);
    
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill && progressText) {
        progressFill.style.width = percentage + '%';
        progressText.textContent = percentage + '% Complete';
        
        // Update color based on progress
        if (percentage === 100) {
            progressFill.style.background = 'linear-gradient(90deg, #16a34a, #15803d)';
        } else if (percentage >= 75) {
            progressFill.style.background = 'linear-gradient(90deg, #16a34a, #2563eb)';
        } else if (percentage >= 50) {
            progressFill.style.background = 'linear-gradient(90deg, #eab308, #2563eb)';
        } else if (percentage >= 25) {
            progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #dc2626, #f59e0b)';
        }
    }
}

// Toggle phase expansion
function togglePhase(phaseId) {
    const phaseCard = document.getElementById(phaseId);
    if (phaseCard) {
        phaseCard.classList.toggle('expanded');
    }
}

// Expand first phase by default
function expandFirstPhase() {
    const firstPhase = document.getElementById('pre-migration');
    if (firstPhase) {
        firstPhase.classList.add('expanded');
    }
}

// File upload functionality
function uploadFile(itemId) {
    const fileInput = document.getElementById('file-input');
    
    fileInput.onchange = function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const uploadedFiles = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileData = {
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: file.type,
                    uploadDate: new Date().toISOString(),
                    url: URL.createObjectURL(file)
                };
                uploadedFiles.push(fileData);
            }
            
            saveUploadedFiles(itemId, uploadedFiles);
            displayUploadedFiles(itemId, uploadedFiles);
        }
        
        // Reset file input
        fileInput.value = '';
    };
    
    fileInput.click();
}

// Save uploaded files to localStorage
function saveUploadedFiles(itemId, files) {
    let allFiles = localStorage.getItem(STORAGE_KEYS.uploadedFiles);
    allFiles = allFiles ? JSON.parse(allFiles) : {};
    
    if (!allFiles[itemId]) {
        allFiles[itemId] = [];
    }
    
    allFiles[itemId] = allFiles[itemId].concat(files);
    localStorage.setItem(STORAGE_KEYS.uploadedFiles, JSON.stringify(allFiles));
}

// Display uploaded files
function displayUploadedFiles(itemId, files) {
    const uploadList = document.getElementById('uploads-' + itemId);
    if (!uploadList) return;
    
    uploadList.innerHTML = '';
    uploadList.classList.add('has-files');
    
    files.forEach((file, index) => {
        const uploadItem = document.createElement('div');
        uploadItem.className = 'upload-item';
        uploadItem.innerHTML = `
            <a href="${file.url}" target="_blank">
                <i class="fas fa-file"></i> ${file.name} (${file.size})
            </a>
            <span class="upload-remove" onclick="removeUpload('${itemId}', ${index})">
                <i class="fas fa-times"></i>
            </span>
        `;
        uploadList.appendChild(uploadItem);
    });
}

// Remove uploaded file
function removeUpload(itemId, fileIndex) {
    let allFiles = localStorage.getItem(STORAGE_KEYS.uploadedFiles);
    allFiles = allFiles ? JSON.parse(allFiles) : {};
    
    if (allFiles[itemId]) {
        allFiles[itemId].splice(fileIndex, 1);
        
        if (allFiles[itemId].length === 0) {
            delete allFiles[itemId];
            const uploadList = document.getElementById('uploads-' + itemId);
            if (uploadList) {
                uploadList.classList.remove('has-files');
            }
        }
        
        localStorage.setItem(STORAGE_KEYS.uploadedFiles, JSON.stringify(allFiles));
        
        if (allFiles[itemId] && allFiles[itemId].length > 0) {
            displayUploadedFiles(itemId, allFiles[itemId]);
        } else {
            const uploadList = document.getElementById('uploads-' + itemId);
            if (uploadList) {
                uploadList.innerHTML = '';
            }
        }
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Clear all progress
function clearProgress() {
    if (confirm('Are you sure you want to clear all progress? This action cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEYS.checklistProgress);
        localStorage.removeItem(STORAGE_KEYS.uploadedFiles);
        localStorage.removeItem(STORAGE_KEYS.dashboardData);
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Clear all upload lists
        const uploadLists = document.querySelectorAll('.upload-list');
        uploadLists.forEach(list => {
            list.innerHTML = '';
            list.classList.remove('has-files');
        });
        
        updateProgressBar();
        alert('All progress has been cleared.');
    }
}

// Export checklist as JSON
function exportChecklist() {
    const checklistData = {
        exportDate: new Date().toISOString(),
        progress: JSON.parse(localStorage.getItem(STORAGE_KEYS.checklistProgress) || '{}'),
        files: JSON.parse(localStorage.getItem(STORAGE_KEYS.uploadedFiles) || '{}'),
        dashboard: JSON.parse(localStorage.getItem(STORAGE_KEYS.dashboardData) || '{}')
    };
    
    const dataStr = JSON.stringify(checklistData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mileiq_migration_checklist_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
}

// Update last updated time
function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = new Date().toLocaleString();
    }
}

// Initialize dashboard with mock data
function initializeDashboard() {
    // Mock data for demonstration
    const mockData = {
        gsc: {
            impressions: '124,567',
            clicks: '8,234',
            ctr: '6.6%',
            position: '12.4'
        },
        ga: {
            traffic: '45,678',
            bounce: '42.3%',
            session: '2:34',
            conversions: '1,234'
        },
        cwv: {
            lcp: '2.4s',
            fid: '98ms',
            cls: '0.08',
            score: '92/100'
        },
        rankings: [
            { keyword: 'mileage tracker app', position: '3' },
            { keyword: 'business mileage tracking', position: '5' },
            { keyword: 'IRS mileage reimbursement', position: '7' },
            { keyword: 'mileage log template', position: '4' }
        ]
    };
    
    // Update GSC metrics
    updateMetric('gsc-impressions', mockData.gsc.impressions);
    updateMetric('gsc-clicks', mockData.gsc.clicks);
    updateMetric('gsc-ctr', mockData.gsc.ctr);
    updateMetric('gsc-position', mockData.gsc.position);
    
    // Update GA metrics
    updateMetric('ga-traffic', mockData.ga.traffic);
    updateMetric('ga-bounce', mockData.ga.bounce);
    updateMetric('ga-session', mockData.ga.session);
    updateMetric('ga-conversions', mockData.ga.conversions);
    
    // Update CWV metrics
    updateMetric('cwv-lcp', mockData.cwv.lcp);
    updateMetric('cwv-fid', mockData.cwv.fid);
    updateMetric('cwv-cls', mockData.cwv.cls);
    updateMetric('cwv-score', mockData.cwv.score);
    
    // Update rankings
    const rankingsContainer = document.getElementById('top-rankings');
    if (rankingsContainer) {
        rankingsContainer.innerHTML = '';
        mockData.rankings.forEach(ranking => {
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';
            rankingItem.innerHTML = `
                <span class="keyword">${ranking.keyword}</span>
                <span class="position">#${ranking.position}</span>
            `;
            rankingsContainer.appendChild(rankingItem);
        });
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.dashboardData, JSON.stringify(mockData));
}

// Update metric value
function updateMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Refresh dashboard data
function refreshDashboard() {
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
    }
    
    // Simulate API call delay
    setTimeout(() => {
        initializeDashboard();
        updateLastUpdated();
        
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh Data';
            refreshBtn.disabled = false;
        }
        
        // Show success message
        showNotification('Dashboard data refreshed successfully!', 'success');
    }, 1500);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#16a34a' : '#2563eb'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Scroll to section smoothly
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Update migration statistics in header and executive summary
function updateMigrationStats() {
    // Calculate overall progress
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const total = checkboxes.length;
    const checked = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked').length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    // Update header stats
    const progressElement = document.getElementById('migration-progress');
    if (progressElement) {
        progressElement.textContent = percentage + '%';
    }
    
    // Calculate days remaining (assuming launch date is 90 days from project start)
    const projectStartDate = new Date('2025-01-01');
    const launchDate = new Date(projectStartDate);
    launchDate.setDate(launchDate.getDate() + 90);
    const today = new Date();
    const daysRemaining = Math.ceil((launchDate - today) / (1000 * 60 * 60 * 24));
    
    const daysElement = document.getElementById('days-remaining');
    if (daysElement) {
        daysElement.textContent = daysRemaining > 0 ? daysRemaining : '0';
    }
    
    // Update risk level based on progress and days remaining
    const riskElement = document.getElementById('risk-level');
    if (riskElement) {
        if (percentage < 20 && daysRemaining < 30) {
            riskElement.textContent = 'High';
            riskElement.style.color = '#E74C3C';
        } else if (percentage < 50 && daysRemaining < 45) {
            riskElement.textContent = 'Medium';
            riskElement.style.color = '#F39C12';
        } else {
            riskElement.textContent = 'Low';
            riskElement.style.color = '#27AE60';
        }
    }
    
    // Update executive summary progress
    const summaryProgress = document.querySelector('.progress-fill-large');
    if (summaryProgress) {
        summaryProgress.style.width = percentage + '%';
    }
    
    const summaryPercentage = document.querySelector('.progress-percentage');
    if (summaryPercentage) {
        summaryPercentage.textContent = percentage + '% Complete';
    }
    
    // Update task counts
    const tasksCompleted = checked;
    const tasksRemaining = total - checked;
    const tasksInProgress = Math.min(5, tasksRemaining); // Estimate
    
    const metricsContainer = document.querySelector('.key-metrics');
    if (metricsContainer) {
        metricsContainer.innerHTML = `
            <div class="metric">
                <i class="fas fa-check-circle text-success"></i>
                <span>${tasksCompleted} Tasks Completed</span>
            </div>
            <div class="metric">
                <i class="fas fa-clock text-warning"></i>
                <span>${tasksInProgress} Tasks In Progress</span>
            </div>
            <div class="metric">
                <i class="fas fa-tasks text-info"></i>
                <span>${tasksRemaining} Tasks Remaining</span>
            </div>
        `;
    }
}

// Toggle phase task expansion
function togglePhaseTasks(phaseId) {
    const tasksElement = document.getElementById(phaseId + '-tasks');
    const button = event.target.closest('.expand-tasks');
    
    if (tasksElement) {
        tasksElement.classList.toggle('expanded');
        const icon = button.querySelector('i');
        if (tasksElement.classList.contains('expanded')) {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// API Integration Placeholders
// These functions would be implemented when API credentials are available

function connectGoogleSearchConsole() {
    // Implementation for GSC API
    console.log('Google Search Console API integration placeholder');
}

function connectGoogleAnalytics() {
    // Implementation for GA API
    console.log('Google Analytics API integration placeholder');
}

function connectPageSpeedInsights() {
    // Implementation for PageSpeed Insights API
    console.log('PageSpeed Insights API integration placeholder');
}

// Monitor for critical changes
function monitorCriticalMetrics() {
    // Check for traffic drops
    // Check for 404 errors
    // Check for ranking changes
    // Send alerts if thresholds are exceeded
    console.log('Monitoring critical metrics...');
}

// Initialize Roadmap
function initializeRoadmap() {
    // Add click handlers to phase markers
    const phaseMarkers = document.querySelectorAll('.phase-marker');
    phaseMarkers.forEach((marker, index) => {
        marker.addEventListener('click', function() {
            showPhaseDetails(index + 1);
        });
    });
    
    // Update roadmap based on checklist progress
    updateRoadmapProgress();
    
    // Add hover effects
    const roadmapPhases = document.querySelectorAll('.roadmap-phase');
    roadmapPhases.forEach(phase => {
        phase.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        phase.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Show phase details in modal or expanded view
function showPhaseDetails(phaseNumber) {
    const phase = document.getElementById(`roadmap-phase-${phaseNumber}`);
    if (phase) {
        const details = phase.querySelector('.phase-details');
        if (details) {
            // Toggle details visibility
            if (details.style.display === 'none' || !details.style.display) {
                details.style.display = 'block';
                details.style.animation = 'fadeIn 0.5s ease';
            } else {
                details.style.display = 'none';
            }
        }
    }
}

// Update roadmap progress based on checklist
function updateRoadmapProgress() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked');
    const totalCheckboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]').length;
    const progressPercentage = (checkboxes.length / totalCheckboxes) * 100;
    
    // Update phase markers based on progress
    if (progressPercentage > 0) {
        updatePhaseStatus(1, 'active');
    }
    if (progressPercentage > 20) {
        updatePhaseStatus(1, 'completed');
        updatePhaseStatus(2, 'active');
    }
    if (progressPercentage > 40) {
        updatePhaseStatus(2, 'completed');
        updatePhaseStatus(3, 'active');
    }
    if (progressPercentage > 60) {
        updatePhaseStatus(3, 'completed');
        updatePhaseStatus(4, 'active');
    }
    if (progressPercentage > 80) {
        updatePhaseStatus(4, 'completed');
        updatePhaseStatus(5, 'active');
    }
    if (progressPercentage > 90) {
        updatePhaseStatus(5, 'completed');
        updatePhaseStatus(6, 'active');
    }
    
    // Update milestone progress bars
    updateMilestoneProgress();
}

// Update phase status
function updatePhaseStatus(phaseNumber, status) {
    const phase = document.getElementById(`roadmap-phase-${phaseNumber}`);
    if (phase) {
        const marker = phase.querySelector('.phase-marker');
        const statusDot = phase.querySelector('.status-dot');
        const statusText = phase.querySelector('.phase-status span:last-child');
        
        if (status === 'completed') {
            marker.classList.remove('active');
            marker.style.borderColor = '#16a34a';
            marker.style.background = '#dcfce7';
            if (statusDot) {
                statusDot.classList.remove('active');
                statusDot.style.background = '#16a34a';
            }
            if (statusText) {
                statusText.textContent = 'Completed';
            }
        } else if (status === 'active') {
            marker.classList.add('active');
            if (statusDot) {
                statusDot.classList.add('active');
            }
            if (statusText) {
                statusText.textContent = 'In Progress';
            }
        }
    }
}

// Update milestone progress bars
function updateMilestoneProgress() {
    const milestones = [
        { week: 2, element: document.querySelectorAll('.milestone-card')[0], target: 13 },
        { week: 4, element: document.querySelectorAll('.milestone-card')[1], target: 26 },
        { week: 8, element: document.querySelectorAll('.milestone-card')[2], target: 52 },
        { week: 10, element: document.querySelectorAll('.milestone-card')[3], target: 65 },
        { week: 11, element: document.querySelectorAll('.milestone-card')[4], target: 78 },
        { week: 16, element: document.querySelectorAll('.milestone-card')[5], target: 100 }
    ];
    
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked');
    const totalCheckboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]').length;
    const currentProgress = (checkboxes.length / totalCheckboxes) * 100;
    
    milestones.forEach(milestone => {
        if (milestone.element) {
            const progressBar = milestone.element.querySelector('.progress-mini');
            if (progressBar) {
                const milestoneProgress = Math.min(100, (currentProgress / milestone.target) * 100);
                progressBar.style.width = milestoneProgress + '%';
            }
        }
    });
}

// Update critical path items based on checklist
function updateCriticalPath() {
    const pathItems = document.querySelectorAll('.path-item');
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked');
    const completedCount = checkboxes.length;
    
    pathItems.forEach((item, index) => {
        if (completedCount > index * 7) {
            item.classList.add('completed');
            item.classList.remove('active');
        } else if (completedCount > (index - 1) * 7) {
            item.classList.add('active');
            item.classList.remove('completed');
        } else {
            item.classList.remove('active', 'completed');
        }
    });
}

// Auto-save progress every 30 seconds
setInterval(saveProgress, 30000);

// Update dashboard every 5 minutes
setInterval(refreshDashboard, 300000);

// Update roadmap every time progress is saved
const originalSaveProgress = saveProgress;
saveProgress = function() {
    originalSaveProgress();
    updateRoadmapProgress();
    updateCriticalPath();
};