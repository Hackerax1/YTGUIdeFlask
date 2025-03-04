from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime
from youtube_api import get_videos_for_channels

app = Flask(__name__)

# Load data from JSON file
def load_data():
    with open(os.path.join('data', 'data.json')) as f:
        return json.load(f)

# Save data to JSON file
def save_data(data):
    with open(os.path.join('data', 'data.json'), 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def index():
    data = load_data()
    # Fetch videos for each channel
    channels_with_videos = get_videos_for_channels(data)
    # Format current time for display
    current_time = datetime.now().strftime("%I:%M %p")
    return render_template('index.html', channels=channels_with_videos, current_time=current_time)

@app.route('/manage')
def manage():
    return render_template('manage.html')

@app.route('/api/channels')
def api_channels():
    data = load_data()
    return jsonify(data)

@app.route('/api/channels/<channel_id>')
def api_channel(channel_id):
    data = load_data()
    for channel in data:
        if channel['id'] == channel_id:
            return jsonify(channel)
    return jsonify({"error": "Channel not found"}), 404

@app.route('/api/channels', methods=['POST'])
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
