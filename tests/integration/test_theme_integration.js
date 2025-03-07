/**
 * Integration tests for theme switching functionality
 * 
 * Tests the interaction between theme.js and DOM elements
 */

import { switchTheme, loadSavedTheme } from '../../static/js/modules/theme.js';

describe('Theme Integration Tests', () => {
    // Setup the necessary DOM structure
    beforeEach(() => {
        // Mock document structure
        document.body.innerHTML = `
            <link rel="stylesheet" href="/static/css/theme1.css" id="themeStylesheet">
            <div class="theme-switcher">
                <button data-theme="/static/css/theme1.css">Classic Guide</button>
                <button data-theme="/static/css/theme2.css">Night Mode</button>
                <button data-theme="/static/css/theme3.css">Retro Guide</button>
            </div>
        `;
        
        // Clear localStorage
        localStorage.clear();
    });
    
    test('theme buttons should update the stylesheet when clicked', () => {
        // Get the theme buttons
        const themeButtons = document.querySelectorAll('.theme-switcher button');
        
        // Simulate click on the second theme button
        themeButtons[1].click();
        
        // Check that the theme was updated
        const themeStylesheet = document.getElementById('themeStylesheet');
        expect(themeStylesheet.href).toContain('theme2.css');
        
        // Check that the theme was saved to localStorage
        expect(localStorage.getItem('youtubeGuideTheme')).toContain('theme2.css');
    });
    
    test('saved theme should be loaded on page initialization', () => {
        // Set a theme preference in localStorage
        localStorage.setItem('youtubeGuideTheme', '/static/css/theme3.css');
        
        // Simulate page load
        loadSavedTheme();
        
        // Check that the saved theme was loaded
        const themeStylesheet = document.getElementById('themeStylesheet');
        expect(themeStylesheet.href).toContain('theme3.css');
    });
    
    test('switching themes should maintain page state', () => {
        // Add some page state
        const testContainer = document.createElement('div');
        testContainer.id = 'test-container';
        testContainer.textContent = 'Test content';
        document.body.appendChild(testContainer);
        
        // Get initial state
        const initialState = document.body.innerHTML;
        
        // Switch theme
        switchTheme('/static/css/theme2.css');
        
        // Verify the test container still exists and has correct content
        expect(document.getElementById('test-container')).not.toBeNull();
        expect(document.getElementById('test-container').textContent).toBe('Test content');
        
        // Verify theme was changed
        expect(document.getElementById('themeStylesheet').href).toContain('theme2.css');
    });
});