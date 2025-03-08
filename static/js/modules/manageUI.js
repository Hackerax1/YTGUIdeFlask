/**
 * Manage UI module
 * Handles UI interactions and form operations for channel management
 */

// Import functionality from specialized modules
import { 
    initNotifications, 
    showNotification, 
    clearFormErrors 
} from './notificationManager.js';

import { 
    initDialogs 
} from './dialogManager.js';

// Set up event listeners for remove link buttons in the add form
function setupRemoveLinkListeners() {
    const removeBtns = document.querySelectorAll('#youtube-links .remove-link-btn');
    removeBtns.forEach(btn => {
        btn.onclick = function() {
            const youtubeLinksDiv = document.getElementById('youtube-links');
            if (youtubeLinksDiv.children.length > 1) {
                youtubeLinksDiv.removeChild(btn.parentNode);
            }
        };
    });
}

// Setup form helpers
function setupFormHelpers() {
    // Add new link in the add form
    document.getElementById('add-link-btn').addEventListener('click', function() {
        const youtubeLinksDiv = document.getElementById('youtube-links');
        const linkContainer = document.createElement('div');
        linkContainer.className = 'link-container';
        
        linkContainer.innerHTML = `
            <input type="text" class="youtube-link" placeholder="https://www.youtube.com/channel/..." required>
            <button type="button" class="remove-link-btn">✕</button>
        `;
        
        youtubeLinksDiv.appendChild(linkContainer);
        setupRemoveLinkListeners();
    });
    
    // Add new link in the edit form
    document.getElementById('edit-add-link-btn').addEventListener('click', function() {
        const editLinksDiv = document.getElementById('edit-youtube-links');
        const linkContainer = document.createElement('div');
        linkContainer.className = 'link-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'youtube-link';
        input.placeholder = 'https://www.youtube.com/channel/...';
        input.required = true;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-link-btn';
        removeBtn.textContent = '✕';
        removeBtn.onclick = function() {
            editLinksDiv.removeChild(linkContainer);
        };
        
        linkContainer.appendChild(input);
        linkContainer.appendChild(removeBtn);
        editLinksDiv.appendChild(linkContainer);
    });
    
    // Cancel edit button
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        document.getElementById('edit-section').style.display = 'none';
    });
}

// Reset the add channel form
function resetAddChannelForm() {
    document.getElementById('add-channel-form').reset();
    // Reset to just one YouTube link input
    const youtubeLinksDiv = document.getElementById('youtube-links');
    youtubeLinksDiv.innerHTML = `
        <div class="link-container">
            <input type="text" class="youtube-link" placeholder="https://www.youtube.com/channel/..." required>
            <button type="button" class="remove-link-btn">✕</button>
        </div>
    `;
    setupRemoveLinkListeners();
}

// Handle validation errors
function handleValidationErrors(event) {
    const messages = event.detail.messages;
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    messages.forEach(message => {
        const errorItem = document.createElement('p');
        errorItem.className = 'error-message';
        errorItem.textContent = message;
        errorContainer.appendChild(errorItem);
    });
    const form = document.querySelector('form');
    form.insertBefore(errorContainer, form.firstChild);
}

// Listen for validation errors
function setupValidationErrorListener() {
    document.addEventListener('validation-error', handleValidationErrors);
}

// Initialize all UI components
function initManageUI() {
    // Initialize dialog and notification systems
    initDialogs();
    initNotifications();
    
    // Set up form interactions
    setupRemoveLinkListeners();
    setupFormHelpers();
    setupValidationErrorListener();
    
    // Clear form errors when forms are reset or submitted successfully
    document.getElementById('add-channel-form').addEventListener('reset', clearFormErrors);
    document.getElementById('edit-channel-form').addEventListener('reset', clearFormErrors);
    
    // Also clear errors when user starts typing/interacting with form again
    ['add-channel-form', 'edit-channel-form'].forEach(formId => {
        document.getElementById(formId).addEventListener('input', clearFormErrors);
    });
}

export {
    initManageUI,
    resetAddChannelForm,
    setupRemoveLinkListeners,
    showNotification,
    clearFormErrors
};