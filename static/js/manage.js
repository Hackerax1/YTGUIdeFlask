/**
 * Main manage.js file
 * Entry point for the channel management functionality
 */
import { switchTheme, loadSavedTheme } from './modules/theme.js';
import { loadChannels, deleteChannel, editChannel, addChannel, updateChannel } from './modules/channelOperations.js';
import { initManageUI, resetAddChannelForm } from './modules/manageUI.js';

// Make theme functions available globally for HTML attributes
window.switchTheme = switchTheme;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load saved theme preference
    loadSavedTheme();
    
    // Initialize UI components
    initManageUI();
    
    // Load channels data
    loadChannels();
    
    // Add new channel form submission
    document.getElementById('add-channel-form').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const name = document.getElementById('channel-name').value;
        const stationId = parseInt(document.getElementById('station-id').value);
        const displayOption = document.getElementById('display-option').value;
        
        const youtubeLinks = Array.from(document.querySelectorAll('#youtube-links .youtube-link'))
            .map(input => input.value)
            .filter(link => link.trim() !== '');
            
        const newChannel = {
            name,
            stationId,
            displayOption,
            youtubeLinks
        };
        
        addChannel(newChannel)
            .then(() => {
                resetAddChannelForm();
            })
            .catch(error => {
                console.error('Form submission error:', error);
            });
    });
    
    // Update channel form submission
    document.getElementById('edit-channel-form').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const channelId = document.getElementById('edit-channel-id').value;
        const name = document.getElementById('edit-channel-name').value;
        const stationId = parseInt(document.getElementById('edit-station-id').value);
        const displayOption = document.getElementById('edit-display-option').value;
        
        const youtubeLinks = Array.from(document.querySelectorAll('#edit-youtube-links .youtube-link'))
            .map(input => input.value)
            .filter(link => link.trim() !== '');
            
        const updatedChannel = {
            name,
            stationId,
            displayOption,
            youtubeLinks
        };
        
        updateChannel(channelId, updatedChannel)
            .then(() => {
                document.getElementById('edit-section').style.display = 'none';
            })
            .catch(error => {
                console.error('Form update error:', error);
            });
    });
});

// Make functions available for direct HTML usage
window.deleteChannel = deleteChannel;
window.editChannel = editChannel;