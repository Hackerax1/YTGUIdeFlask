// Global variables
let currentVideoId = '';
let lastFocusedElement = null;
let currentPosition = { row: 0, col: 0 };
let mouseTimer;

// Hide cursor when keyboard is used
document.addEventListener('keydown', function() {
    document.body.classList.add('keyboard-mode');
});

document.addEventListener('mousemove', function() {
    document.body.classList.remove('keyboard-mode');
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => {
        if (!document.querySelector('.modal[style*="display: flex"]')) {
            document.body.classList.add('keyboard-mode');
        }
    }, 3000);
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (document.getElementById('videoModal').style.display === 'flex') {
        return; // Don't handle navigation when modal is open
    }

    const grid = document.querySelector('.program-grid');
    const rows = document.querySelectorAll('.guide-row');
    const currentRow = rows[currentPosition.row];
    const programs = currentRow ? currentRow.querySelectorAll('.program') : [];

    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            if (currentPosition.row > 0) {
                currentPosition.row--;
                focusProgram();
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (currentPosition.row < rows.length - 1) {
                currentPosition.row++;
                focusProgram();
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (currentPosition.col > 0) {
                currentPosition.col--;
                focusProgram();
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (currentPosition.col < programs.length - 1) {
                currentPosition.col++;
                focusProgram();
            }
            break;
        case 'Enter':
            e.preventDefault();
            const currentProgram = getCurrentProgram();
            if (currentProgram && currentProgram.classList.contains('current')) {
                const videoId = currentProgram.dataset.videoId;
                const videoTitle = currentProgram.dataset.videoTitle;
                playVideo(videoId, videoTitle);
            }
            break;
    }
});

function getCurrentProgram() {
    const rows = document.querySelectorAll('.guide-row');
    const currentRow = rows[currentPosition.row];
    if (!currentRow) return null;
    
    const programs = currentRow.querySelectorAll('.program');
    return programs[currentPosition.col] || null;
}

function focusProgram() {
    // Remove previous focus
    document.querySelectorAll('.program.nav-focus').forEach(p => {
        p.classList.remove('nav-focus');
    });

    const program = getCurrentProgram();
    if (program) {
        program.classList.add('nav-focus');
        program.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Update play head position
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

// Switch between themes
function switchTheme(themePath) {
    document.getElementById('themeStylesheet').href = themePath;
}

// Play a YouTube video in the modal
function playVideo(videoId, videoTitle) {
    // Store last focused element for returning focus when modal closes
    lastFocusedElement = document.activeElement;
    
    // Set video ID for reference
    currentVideoId = videoId;
    
    // Update iframe source
    const player = document.getElementById('videoPlayer');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    
    // Update title
    document.getElementById('videoTitle').textContent = videoTitle;
    
    // Show the modal
    const modal = document.getElementById('videoModal');
    modal.style.display = 'flex';
    
    // Focus the close button
    modal.querySelector('.close-modal').focus();

    // Trap focus in modal
    modal.addEventListener('keydown', trapFocus);
}

// Close the video modal
function closeVideoModal() {
    // Stop the video by removing the src
    document.getElementById('videoPlayer').src = '';
    
    // Hide the modal
    const modal = document.getElementById('videoModal');
    modal.style.display = 'none';
    
    // Remove focus trap
    modal.removeEventListener('keydown', trapFocus);
    
    // Return focus to last focused element
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

// Trap focus within modal
function trapFocus(e) {
    const modal = document.getElementById('videoModal');
    const focusableElements = modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    if (e.key === 'Escape') {
        closeVideoModal();
    }
}

// Open the current video in YouTube
function openInYouTube() {
    if (currentVideoId) {
        window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
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
}

// Function to update program block widths based on duration
function updateProgramWidths() {
    const programs = document.querySelectorAll('.program');
    programs.forEach(program => {
        const duration = parseInt(program.dataset.duration, 10); // Duration in minutes
        const widthPercentage = (duration / 90) * 100; // Assuming 90 minutes is the full width
        program.style.width = `${widthPercentage}%`;
    });
}

// Initialize event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Set initial focus
    focusProgram();
    
    // Initialize play head
    updatePlayHead();
    setInterval(updatePlayHead, 60000); // Update every minute
    
    // Update time display
    updateTime();
    setInterval(updateTime, 60000);
    
    // Modal click handler
    const modal = document.getElementById('videoModal');
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeVideoModal();
        }
    };

    // Update program widths based on duration
    updateProgramWidths();
});