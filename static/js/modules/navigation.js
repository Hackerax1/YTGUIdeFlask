/**
 * Navigation module
 * Handles keyboard navigation and focus management
 */
import { playVideo } from './videoPlayer.js';

// Global variable to track current position in the program grid
let currentPosition = { row: 0, col: 0 };
let mouseTimer;

// Get the currently focused program element
function getCurrentProgram() {
    const rows = document.querySelectorAll('.guide-row');
    const currentRow = rows[currentPosition.row];
    if (!currentRow) return null;
    
    const programs = currentRow.querySelectorAll('.program');
    return programs[currentPosition.col] || null;
}

// Focus the program at the current position
function focusProgram() {
    // Remove previous focus
    document.querySelectorAll('.program.nav-focus').forEach(p => {
        p.classList.remove('nav-focus');
    });

    const program = getCurrentProgram();
    if (program) {
        program.classList.add('nav-focus');
        program.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Get help for keyboard shortcuts
function showKeyboardHelp() {
    alert('Keyboard Shortcuts:\n' +
          '- Arrow keys: Navigate through programs\n' +
          '- Enter or P: Play current video\n' +
          '- Escape: Close video or modal\n' +
          '- M: Go to Manage Channels page\n');
}

// Setup keyboard navigation event listeners
function setupKeyboardNavigation() {
    // Hide cursor when keyboard is used
    document.addEventListener('keydown', function() {
        document.body.classList.add('keyboard-mode');
    });

    document.addEventListener('mousemove', function() {
        document.body.classList.remove('keyboard-mode');
        clearTimeout(mouseTimer);
        mouseTimer = setTimeout(() => {
            if (!document.querySelector('.modal[style*="display: flex"]')) {
                document.body.classList.add('keyboard-mode');
            }
        }, 3000);
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('videoModal').style.display === 'flex') {
            return; // Don't handle navigation when modal is open
        }

        const grid = document.querySelector('.program-grid');
        const rows = document.querySelectorAll('.guide-row');
        const currentRow = rows[currentPosition.row];
        const programs = currentRow ? currentRow.querySelectorAll('.program') : [];

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (currentPosition.row > 0) {
                    currentPosition.row--;
                    focusProgram();
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (currentPosition.row < rows.length - 1) {
                    currentPosition.row++;
                    focusProgram();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (currentPosition.col > 0) {
                    currentPosition.col--;
                    focusProgram();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (currentPosition.col < programs.length - 1) {
                    currentPosition.col++;
                    focusProgram();
                }
                break;
            case 'Enter':
                e.preventDefault();
                const currentProgram = getCurrentProgram();
                if (currentProgram && currentProgram.classList.contains('current')) {
                    const videoId = currentProgram.dataset.videoId;
                    const videoTitle = currentProgram.dataset.videoTitle;
                    const videoDescription = currentProgram.dataset.description || 'No description available.';
                    playVideo(videoId, videoTitle, videoDescription);
                }
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                const currentProg = getCurrentProgram();
                if (currentProg && currentProg.classList.contains('current')) {
                    const videoId = currentProg.dataset.videoId;
                    const videoTitle = currentProg.dataset.videoTitle;
                    const videoDescription = currentProg.dataset.description || 'No description available.';
                    playVideo(videoId, videoTitle, videoDescription);
                }
                break;
            case 'Escape':
                // If any modal is open, close it
                const openModal = document.querySelector('.modal[style*="display: flex"]');
                if (openModal) {
                    // closeVideoModal is imported in index.js, so we'll emit a custom event
                    document.dispatchEvent(new CustomEvent('escapePressed'));
                }
                break;
            case 'm':
            case 'M':
                // Navigate to manage page
                window.location.href = '/manage';
                break;
            case 'h':
            case 'H':
            case '?':
                // Show keyboard shortcuts help
                showKeyboardHelp();
                break;
        }
    });
}

// Initialize navigation
function initNavigation() {
    setupKeyboardNavigation();
    focusProgram(); // Set initial focus
}

export { initNavigation, getCurrentProgram, focusProgram };