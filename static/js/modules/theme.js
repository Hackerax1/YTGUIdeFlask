/**
 * Theme management module
 * Handles theme switching and persistence
 */

// Switch between themes and store preference
function switchTheme(themePath) {
    document.getElementById('themeStylesheet').href = themePath;
    // Store theme preference in local storage
    localStorage.setItem('youtubeGuideTheme', themePath);
}

// Load saved theme preference
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('youtubeGuideTheme');
    if (savedTheme) {
        document.getElementById('themeStylesheet').href = savedTheme;
    }
}

// Export functions for use in other files
export { switchTheme, loadSavedTheme };