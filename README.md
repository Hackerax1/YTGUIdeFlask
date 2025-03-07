# TubeGuide Flask Application

This application creates a nostalgic 2000s-style TV guide interface for browsing YouTube channels and their videos. It allows you to organize YouTube channels into "stations" and displays videos based on your preferred sorting method.

## Features

- **Authentic 2000s TV Guide Experience**: Three different themes inspired by classic TV guides
- **Smart Video Sorting**: Show videos based on your preference - popular, newest, or random
- **Built-in Video Player**: Watch videos directly within the app without leaving the TV guide interface
- **Channel Management**: Add, edit, and delete YouTube channels through a user-friendly interface
- **YouTube API Integration**: Automatically fetches video information from YouTube channels
- **Support for All YouTube URL Types**: Works with channel IDs, usernames, custom URLs, and handle formats

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/youtube-tv-guide.git
cd youtube-tv-guide
```

2. Create and activate a virtual environment (optional but recommended):

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. Install the dependencies:

```bash
pip install -r requirements.txt
```

4. Set up your environment variables:
   - Create a `.env` file in the root directory
   - Add your YouTube API key and other configuration options:
   ```
   VITE_YT_API_KEY=your_youtube_api_key_here
   FLASK_SECRET_KEY=your_flask_secret_key_here
   API_ACCESS_KEY=your_api_access_key_here
   SKIP_API_KEY_CHECK=false
   ```

5. Run the application:

```bash
python app.py
```

6. Open your browser and go to `http://127.0.0.1:5000` to view the TV Guide.

## How to Use

### Browsing the Guide
- The main page shows your channels organized like a TV guide
- Each channel displays videos according to your selected display option (random, popular, or new)
- Click on any video thumbnail to watch it within the embedded video player
- You can also open videos directly on YouTube from the player controls
- Switch between themes using the buttons at the top of the page

### Managing Channels
1. Click the "Manage Channels" button at the bottom of the main page
2. On the management page, you can:
   - View all your current channels and their details
   - Add new channels with custom station IDs
   - Edit existing channels
   - Delete channels you no longer want

### Adding a New Channel
1. Go to the management page
2. Fill in the channel details:
   - **Channel Name**: A descriptive name for your channel
   - **Station ID**: A unique number that identifies the channel (like traditional TV channels)
   - **Display Option**: Choose how videos are sorted:
     - `random`: Shows randomly selected videos from the channel
     - `popular`: Shows the most popular videos by view count
     - `new`: Shows the newest videos first
   - **YouTube Channel Links**: Add one or more YouTube channel URLs in any of these formats:
     - Channel ID: `https://www.youtube.com/channel/CHANNEL_ID`
     - Custom URL: `https://www.youtube.com/c/CUSTOM_NAME`
     - Username: `https://www.youtube.com/user/USERNAME`
     - Handle: `https://www.youtube.com/@handle`
3. Click "Add Channel" to save

## Themes

The application includes three themes:
1. **Classic Guide**: A clean, light theme reminiscent of newspaper TV guides
2. **Night Mode**: A dark theme that's easier on the eyes in low-light conditions
3. **Retro Guide**: A colorful theme with gradients and vibrant colors from the early 2000s

## Video Player Features

The built-in video player allows you to:
- Watch YouTube videos directly within the application
- See video titles and basic information
- Open the video in YouTube for additional features
- Seamlessly return to the guide after watching

## Troubleshooting

- **No videos showing**: Make sure your YouTube API key is correct and has the necessary permissions
- **API quota exceeded**: The YouTube Data API has daily quotas. If exceeded, videos won't load until the quota resets
- **Invalid channel URL**: The app supports multiple URL formats but may have trouble with some custom URLs. Try using the direct channel URL format if others don't work
- **Video player not working**: Some videos may have embedding disabled by the creator. You can still open these in YouTube directly

## Contributing

Contributions are welcome! Feel free to submit a pull request or create an issue if you have ideas for improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
