/**
 * Notification Manager Module
 * Handles system notifications, success/error messages, and form validation errors
 */

// Create container for notifications if it doesn't exist
function initNotificationContainer() {
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
    return container;
}

/**
 * Show a notification message
 * 
 * @param {string} message - The message to display
 * @param {string} type - The type of notification: 'success', 'error', or 'info'
 */
function showNotification(message, type = 'info') {
    const container = initNotificationContainer();
    
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

/**
 * Show form validation errors
 * 
 * @param {string[]} errors - Array of error messages to display
 */
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

/**
 * Clear all form error messages
 */
function clearFormErrors() {
    const errorContainers = document.querySelectorAll('.form-error-container');
    errorContainers.forEach(container => {
        container.parentNode.removeChild(container);
    });
}

/**
 * Set up event listeners for notification events
 */
function setupNotificationListeners() {
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

// Initialize the notification system
function initNotifications() {
    initNotificationContainer();
    setupNotificationListeners();
}

// Export the notification functions
export {
    initNotifications,
    showNotification,
    showFormErrors,
    clearFormErrors
};