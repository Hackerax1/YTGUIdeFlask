/**
 * UI Utilities Module
 * Handles UI elements, layouts, and program display
 */

// Function to update program block widths based on duration
function updateProgramWidths() {
    const programs = document.querySelectorAll('.program');
    programs.forEach(program => {
        const duration = parseInt(program.dataset.duration, 10); // Duration in minutes
        const widthPercentage = (duration / 90) * 100; // Assuming 90 minutes is the full width
        program.style.width = `${widthPercentage}%`;
    });
}

// Hide the page loader
function hidePageLoader() {
    const pageLoader = document.getElementById('pageLoader');
    if (pageLoader) {
        pageLoader.style.opacity = '0';
        setTimeout(() => {
            pageLoader.style.display = 'none';
        }, 300);
    }
}

// Check if an element is in the viewport
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Scroll an element into view if it's not already visible
function scrollIntoViewIfNeeded(element) {
    if (!isElementInViewport(element)) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
}

// Toggle element visibility
function toggleElementVisibility(elementId, isVisible) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = isVisible ? 'block' : 'none';
    }
}

// Set focus on element with animation
function setFocusWithAnimation(element, className = 'focus-animation') {
    if (!element) return;
    
    // Remove animation class from any existing elements
    document.querySelectorAll('.' + className).forEach(el => {
        el.classList.remove(className);
    });
    
    // Add animation class to this element
    element.classList.add(className);
    
    // Focus the element
    element.focus();
}

// Export functions
export {
    updateProgramWidths,
    hidePageLoader,
    isElementInViewport,
    scrollIntoViewIfNeeded,
    toggleElementVisibility,
    setFocusWithAnimation
};