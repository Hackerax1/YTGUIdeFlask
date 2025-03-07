/**
 * Main index.js file
 * 
 * This is the entry point for the TV Guide frontend application.
 * It imports and initializes all the necessary modules,
 * sets up global event handlers, and makes certain functions
 * available to the HTML templates.
 */

// Import required functionality from modules
import { switchTheme, loadSavedTheme } from './modules/theme.js';
import { playVideo, closeVideoModal, openInYouTube, initVideoPlayer } from './modules/videoPlayer.js';
import { initNavigation, getCurrentProgram, focusProgram } from './modules/navigation.js';
import { hidePageLoader, initTimeDisplay } from './modules/utilities.js';

/**
 * Make certain functions available in the global scope
 * This allows HTML elements to call these functions directly via attributes
 * like onclick="playVideo(...)"
 */
window.switchTheme = switchTheme;
window.playVideo = playVideo;
window.closeVideoModal = closeVideoModal;
window.openInYouTube = openInYouTube;

/**
 * Initialize the application when DOM is loaded
 * 
 * This runs once the page structure is available but before all
 * assets like images have finished loading. It sets up the core
 * functionality and appearance.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load saved theme preference from localStorage
    loadSavedTheme();
    
    // Initialize all application components
    initNavigation();    // Set up keyboard navigation and focus management
    initVideoPlayer();   // Set up video player modal and events
    initTimeDisplay();   // Set up time display and program widths
    
    // Connect navigation module's escape key events to the video modal close function
    document.addEventListener('escapePressed', closeVideoModal);
    
    // Hide page loader when everything is loaded
    window.addEventListener('load', function() {
        // Add a small delay for smoother transition
        setTimeout(hidePageLoader, 500);
    });
    
    // Fallback: Also hide loader after a timeout in case load event doesn't fire
    // This can happen in some browsers or if images fail to load
    setTimeout(hidePageLoader, 3000);
});