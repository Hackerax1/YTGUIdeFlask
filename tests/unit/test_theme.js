/**
 * Unit tests for Theme module
 * 
 * These tests verify that theme switching and persistence functions work correctly
 */

import { switchTheme, loadSavedTheme } from '../../static/js/modules/theme.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock DOM elements
document.getElementById = jest.fn().mockImplementation((id) => {
    if (id === 'themeStylesheet') {
        return {
            href: '/static/css/theme1.css' // Default theme
        };
    }
    return null;
});

describe('Theme Module', () => {
    beforeEach(() => {
        // Clear the localStorage mock before each test
        localStorageMock.clear();
        jest.clearAllMocks();
    });

    test('switchTheme should update stylesheet href', () => {
        const themePath = '/static/css/theme2.css';
        switchTheme(themePath);
        
        // Check that the stylesheet href was updated
        expect(document.getElementById('themeStylesheet').href).toBe(themePath);
    });
    
    test('switchTheme should save preference to localStorage', () => {
        const themePath = '/static/css/theme3.css';
        switchTheme(themePath);
        
        // Verify localStorage was updated with the theme preference
        expect(localStorageMock.setItem).toHaveBeenCalledWith('youtubeGuideTheme', themePath);
    });
    
    test('loadSavedTheme should load theme from localStorage if available', () => {
        // Set up a saved theme
        const savedTheme = '/static/css/theme2.css';
        localStorageMock.getItem.mockReturnValueOnce(savedTheme);
        
        loadSavedTheme();
        
        // Check that the theme was loaded from localStorage
        expect(document.getElementById).toHaveBeenCalledWith('themeStylesheet');
        expect(document.getElementById('themeStylesheet').href).toBe(savedTheme);
    });
    
    test('loadSavedTheme should do nothing if no saved theme exists', () => {
        // Ensure no saved theme
        localStorageMock.getItem.mockReturnValueOnce(null);
        
        // Save the original href
        const originalHref = document.getElementById('themeStylesheet').href;
        
        loadSavedTheme();
        
        // Check that the href wasn't changed
        expect(document.getElementById('themeStylesheet').href).toBe(originalHref);
    });
});