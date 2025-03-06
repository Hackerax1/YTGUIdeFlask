/**
 * Video player module
 * Handles video playback and modal interactions
 */

// Global variables
let currentVideoId = '';
let lastFocusedElement = null;

// Play a YouTube video in the modal
function playVideo(videoId, videoTitle, videoDescription = '') {
    // Store last focused element for returning focus when modal closes
    lastFocusedElement = document.activeElement;
    
    // Set video ID for reference
    currentVideoId = videoId;
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('videoLoading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // Update iframe source
    const player = document.getElementById('videoPlayer');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    
    // Update title and description
    document.getElementById('videoTitle').textContent = videoTitle;
    document.getElementById('videoDescription').textContent = videoDescription;
    
    // Show the modal
    const modal = document.getElementById('videoModal');
    modal.style.display = 'flex';
    
    // Focus the close button
    modal.querySelector('.close-modal').focus();

    // Trap focus in modal
    modal.addEventListener('keydown', trapFocus);
    
    // Hide loading indicator when the video loads
    player.onload = function() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    };
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

// Initialize video player event listeners
function initVideoPlayer() {
    // Modal click handler
    const modal = document.getElementById('videoModal');
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeVideoModal();
        }
    };
    
    // Handle iframe load event to hide loading indicator
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.addEventListener('load', function() {
        const loadingIndicator = document.getElementById('videoLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    });
}

// Export functions for use in other files
export { playVideo, closeVideoModal, openInYouTube, initVideoPlayer };