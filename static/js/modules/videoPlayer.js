/**
 * Video player module
 * 
 * Handles video playback via YouTube embedded player, manages the video modal,
 * implements focus trapping for accessibility, and provides controls for
 * the user to interact with videos.
 */

// Global variables
let currentVideoId = '';  // Tracks the currently playing video ID
let lastFocusedElement = null;  // Stores the element that had focus before the modal opened

/**
 * Play a YouTube video in the modal window
 * 
 * Opens the video player modal, sets up the YouTube iframe with proper parameters,
 * and manages focus for accessibility.
 * 
 * @param {string} videoId - The YouTube video ID
 * @param {string} videoTitle - Title of the video to display
 * @param {string} videoDescription - Description of the video (optional)
 */
function playVideo(videoId, videoTitle, videoDescription = '') {
    // Store last focused element for returning focus when modal closes
    lastFocusedElement = document.activeElement;
    
    // Set video ID for reference in other functions
    currentVideoId = videoId;
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('videoLoading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // Update iframe source with autoplay and no related videos
    const player = document.getElementById('videoPlayer');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    
    // Update title and description in the modal
    document.getElementById('videoTitle').textContent = videoTitle;
    document.getElementById('videoDescription').textContent = videoDescription;
    
    // Show the modal with flex display for proper centering
    const modal = document.getElementById('videoModal');
    modal.style.display = 'flex';
    
    // Focus the close button for keyboard accessibility
    modal.querySelector('.close-modal').focus();

    // Setup focus trap to ensure keyboard navigation stays within modal
    modal.addEventListener('keydown', trapFocus);
    
    // Hide loading indicator when the video loads
    player.onload = function() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    };
}

/**
 * Close the video modal and clean up resources
 * 
 * Stops the video by removing the iframe source,
 * hides the modal, and returns focus to the previous element.
 */
function closeVideoModal() {
    // Stop the video by removing the src
    // This is important to prevent audio continuing to play
    document.getElementById('videoPlayer').src = '';
    
    // Hide the modal
    const modal = document.getElementById('videoModal');
    modal.style.display = 'none';
    
    // Remove focus trap
    modal.removeEventListener('keydown', trapFocus);
    
    // Return focus to last focused element for proper keyboard navigation
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

/**
 * Trap focus within modal for accessibility
 * 
 * Implements a focus trap that ensures keyboard navigation stays 
 * within the modal while it's open. This is an important accessibility feature.
 * 
 * @param {Event} e - Keyboard event
 */
function trapFocus(e) {
    const modal = document.getElementById('videoModal');
    const focusableElements = modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Handle tab key navigation to keep focus in the modal
    if (e.key === 'Tab') {
        if (e.shiftKey) {
            // If shift+tab and focus is on first element, wrap to last element
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // If tab and focus is on last element, wrap to first element
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    // Close modal on Escape key press
    if (e.key === 'Escape') {
        closeVideoModal();
    }
}

/**
 * Open the current video in YouTube
 * 
 * Opens the current video in a new browser tab on YouTube.com,
 * allowing access to additional YouTube features.
 */
function openInYouTube() {
    if (currentVideoId) {
        window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
    }
}

/**
 * Initialize video player event listeners
 * 
 * Sets up event handlers for modal interactions and iframe loading.
 * Should be called once when the application initializes.
 */
function initVideoPlayer() {
    // Set up click handler for modal background for closing
    const modal = document.getElementById('videoModal');
    modal.onclick = function(event) {
        // Only close if clicking the modal background (not the content)
        if (event.target === modal) {
            closeVideoModal();
        }
    };
    
    // Hide loading indicator when iframe loads
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.addEventListener('load', function() {
        const loadingIndicator = document.getElementById('videoLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    });
    
    // Set up click handlers for control buttons
    const closeButton = document.querySelector('[data-action="close"]');
    if (closeButton) {
        closeButton.addEventListener('click', closeVideoModal);
    }
    
    const openYouTubeButton = document.querySelector('[data-action="open-youtube"]');
    if (openYouTubeButton) {
        openYouTubeButton.addEventListener('click', openInYouTube);
    }
}

// Export functions for use in other files
export { playVideo, closeVideoModal, openInYouTube, initVideoPlayer };