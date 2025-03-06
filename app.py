from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime, timedelta
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from youtube.youtube_api import get_videos_for_channels, get_channel_videos, get_channel_id_from_url
import pytz

app = Flask(__name__)

# Add a secret key for session management
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))

# Define the server's time zone
SERVER_TZ = pytz.timezone('UTC')

# Load data from JSON file
def load_data():
    with open(os.path.join('data', 'data.json')) as f:
        data = json.load(f)
        validate_data(data)
        return data

# Validate data loaded from JSON file
def validate_data(data):
    required_fields = ['id', 'name', 'youtubeLinks', 'displayOption', 'stationId']
    for channel in data:
        for field in required_fields:
            if field not in channel:
                raise ValueError(f"Missing required field '{field}' in channel data")
        if not isinstance(channel['youtubeLinks'], list) or not all(isinstance(link, str) for link in channel['youtubeLinks']):
            raise ValueError("'youtubeLinks' must be a list of strings")
        if channel['displayOption'] not in ['random', 'popular', 'new']:
            raise ValueError("'displayOption' must be one of 'random', 'popular', or 'new'")

# Save data to JSON file
def save_data(data):
    with open(os.path.join('data', 'data.json'), 'w') as f:
        json.dump(data, f, indent=4)

# Get the current time in the server's time zone
def get_current_time():
    return datetime.now(SERVER_TZ)

# Determine if a video is in the current time slot
def is_current_time_slot(video_index, total_videos):
    now = get_current_time()
    minutes_since_midnight = now.hour * 60 + now.minute
    if total_videos == 0:
        return False
    minutes_per_slot = (24 * 60) / total_videos
    video_start_time = video_index * minutes_per_slot
    video_end_time = video_start_time + minutes_per_slot
    return video_start_time <= minutes_since_midnight < video_end_time

# Simple API key protection for API endpoints
def require_api_key(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):
        # For local development, skip API key check if env variable is set
        if os.getenv('SKIP_API_KEY_CHECK', '').lower() == 'true':
            return view_function(*args, **kwargs)
            
        # Get API key from request
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({"error": "API key is required"}), 401
            
        # Check if API key is valid (stored in environment variable)
        valid_api_key = os.getenv('API_ACCESS_KEY')
        if not valid_api_key or api_key != valid_api_key:
            return jsonify({"error": "Invalid API key"}), 401
            
        return view_function(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    data = load_data()
    # Add channel IDs to the data
    for channel in data:
        # Use the first YouTube link to get the channel ID
        if channel['youtubeLinks']:
            channel['channelId'] = get_channel_id_from_url(channel['youtubeLinks'][0])
    
    # Fetch videos for each channel
    channels_with_videos = get_videos_for_channels(data)
    
    # Update videos with current playing status
    for channel in channels_with_videos:
        if 'channelId' in channel and channel['channelId']:
            videos = get_channel_videos(channel['channelId'])
            if videos:
                # Only keep 3 videos for the 90-minute window
                channel['videos'] = videos[:3]
                
                # Mark videos as current or not based on time slot
                now = get_current_time()
                minutes_since_midnight = now.hour * 60 + now.minute
                for i, video in enumerate(channel['videos']):
                    if video:
                        start_time = minutes_since_midnight + (i * 30)
                        end_time = start_time + 30
                        video['is_current'] = (minutes_since_midnight >= start_time and 
                                            minutes_since_midnight < end_time)
    
    # Format current time and pass current datetime for time slots
    current_time = get_current_time().strftime("%I:%M %p")
    return render_template('index.html', 
                         channels=channels_with_videos, 
                         current_time=current_time,
                         now=get_current_time())

@app.route('/manage')
def manage():
    return render_template('manage.html')

# Protected API routes
@app.route('/api/channels')
@require_api_key
def api_channels():
    data = load_data()
    return jsonify(data)

@app.route('/api/channels/<channel_id>')
@require_api_key
def api_channel(channel_id):
    data = load_data()
    for channel in data:
        if channel['id'] == channel_id:
            return jsonify(channel)
    return jsonify({"error": "Channel not found"}), 404

@app.route('/api/channels', methods=['POST'])
@require_api_key
def add_channel():
    data = load_data()
    new_channel = request.json
    
    # Generate a new ID (one more than the highest existing ID)
    max_id = max([int(channel['id']) for channel in data]) if data else 0
    new_channel['id'] = str(max_id + 1)
    
    # Set default station ID if not provided
    if 'stationId' not in new_channel:
        max_station_id = max([channel.get('stationId', 200) for channel in data]) if data else 200
        new_channel['stationId'] = max_station_id + 1
    
    data.append(new_channel)
    save_data(data)
    
    return jsonify(new_channel), 201

@app.route('/api/channels/<channel_id>', methods=['PUT'])
@require_api_key
def update_channel(channel_id):
    data = load_data()
    updated_channel = request.json
    
    for i, channel in enumerate(data):
        if channel['id'] == channel_id:
            # Ensure ID remains the same
            updated_channel['id'] = channel_id
            data[i] = updated_channel
            save_data(data)
            return jsonify(updated_channel)
    
    return jsonify({"error": "Channel not found"}), 404

@app.route('/api/channels/<channel_id>', methods=['DELETE'])
@require_api_key
def delete_channel(channel_id):
    data = load_data()
    
    for i, channel in enumerate(data):
        if channel['id'] == channel_id:
            deleted_channel = data.pop(i)
            save_data(data)
            return jsonify(deleted_channel)
    
    return jsonify({"error": "Channel not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
