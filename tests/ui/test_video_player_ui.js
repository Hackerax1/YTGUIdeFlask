/**
 * UI Tests for Video Player
 * 
 * These tests simulate user interactions with the video player
 * and verify that the UI responds correctly
 */

// Import the needed modules
import { playVideo, closeVideoModal } from '../../static/js/modules/videoPlayer.js';

// Import test utilities (you might need to create or install these)
import { simulateClick, simulateKeyPress, waitForElement } from '../test-utils.js';

describe('Video Player UI Tests', () => {
    beforeEach(() => {
        // Setup test environment
        document.body.innerHTML = `
            <div id="videoModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <button class="close-modal" aria-label="Close video">×</button>
                    <div class="video-container">
                        <div id="videoLoading">
                            <div class="loading-spinner"></div>
                            <p>Loading video...</p>
                        </div>
                        <iframe id="videoPlayer" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <div class="video-info">
                        <h2 id="videoTitle" class="video-title"></h2>
                        <div id="videoDescription" class="video-description"></div>
                    </div>
                    <div class="video-controls">
                        <button class="control-btn" data-action="open-youtube">Open in YouTube</button>
                        <button class="control-btn" data-action="close">Close</button>
                    </div>
                </div>
            </div>
            <div class="program-grid">
                <div class="program current" 
                    data-video-id="test123"
                    data-video-title="Test Video"
                    data-description="This is a test video description."
                    tabindex="0">
                    <div class="program-info">
                        <div class="program-title">Test Video</div>
                    </div>
                </div>
            </div>
        `;
        
        // Mock functions
        window.open = jest.fn();
        Element.prototype.scrollIntoView = jest.fn();
        Element.prototype.focus = jest.fn();
        
        // Clear mocks between tests
        jest.clearAllMocks();
    });
    
    test('clicking on a program should open the video modal', () => {
        // Get the program element
        const program = document.querySelector('.program');
        
        // Simulate clicking on a program
        simulateClick(program);
        
        // Check if modal is visible
        const modal = document.getElementById('videoModal');
        expect(modal.style.display).toBe('flex');
        
        // Check if video player is loaded with correct source
        const videoPlayer = document.getElementById('videoPlayer');
        expect(videoPlayer.src).toContain('test123');
        
        // Check if title and description are set correctly
        expect(document.getElementById('videoTitle').textContent).toBe('Test Video');
        expect(document.getElementById('videoDescription').textContent).toBe('This is a test video description.');
    });
    
    test('close button should hide the modal', () => {
        // First open the modal
        playVideo('test123', 'Test Video', 'Test description');
        
        // Get the close button
        const closeButton = document.querySelector('.close-modal');
        
        // Simulate clicking on close button
        simulateClick(closeButton);
        
        // Check if modal is hidden
        const modal = document.getElementById('videoModal');
        expect(modal.style.display).toBe('none');
        
        // Check that video source is cleared
        const videoPlayer = document.getElementById('videoPlayer');
        expect(videoPlayer.src).toBe('');
    });
    
    test('escape key should close the modal', () => {
        // First open the modal
        playVideo('test123', 'Test Video', 'Test description');
        
        // Simulate pressing Escape key
        simulateKeyPress(document.getElementById('videoModal'), 'Escape');
        
        // Check if modal is hidden
        const modal = document.getElementById('videoModal');
        expect(modal.style.display).toBe('none');
    });
    
    test('"Open in YouTube" button should open video in new tab', () => {
        // First open the modal
        playVideo('test123', 'Test Video', 'Test description');
        
        // Get the "Open in YouTube" button
        const openYouTubeButton = document.querySelector('[data-action="open-youtube"]');
        
        // Simulate clicking on the button
        simulateClick(openYouTubeButton);
        
        // Check if window.open was called with correct URL
        expect(window.open).toHaveBeenCalledWith(
            'https://www.youtube.com/watch?v=test123', 
            '_blank'
        );
    });
    
    test('loading indicator should be shown while video loads', async () => {
        // First open the modal
        playVideo('test123', 'Test Video', 'Test description');
        
        // Check that loading indicator is visible
        const loadingIndicator = document.getElementById('videoLoading');
        expect(loadingIndicator.style.display).not.toBe('none');
        
        // Simulate video loaded event
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.onload();
        
        // Check that loading indicator is hidden
        expect(loadingIndicator.style.display).toBe('none');
    });
    
    test('focus should be trapped within modal when open', () => {
        // First open the modal
        playVideo('test123', 'Test Video', 'Test description');
        
        // Get focusable elements
        const closeButton = document.querySelector('.close-modal');
        const openYouTubeButton = document.querySelector('[data-action="open-youtube"]');
        const closeModalButton = document.querySelector('[data-action="close"]');
        
        // Simulate Tab key press when focus is on last element
        document.activeElement = closeModalButton;
        simulateKeyPress(document.getElementById('videoModal'), 'Tab');
        
        // Focus should move to first element
        expect(closeButton.focus).toHaveBeenCalled();
        
        // Simulate Shift+Tab key press when focus is on first element
        document.activeElement = closeButton;
        simulateKeyPress(document.getElementById('videoModal'), 'Tab', { shiftKey: true });
        
        // Focus should move to last element
        expect(closeModalButton.focus).toHaveBeenCalled();
    });
});