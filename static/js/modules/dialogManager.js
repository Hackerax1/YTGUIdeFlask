/**
 * Dialog Manager Module
 * Handles confirmation dialogs and modal interactions
 */

/**
 * Sets up the confirmation dialog functionality
 * Creates event listeners for the dialog events and buttons
 */
function setupConfirmDialog() {
    const dialog = document.getElementById('confirmDialog');
    if (!dialog) return;
    
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

/**
 * Show a confirmation dialog with custom title, message and handler
 * 
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} entityId - ID of the entity to act upon (e.g., channelId)
 * @param {function} confirmHandler - Function to call when confirmed
 */
function showConfirmDialog(title, message, entityId, confirmHandler) {
    document.dispatchEvent(new CustomEvent('show-confirm-dialog', { 
        detail: { 
            channelId: entityId,
            title: title,
            message: message,
            confirmHandler: confirmHandler
        } 
    }));
}

/**
 * Initialize the dialog system
 */
function initDialogs() {
    setupConfirmDialog();
}

// Export dialog functions
export {
    initDialogs,
    showConfirmDialog
};