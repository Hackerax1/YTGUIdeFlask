/**
 * Utilities module
 * Acts as a facade for all utility functions, consolidating imported functionality
 */

// Import functionality from specialized utility modules
import { 
    updatePlayHead, 
    updateTime, 
    updateTimeMarkers, 
    initTimeDisplay,
    formatTime,
    getCurrentRoundedTime
} from './timeUtils.js';

import {
    updateProgramWidths,
    hidePageLoader,
    isElementInViewport,
    scrollIntoViewIfNeeded,
    toggleElementVisibility,
    setFocusWithAnimation
} from './uiUtils.js';

// Initialize all UI components 
function initUtilities() {
    // Initialize time-related displays
    initTimeDisplay();
    
    // Initialize UI-related components
    updateProgramWidths();
}

// Export all functions to maintain backward compatibility
export { 
    // Time-related functions
    updatePlayHead, 
    updateTime, 
    updateTimeMarkers,
    initTimeDisplay,
    formatTime,
    getCurrentRoundedTime,
    
    // UI-related functions
    updateProgramWidths, 
    hidePageLoader,
    isElementInViewport,
    scrollIntoViewIfNeeded,
    toggleElementVisibility,
    setFocusWithAnimation,
    
    // Initialization function
    initUtilities
};