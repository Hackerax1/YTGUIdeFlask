import os
import random
from datetime import datetime, timedelta
import googleapiclient.discovery
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Get API key from environment
API_KEY = os.getenv('VITE_YT_API_KEY')

if not API_KEY:
    raise ValueError("YouTube API key not found. Make sure you have a .env file with VITE_YT_API_KEY set.")

# Initialize YouTube API client with explicit API key authentication
youtube = googleapiclient.discovery.build(
    'youtube', 
    'v3', 
    developerKey=API_KEY,
    # Skip authentication if possible
    static_discovery=False
)

def get_channel_id_from_url(channel_url):
    """Extract channel ID from various forms of YouTube channel URLs.
    
    Supported formats:
    - https://www.youtube.com/channel/CHANNEL_ID
    - https://www.youtube.com/c/CUSTOM_URL
    - https://www.youtube.com/user/USERNAME
    - https://www.youtube.com/@handle
    """
    # Direct channel ID format: youtube.com/channel/CHANNEL_ID
    channel_match = re.search(r'youtube\.com/channel/([^/?&]+)', channel_url)
    if channel_match:
        return channel_match.group(1)
    
    # For other formats, we need to query the API to get the channel ID
    try:
        # Handle custom URL format: youtube.com/c/CUSTOM_URL
        custom_match = re.search(r'youtube\.com/c/([^/?&]+)', channel_url)
        if custom_match:
            custom_url = custom_match.group(1)
            return get_channel_id_by_search(custom_url)
            
        # Handle username format: youtube.com/user/USERNAME
        user_match = re.search(r'youtube\.com/user/([^/?&]+)', channel_url)
        if user_match:
            username = user_match.group(1)
            return get_channel_id_by_username(username)
            
        # Handle handle format: youtube.com/@handle
        handle_match = re.search(r'youtube\.com/@([^/?&]+)', channel_url)
        if handle_match:
            handle = handle_match.group(1)
            return get_channel_id_by_search(handle)
            
        print(f"Unsupported YouTube URL format: {channel_url}")
        return None
        
    except Exception as e:
        print(f"Error extracting channel ID from URL: {e}")
        return None
        
def get_channel_id_by_search(query):
    """Get channel ID by searching for the channel name or custom URL."""
    try:
        search_response = youtube.search().list(
            q=query,
            type='channel',
            part='id',
            maxResults=1
        ).execute()
        
        if search_response.get('items'):
            return search_response['items'][0]['id']['channelId']
        return None
    except Exception as e:
        print(f"Search API error: {e}")
        return None

def get_channel_id_by_username(username):
    """Get channel ID from a YouTube username."""
    try:
        channels_response = youtube.channels().list(
            forUsername=username,
            part='id'
        ).execute()
        
        if channels_response.get('items'):
            return channels_response['items'][0]['id']
        return None
    except Exception as e:
        print(f"Username lookup error: {e}")
        return None

def get_videos_for_channel(channel_url, display_option='random', max_results=5):
    """Get videos from a YouTube channel based on the display option.
    
    Args:
        channel_url: The URL of the YouTube channel.
        display_option: 'random', 'popular', or 'new'.
        max_results: Maximum number of videos to return.
        
    Returns:
        A list of video objects with title, thumbnail, and link.
    """
    channel_id = get_channel_id_from_url(channel_url)
    if not channel_id:
        print(f"Could not extract channel ID from URL: {channel_url}")
        return []
    
    try:
        # Get the channel's uploads playlist ID
        channels_response = youtube.channels().list(
            part='contentDetails',
            id=channel_id
        ).execute()
        
        if not channels_response['items']:
            print(f"No channel found with ID: {channel_id}")
            return []
            
        uploads_list_id = channels_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        # Get videos from the uploads playlist
        playlist_items_response = youtube.playlistItems().list(
            part='snippet,contentDetails',
            playlistId=uploads_list_id,
            maxResults=50  # Get more to allow for sorting/randomizing
        ).execute()
        
        videos = playlist_items_response['items']
        
        # Sort or filter videos based on display_option
        if display_option == 'popular':
            # Get video statistics to sort by view count
            video_ids = [item['contentDetails']['videoId'] for item in videos]
            
            if video_ids:
                videos_response = youtube.videos().list(
                    part='statistics',
                    id=','.join(video_ids[:50])  # API limitation
                ).execute()
                
                # Map video statistics to the original video items
                stats_map = {item['id']: item['statistics'] for item in videos_response['items']}
                
                # Sort videos by view count (descending)
                videos = sorted(
                    videos, 
                    key=lambda x: int(stats_map.get(x['contentDetails']['videoId'], {}).get('viewCount', 0)), 
                    reverse=True
                )
                
        elif display_option == 'new':
            # Sort by published date (descending)
            videos = sorted(
                videos, 
                key=lambda x: x['snippet']['publishedAt'], 
                reverse=True
            )
            
        elif display_option == 'random':
            # Randomize the videos
            random.shuffle(videos)
        
        # Prepare the results
        results = []
        for video in videos[:max_results]:
            video_id = video['contentDetails']['videoId']
            results.append({
                'id': video_id,
                'title': video['snippet']['title'],
                'thumbnail': video['snippet']['thumbnails']['medium']['url'],
                'link': f'https://www.youtube.com/watch?v={video_id}',
                'publishedAt': video['snippet']['publishedAt']
            })
            
        return results
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

def get_videos_for_channels(channels_data):
    """Get videos for multiple channels based on their display options."""
    result = []
    
    for channel in channels_data:
        channel_videos = []
        for link in channel['youtubeLinks']:
            videos = get_videos_for_channel(link, channel['displayOption'], max_results=2)
            channel_videos.extend(videos)
            
        # Re-sort or re-shuffle combined videos from multiple channels
        if channel['displayOption'] == 'popular':
            channel_videos = sorted(channel_videos, key=lambda x: int(x.get('viewCount', 0)), reverse=True)
        elif channel['displayOption'] == 'new':
            channel_videos = sorted(channel_videos, key=lambda x: x['publishedAt'], reverse=True)
        elif channel['displayOption'] == 'random':
            random.shuffle(channel_videos)
            
        channel_copy = channel.copy()
        channel_copy['videos'] = channel_videos[:5]  # Limit to 5 videos per channel
        result.append(channel_copy)
        
    return result