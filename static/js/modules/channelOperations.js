/**
 * Channel Operations module
 * Handles loading, adding, editing, and deleting channels through the API
 * 
 * This module contains all the functions needed to interact with the backend API
 * for managing YouTube channels in the application. It handles authentication,
 * form validation, error handling, and success notifications.
 */

// API Key handling - retrieved from local storage for persistent authentication
const API_KEY = localStorage.getItem('api_key') || '';

/**
 * Helper function for making authenticated API requests
 * 
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options like method, headers, body
 * @returns {Promise} - The fetch promise
 */
function apiRequest(url, options = {}) {
    const headers = {
        ...(options.headers || {}),
        'X-API-Key': API_KEY
    };

    return fetch(url, {
        ...options,
        headers
    });
}

/**
 * Loads channels from the API with pagination support
 * 
 * @param {number} page - The page number to load (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Promise<Array>} - Promise resolving to the channels array
 */
function loadChannels(page = 1, pageSize = 10) {
    return apiRequest(`/api/channels?page=${page}&pageSize=${pageSize}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: API key is missing or invalid');
                }
                throw new Error('Failed to load channels');
            }
            return response.json();
        })
        .then(data => {
            const { channels, totalPages } = data;
            const tbody = document.getElementById('channels-tbody');
            tbody.innerHTML = '';
            
            // Create table rows for each channel
            channels.forEach(channel => {
                const tr = document.createElement('tr');
                
                const tdStationId = document.createElement('td');
                tdStationId.textContent = channel.stationId;
                
                const tdName = document.createElement('td');
                tdName.textContent = channel.name;
                
                const tdDisplayOption = document.createElement('td');
                tdDisplayOption.textContent = channel.displayOption;
                
                const tdLinks = document.createElement('td');
                tdLinks.innerHTML = channel.youtubeLinks.join('<br>');
                
                const tdActions = document.createElement('td');
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.className = 'edit-btn';
                editBtn.onclick = () => editChannel(channel);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete-btn';
                deleteBtn.onclick = () => deleteChannel(channel.id);
                
                tdActions.appendChild(editBtn);
                tdActions.appendChild(document.createTextNode(' '));
                tdActions.appendChild(deleteBtn);
                
                tr.appendChild(tdStationId);
                tr.appendChild(tdName);
                tr.appendChild(tdDisplayOption);
                tr.appendChild(tdLinks);
                tr.appendChild(tdActions);
                
                tbody.appendChild(tr);
            });
            
            // Add pagination controls if totalPages is provided
            const paginationControls = document.getElementById('pagination-controls');
            if (paginationControls) {
                paginationControls.innerHTML = '';
                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.textContent = i;
                    pageBtn.onclick = () => loadChannels(i, pageSize);
                    // Highlight the current page
                    if (i === page) {
                        pageBtn.classList.add('current-page');
                    }
                    paginationControls.appendChild(pageBtn);
                }
            }
            
            return channels;
        })
        .catch(error => {
            console.error('Error loading channels:', error);
            document.dispatchEvent(new CustomEvent('operation-error', { 
                detail: { message: 'Failed to load channels. ' + error.message } 
            }));
            return [];
        });
}

/**
 * Deletes a channel after confirmation
 * 
 * @param {string} channelId - The ID of the channel to delete
 */
function deleteChannel(channelId) {
    // Dispatch event to show confirmation dialog with a callback
    document.dispatchEvent(new CustomEvent('show-confirm-dialog', { 
        detail: { 
            channelId: channelId,
            title: 'Confirm Deletion',
            message: 'Are you sure you want to delete this channel?',
            confirmHandler: (confirmedChannelId) => {
                // This function is called when the user confirms the deletion
                apiRequest(`/api/channels/${confirmedChannelId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error('Unauthorized: API key is missing or invalid');
                        }
                        throw new Error('Failed to delete channel');
                    }
                    return response.json();
                })
                .then(() => {
                    loadChannels(); // Reload the channels list
                    document.dispatchEvent(new CustomEvent('operation-success', { 
                        detail: { message: 'Channel deleted successfully!' } 
                    }));
                })
                .catch(error => {
                    console.error('Error deleting channel:', error);
                    document.dispatchEvent(new CustomEvent('operation-error', { 
                        detail: { message: 'Failed to delete channel. ' + error.message } 
                    }));
                });
            }
        } 
    }));
}

/**
 * Opens the edit form and populates it with channel data
 * 
 * @param {Object} channel - The channel object to edit
 */
function editChannel(channel) {
    document.getElementById('edit-channel-id').value = channel.id;
    document.getElementById('edit-channel-name').value = channel.name;
    document.getElementById('edit-station-id').value = channel.stationId;
    document.getElementById('edit-display-option').value = channel.displayOption;
    
    const editLinksDiv = document.getElementById('edit-youtube-links');
    editLinksDiv.innerHTML = '';
    
    // Populate YouTube links in edit form
    channel.youtubeLinks.forEach(link => {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'link-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'youtube-link';
        input.value = link;
        input.required = true;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-link-btn';
        removeBtn.textContent = '✕';
        removeBtn.onclick = function() {
            // Prevent removing the last link
            if (editLinksDiv.children.length > 1) {
                editLinksDiv.removeChild(linkContainer);
            }
        };
        
        linkContainer.appendChild(input);
        linkContainer.appendChild(removeBtn);
        editLinksDiv.appendChild(linkContainer);
    });
    
    // Show the edit section and scroll to it
    document.getElementById('edit-section').style.display = 'block';
    document.getElementById('edit-section').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Validates channel data before submission
 * 
 * @param {Object} formData - Channel data to validate
 * @returns {Array} - Array of validation error messages, empty if valid
 */
function validateChannelData(formData) {
    const errors = [];
    
    // Validate name
    if (!formData.name || formData.name.trim() === '') {
        errors.push('Channel name is required');
    }
    
    // Validate station ID
    if (isNaN(formData.stationId) || formData.stationId <= 0) {
        errors.push('Station ID must be a positive number');
    }
    
    // Validate YouTube links
    if (!formData.youtubeLinks || formData.youtubeLinks.length === 0) {
        errors.push('At least one YouTube channel link is required');
    } else {
        // Check if all links are valid YouTube URLs
        const invalidLinks = formData.youtubeLinks.filter(link => {
            return !link.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i);
        });
        
        if (invalidLinks.length > 0) {
            errors.push('One or more YouTube links are invalid');
        }
    }
    
    return errors;
}

/**
 * Adds a new channel to the application
 * 
 * @param {Object} formData - The channel data to add
 * @returns {Promise} - Promise that resolves when the channel is added
 */
function addChannel(formData) {
    // Validate form data first
    const validationErrors = validateChannelData(formData);
    if (validationErrors.length > 0) {
        document.dispatchEvent(new CustomEvent('validation-error', { 
            detail: { messages: validationErrors } 
        }));
        return Promise.reject(new Error('Validation failed'));
    }
    
    return apiRequest('/api/channels', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized: API key is missing or invalid');
            }
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Invalid channel data');
                });
            }
            throw new Error(`Server error (${response.status})`);
        }
        return response.json();
    })
    .then(() => {
        document.dispatchEvent(new CustomEvent('operation-success', { 
            detail: { message: 'Channel added successfully!' } 
        }));
        return loadChannels();
    })
    .catch(error => {
        console.error('Error adding channel:', error);
        document.dispatchEvent(new CustomEvent('operation-error', { 
            detail: { message: 'Failed to add channel. ' + error.message } 
        }));
        return Promise.reject(error);
    });
}

/**
 * Updates an existing channel
 * 
 * @param {string} channelId - The ID of the channel to update
 * @param {Object} formData - Updated channel data
 * @returns {Promise} - Promise that resolves when the channel is updated
 */
function updateChannel(channelId, formData) {
    // Validate form data first
    const validationErrors = validateChannelData(formData);
    if (validationErrors.length > 0) {
        document.dispatchEvent(new CustomEvent('validation-error', { 
            detail: { messages: validationErrors } 
        }));
        return Promise.reject(new Error('Validation failed'));
    }
    
    return apiRequest(`/api/channels/${channelId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized: API key is missing or invalid');
            }
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Invalid channel data');
                });
            } else if (response.status === 404) {
                throw new Error('Channel not found');
            }
            throw new Error(`Server error (${response.status})`);
        }
        return response.json();
    })
    .then(() => {
        document.dispatchEvent(new CustomEvent('operation-success', { 
            detail: { message: 'Channel updated successfully!' } 
        }));
        return loadChannels();
    })
    .catch(error => {
        console.error('Error updating channel:', error);
        document.dispatchEvent(new CustomEvent('operation-error', { 
            detail: { message: 'Failed to update channel. ' + error.message } 
        }));
        return Promise.reject(error);
    });
}

/**
 * Set API key in local storage for persistent authentication
 * 
 * @param {string} key - API key to store
 */
function setApiKey(key) {
    localStorage.setItem('api_key', key);
}

/**
 * Get the stored API key from local storage
 * 
 * @returns {string} - The stored API key or empty string
 */
function getApiKey() {
    return localStorage.getItem('api_key') || '';
}

export { 
    loadChannels, 
    deleteChannel, 
    editChannel, 
    addChannel,
    updateChannel,
    validateChannelData,
    setApiKey,
    getApiKey
};