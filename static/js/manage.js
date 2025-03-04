// Switch between themes
function switchTheme(theme) {
    document.getElementById('themeStylesheet').href = '/static/css/' + theme;
}

// Load all channels from API
function loadChannels() {
    fetch('/api/channels')
        .then(response => response.json())
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
        })
        .catch(error => console.error('Error loading channels:', error));
}

// Delete a channel
function deleteChannel(channelId) {
    if (confirm('Are you sure you want to delete this channel?')) {
        fetch(`/api/channels/${channelId}`, {
            method: 'DELETE'
        })
        .then(() => loadChannels())
        .catch(error => console.error('Error deleting channel:', error));
    }
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadChannels();
    setupRemoveLinkListeners();
    
    // Add new channel form submission
    document.getElementById('add-channel-form').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const name = document.getElementById('channel-name').value;
        const stationId = parseInt(document.getElementById('station-id').value);
        const displayOption = document.getElementById('display-option').value;
        
        const youtubeLinks = Array.from(document.querySelectorAll('.youtube-link'))
            .map(input => input.value)
            .filter(link => link.trim() !== '');
            
        const newChannel = {
            name,
            stationId,
            displayOption,
            youtubeLinks
        };
        
        fetch('/api/channels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newChannel)
        })
        .then(response => response.json())
        .then(() => {
            loadChannels();
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
        })
        .catch(error => console.error('Error adding channel:', error));
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
        
        fetch(`/api/channels/${channelId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedChannel)
        })
        .then(response => response.json())
        .then(() => {
            loadChannels();
            document.getElementById('edit-section').style.display = 'none';
        })
        .catch(error => console.error('Error updating channel:', error));
    });
    
    // Cancel edit button click
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        document.getElementById('edit-section').style.display = 'none';
    });
    
    // Add another YouTube link in add form
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
    
    // Add another YouTube link in edit form
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
});