/**
 * Channel Operations module
 * Handles loading, adding, editing, and deleting channels
 */

// API Key handling
const API_KEY = localStorage.getItem('api_key') || '';

// Helper function for API requests with auth header
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

// Load all channels from API
function loadChannels() {
    return apiRequest('/api/channels')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: API key is missing or invalid');
                }
                throw new Error('Failed to load channels');
            }
            return response.json();
        })
        .then(channels => {
            const tbody = document.getElementById('channels-tbody');
            tbody.innerHTML = '';
            
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

// Delete a channel with custom confirmation dialog
function deleteChannel(channelId) {
    // Dispatch event to show confirmation dialog 
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
                    loadChannels();
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

// Open the edit form for a channel
function editChannel(channel) {
    document.getElementById('edit-channel-id').value = channel.id;
    document.getElementById('edit-channel-name').value = channel.name;
    document.getElementById('edit-station-id').value = channel.stationId;
    document.getElementById('edit-display-option').value = channel.displayOption;
    
    const editLinksDiv = document.getElementById('edit-youtube-links');
    editLinksDiv.innerHTML = '';
    
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
            if (editLinksDiv.children.length > 1) {
                editLinksDiv.removeChild(linkContainer);
            }
        };
        
        linkContainer.appendChild(input);
        linkContainer.appendChild(removeBtn);
        editLinksDiv.appendChild(linkContainer);
    });
    
    document.getElementById('edit-section').style.display = 'block';
    document.getElementById('edit-section').scrollIntoView({ behavior: 'smooth' });
}

// Validate channel form data
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

// Add a new channel
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

// Update an existing channel
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

// Set API key in local storage
function setApiKey(key) {
    localStorage.setItem('api_key', key);
}

// Get API key from local storage
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