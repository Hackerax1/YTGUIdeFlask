/**
 * Main index.js file
 * Integrates functionality from modules and initializes the application
 */
import { switchTheme, loadSavedTheme } from './modules/theme.js';
import { playVideo, closeVideoModal, openInYouTube, initVideoPlayer } from './modules/videoPlayer.js';
import { initNavigation } from './modules/navigation.js';
import { hidePageLoader, initTimeDisplay } from './modules/utilities.js';

// Make functions available globally for use in HTML attributes
window.switchTheme = switchTheme;
window.playVideo = playVideo;
window.closeVideoModal = closeVideoModal;
window.openInYouTube = openInYouTube;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load theme
    loadSavedTheme();
    
    // Initialize components
    initNavigation();
    initVideoPlayer();
    initTimeDisplay();
    
    // Handle escape key events from navigation module
    document.addEventListener('escapePressed', closeVideoModal);
    
    // Hide page loader when everything is loaded
    window.addEventListener('load', function() {
        setTimeout(hidePageLoader, 500); // Add a small delay for smoother transition
    });
    
    // Also hide loader after a timeout in case load event doesn't fire
    setTimeout(hidePageLoader, 3000);
});