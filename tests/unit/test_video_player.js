/**
 * Unit tests for Video Player module
 * 
 * These tests verify that video player functions work correctly
 */

import { playVideo, closeVideoModal, openInYouTube } from '../../static/js/modules/videoPlayer.js';

// Mock DOM Elements
const setupDomMocks = () => {
    // Create and add required elements to the document
    document.body.innerHTML = `
        <div id="videoModal" style="display: none;">
            <div class="modal-content">
                <button class="close-modal"></button>
            </div>
        </div>
        <div id="videoPlayer"></div>
        <div id="videoLoading"></div>
        <div id="videoTitle"></div>
        <div id="videoDescription"></div>
    `;
    
    // Mock focus methods
    Element.prototype.focus = jest.fn();
    
    // Setup event listener spies
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
};

// Mock window.open
global.open = jest.fn();

describe('Video Player Module', () => {
    beforeEach(() => {
        setupDomMocks();
        jest.clearAllMocks();
    });
    
    test('playVideo should show modal and update content', () => {
        const videoId = 'test123';
        const videoTitle = 'Test Video';
        const videoDesc = 'Test video description';
        
        // Store original document.activeElement
        document.activeElement = document.body;
        
        playVideo(videoId, videoTitle, videoDesc);
        
        // Check that the modal is displayed with flex
        expect(document.getElementById('videoModal').style.display).toBe('flex');
        
        // Check that video source was set
        expect(document.getElementById('videoPlayer').src).toContain(videoId);
        expect(document.getElementById('videoPlayer').src).toContain('autoplay=1');
        
        // Check that title and description are set
        expect(document.getElementById('videoTitle').textContent).toBe(videoTitle);
        expect(document.getElementById('videoDescription').textContent).toBe(videoDesc);
        
        // Check that focus was moved to close button
        expect(document.querySelector('.close-modal').focus).toHaveBeenCalled();
        
        // Check that event listeners were added
        expect(document.getElementById('videoModal').addEventListener).toHaveBeenCalledWith(
            'keydown', 
            expect.any(Function)
        );
    });
    
    test('closeVideoModal should hide modal and clean up', () => {
        // Setup video player with source
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.src = 'https://www.youtube.com/embed/test123';
        
        // Setup modal as visible
        const modal = document.getElementById('videoModal');
        modal.style.display = 'flex';
        
        // Call close function
        closeVideoModal();
        
        // Check that source was removed
        expect(videoPlayer.src).toBe('');
        
        // Check that modal is hidden
        expect(modal.style.display).toBe('none');
        
        // Check that focus trap was removed
        expect(modal.removeEventListener).toHaveBeenCalledWith(
            'keydown', 
            expect.any(Function)
        );
    });
    
    test('openInYouTube should open video in new tab', () => {
        // Set current video ID
        window.currentVideoId = 'test123';
        
        // Call function
        openInYouTube();
        
        // Check that window.open was called with correct URL
        expect(global.open).toHaveBeenCalledWith(
            'https://www.youtube.com/watch?v=test123', 
            '_blank'
        );
    });
    
    test('openInYouTube should not open anything if no current video', () => {
        // Set current video ID to empty
        window.currentVideoId = '';
        
        // Call function
        openInYouTube();
        
        // Check that window.open was not called
        expect(global.open).not.toHaveBeenCalled();
    });
});