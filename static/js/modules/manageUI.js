/**
 * Manage UI module
 * Handles UI interactions, dialogs, and form operations for channel management
 */

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

// Setup confirmation dialog functionality
function setupConfirmDialog() {
    const dialog = document.getElementById('confirmDialog');
    
    // Listen for the custom event to show the dialog
    document.addEventListener('show-confirm-dialog', function(e) {
        const detail = e.detail;
        const confirmYesBtn = document.getElementById('confirmYes');
        
        // Store the channel ID and handler in the button
        confirmYesBtn.dataset.channelId = detail.channelId;
        confirmYesBtn._confirmHandler = detail.confirmHandler;
        
        // Update dialog content if provided
        if (detail.title) {
            dialog.querySelector('h3').textContent = detail.title;
        }
        if (detail.message) {
            dialog.querySelector('p').textContent = detail.message;
        }
        
        // Show the dialog
        dialog.style.display = 'flex';
    });
    
    // Setup handlers for the dialog buttons
    document.getElementById('confirmYes').addEventListener('click', function() {
        const channelIdToDelete = this.dataset.channelId;
        const handler = this._confirmHandler;
        
        if (typeof handler === 'function') {
            handler(channelIdToDelete);
        }
        
        dialog.style.display = 'none';
    });
    
    document.getElementById('confirmNo').addEventListener('click', function() {
        dialog.style.display = 'none';
    });
}

// Create a notification system for success and error messages
function setupNotifications() {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Handle success messages
    document.addEventListener('operation-success', function(e) {
        showNotification(e.detail.message, 'success');
    });
    
    // Handle error messages
    document.addEventListener('operation-error', function(e) {
        showNotification(e.detail.message, 'error');
    });
    
    // Handle validation errors
    document.addEventListener('validation-error', function(e) {
        const messages = e.detail.messages;
        // Display each validation error as a separate notification
        messages.forEach(message => {
            showNotification(message, 'error');
        });
        
        // Also show the errors in the form
        showFormErrors(messages);
    });
}

// Show a notification message
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.padding = '10px 15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    
    // Set colors based on notification type
    if (type === 'success') {
        notification.style.backgroundColor = '#5cb85c';
        notification.style.color = 'white';
        notification.style.borderLeft = '5px solid #4cae4c';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#d9534f';
        notification.style.color = 'white';
        notification.style.borderLeft = '5px solid #c9302c';
    } else {
        notification.style.backgroundColor = '#5bc0de';
        notification.style.color = 'white';
        notification.style.borderLeft = '5px solid #46b8da';
    }
    
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.float = 'right';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = function() {
        container.removeChild(notification);
    };
    
    notification.appendChild(closeBtn);
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode === container) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode === container) {
                    container.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Show errors in the form
function showFormErrors(errors) {
    // Clear any previous error messages
    clearFormErrors();
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'form-error-container';
    errorContainer.style.backgroundColor = '#f8d7da';
    errorContainer.style.color = '#721c24';
    errorContainer.style.padding = '10px';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.marginBottom = '15px';
    errorContainer.style.border = '1px solid #f5c6cb';
    
    // Create title
    const errorTitle = document.createElement('h4');
    errorTitle.style.margin = '0 0 10px 0';
    errorTitle.textContent = 'Please fix the following issues:';
    errorContainer.appendChild(errorTitle);
    
    // Create error list
    const errorList = document.createElement('ul');
    errorList.style.paddingLeft = '20px';
    errorList.style.margin = '0';
    
    errors.forEach(error => {
        const item = document.createElement('li');
        item.textContent = error;
        errorList.appendChild(item);
    });
    
    errorContainer.appendChild(errorList);
    
    // Find the active form
    let targetForm;
    if (document.getElementById('edit-section').style.display === 'block') {
        targetForm = document.getElementById('edit-channel-form');
    } else {
        targetForm = document.getElementById('add-channel-form');
    }
    
    // Insert the error container at the top of the form
    targetForm.insertBefore(errorContainer, targetForm.firstChild);
    
    // Scroll to the errors
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Clear form errors
function clearFormErrors() {
    const errorContainers = document.querySelectorAll('.form-error-container');
    errorContainers.forEach(container => {
        container.parentNode.removeChild(container);
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
    setupRemoveLinkListeners();
    setupConfirmDialog();
    setupNotifications();
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