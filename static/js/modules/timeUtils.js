/**
 * Time Utilities Module
 * Handles time displays, markers, and playhead positioning
 */

// Update play head position based on current time
function updatePlayHead() {
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const minutesInView = 90;  // 90-minute window
    const percentage = ((minutesSinceMidnight % minutesInView) / minutesInView) * 100;
    
    const playHead = document.getElementById('playHead');
    if (playHead) {
        playHead.style.left = `${percentage}%`;
    }
}

// Update the current time display
function updateTime() {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 0 : 30; // Round to the nearest half hour
    const hours = now.getHours() % 12;
    const displayHours = (hours === 0 ? 12 : hours).toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    document.querySelector('.current-time').textContent = `${displayHours}:${roundedMinutes.toString().padStart(2, '0')} ${ampm}`;
    
    // Also update time markers when time changes
    updateTimeMarkers();
}

// Generate time markers dynamically
function updateTimeMarkers() {
    const timeMarkersContainer = document.querySelector('.time-markers');
    if (!timeMarkersContainer) return;
    
    // Clear existing time markers
    timeMarkersContainer.innerHTML = '';
    
    // Get current time
    const now = new Date();
    
    // Create 3 time markers (current 30-minute slot and next 2 slots)
    for (let i = 0; i < 3; i++) {
        // Calculate time for this marker
        const markerTime = new Date(now);
        markerTime.setMinutes(Math.floor(markerTime.getMinutes() / 30) * 30 + (i * 30)); // Round to nearest 30 min, then add offset
        if (markerTime.getMinutes() >= 60) {
            markerTime.setHours(markerTime.getHours() + 1);
            markerTime.setMinutes(markerTime.getMinutes() - 60);
        }
        
        // Format time for display
        const hours = markerTime.getHours() % 12;
        const displayHours = (hours === 0 ? 12 : hours);
        const minutes = markerTime.getMinutes();
        const ampm = markerTime.getHours() >= 12 ? 'PM' : 'AM';
        
        // Create marker element
        const marker = document.createElement('div');
        marker.className = 'time-marker';
        marker.textContent = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        
        // Add to container
        timeMarkersContainer.appendChild(marker);
    }
}

// Initialize time-related displays and updates
function initTimeDisplay() {
    // Update time markers initially
    updateTimeMarkers();
    
    // Initialize play head
    updatePlayHead();
    setInterval(updatePlayHead, 60000); // Update every minute
    
    // Update time display
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
}

// Format a date object to display time
function formatTime(date) {
    const hours = date.getHours() % 12;
    const displayHours = (hours === 0 ? 12 : hours);
    const minutes = date.getMinutes();
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Get the current time rounded to the nearest half hour
function getCurrentRoundedTime() {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 0 : 30;
    
    const roundedTime = new Date(now);
    roundedTime.setMinutes(roundedMinutes);
    roundedTime.setSeconds(0);
    roundedTime.setMilliseconds(0);
    
    return roundedTime;
}

// Export functions
export { 
    updatePlayHead, 
    updateTime, 
    updateTimeMarkers,
    initTimeDisplay,
    formatTime,
    getCurrentRoundedTime
};