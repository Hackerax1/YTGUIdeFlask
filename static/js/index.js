// Global variables
let currentVideoId = '';

// Switch between themes
function switchTheme(theme) {
    document.getElementById('themeStylesheet').href = '/static/css/' + theme;
}

// Play a YouTube video in the modal
function playVideo(videoId, videoTitle) {
    // Set video ID for reference
    currentVideoId = videoId;
    
    // Update iframe source
    const player = document.getElementById('videoPlayer');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    
    // Update title
    document.getElementById('videoTitle').textContent = videoTitle;
    
    // Show the modal
    document.getElementById('videoModal').style.display = 'flex';
}

// Close the video modal
function closeVideoModal() {
    // Stop the video by removing the src
    document.getElementById('videoPlayer').src = '';
    
    // Hide the modal
    document.getElementById('videoModal').style.display = 'none';
}

// Open the current video in YouTube
function openInYouTube() {
    if (currentVideoId) {
        window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
    }
}

// Update the current time display
function updateTime() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const displayHours = (hours === 0 ? 12 : hours).toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    document.querySelector('.current-time').textContent = `${displayHours}:${minutes} ${ampm}`;
}

// Initialize event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside the content
    window.onclick = function(event) {
        const modal = document.getElementById('videoModal');
        if (event.target == modal) {
            closeVideoModal();
        }
    };
    
    // Update time on load and every minute
    updateTime();
    setInterval(updateTime, 60000);
});