/**
 * Integration tests for Channel Operations and UI interaction
 * 
 * Tests the interaction between channelOperations.js and manageUI.js
 */

import { addChannel, deleteChannel, editChannel } from '../../static/js/modules/channelOperations.js';
import { showNotification, clearFormErrors } from '../../static/js/modules/manageUI.js';

// Mock fetch for API calls
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: "9", name: "Test Channel" })
    })
);

describe('Channel Operations and UI Integration', () => {
    // Setup DOM and event listeners
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="notification-container"></div>
            <div id="channels-tbody"></div>
            <form id="add-channel-form">
                <input id="channel-name" value="Test Channel">
                <input id="station-id" value="209">
                <select id="display-option">
                    <option value="random" selected>Random</option>
                </select>
                <div id="youtube-links">
                    <div class="link-container">
                        <input class="youtube-link" value="https://www.youtube.com/channel/UC123">
                    </div>
                </div>
                <button type="submit">Add Channel</button>
            </form>
            <div id="edit-section" style="display: none;">
                <form id="edit-channel-form">
                    <input id="edit-channel-id" value="5">
                    <input id="edit-channel-name" value="Updated Channel">
                    <input id="edit-station-id" value="205">
                    <select id="edit-display-option">
                        <option value="popular" selected>Popular</option>
                    </select>
                    <div id="edit-youtube-links">
                        <div class="link-container">
                            <input class="youtube-link" value="https://www.youtube.com/channel/UC456">
                        </div>
                    </div>
                </form>
            </div>
            <div id="confirmDialog" style="display: none;">
                <div class="confirm-content">
                    <button id="confirmYes"></button>
                    <button id="confirmNo"></button>
                </div>
            </div>
        `;
        
        // Setup event listener mocking
        document.dispatchEvent = jest.fn();
        document.addEventListener = jest.fn();
    });
    
    test('addChannel should show notification on success', async () => {
        // Create event spy
        const eventSpy = jest.spyOn(document, 'dispatchEvent');
        
        // Mock channel data
        const channelData = {
            name: 'Test Channel',
            stationId: 209,
            displayOption: 'random',
            youtubeLinks: ['https://www.youtube.com/channel/UC123']
        };
        
        // Call addChannel
        await addChannel(channelData);
        
        // Verify success notification was displayed
        expect(eventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'CustomEvent',
                detail: expect.objectContaining({
                    message: expect.stringContaining('success')
                })
            })
        );
    });
    
    test('deleteChannel should show confirmation dialog', () => {
        // Mock show-confirm-dialog event
        const eventSpy = jest.spyOn(document, 'dispatchEvent');
        
        // Call deleteChannel
        deleteChannel('5');
        
        // Verify confirmation dialog was shown
        expect(eventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'CustomEvent',
                detail: expect.objectContaining({
                    channelId: '5',
                    confirmHandler: expect.any(Function)
                })
            })
        );
    });
    
    test('editChannel should populate form fields correctly', () => {
        // Mock channel data
        const channel = {
            id: '5',
            name: 'Test Channel',
            stationId: 205,
            displayOption: 'popular',
            youtubeLinks: ['https://www.youtube.com/channel/UC123', 'https://www.youtube.com/channel/UC456']
        };
        
        // Call editChannel
        editChannel(channel);
        
        // Verify form fields were populated
        expect(document.getElementById('edit-channel-id').value).toBe('5');
        expect(document.getElementById('edit-channel-name').value).toBe('Test Channel');
        expect(document.getElementById('edit-station-id').value).toBe('205');
        expect(document.getElementById('edit-display-option').value).toBe('popular');
        
        // Verify YouTube links were added
        const linkInputs = document.querySelectorAll('#edit-youtube-links .youtube-link');
        expect(linkInputs.length).toBe(2);
        expect(linkInputs[0].value).toBe('https://www.youtube.com/channel/UC123');
        expect(linkInputs[1].value).toBe('https://www.youtube.com/channel/UC456');
        
        // Verify edit section is displayed
        expect(document.getElementById('edit-section').style.display).toBe('block');
    });
    
    test('validation errors should be displayed in UI', async () => {
        const eventSpy = jest.spyOn(document, 'dispatchEvent');
        
        // Create invalid channel data
        const invalidChannel = {
            name: '',
            stationId: -1,
            youtubeLinks: []
        };
        
        // Try to add invalid channel
        try {
            await addChannel(invalidChannel);
        } catch (error) {
            // Expected error
        }
        
        // Verify validation errors were displayed
        expect(eventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'CustomEvent',
                detail: expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.stringContaining('name'),
                        expect.stringContaining('Station ID'),
                        expect.stringContaining('YouTube')
                    ])
                })
            })
        );
    });
});