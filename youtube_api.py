import os
import random
from datetime import datetime, timedelta
import googleapiclient.discovery
from dotenv import load_dotenv
import re
import json
import requests
from typing import List, Dict, Any, Optional, Union
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='youtube_api.log'
)
logger = logging.getLogger('youtube_api')

# Load environment variables
load_dotenv()

# Get API key from environment
API_KEY = os.getenv('VITE_YT_API_KEY')

if not API_KEY:
    logger.error("YouTube API key not found. Make sure you have a .env file with VITE_YT_API_KEY set.")
    raise ValueError("YouTube API key not found. Make sure you have a .env file with VITE_YT_API_KEY set.")

# Initialize YouTube API client with explicit API key authentication
try:
    youtube = googleapiclient.discovery.build(
        'youtube', 
        'v3', 
        developerKey=API_KEY,
        # Skip authentication if possible
        static_discovery=False
    )
    logger.info("YouTube API client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize YouTube API client: {e}")
    raise

def get_channel_id_from_url(channel_url: str) -> Optional[str]:
    """Extract channel ID from various forms of YouTube channel URLs.
    
    Supported formats:
    - https://www.youtube.com/channel/CHANNEL_ID
    - https://www.youtube.com/c/CUSTOM_URL
    - https://www.youtube.com/user/USERNAME
    - https://www.youtube.com/@handle
    
    Args:
        channel_url: A YouTube channel URL
        
    Returns:
        The channel ID or None if it couldn't be extracted
    """
    if not channel_url:
        logger.warning("Empty channel URL provided")
        return None
        
    try:
        # Direct channel ID format: youtube.com/channel/CHANNEL_ID
        channel_match = re.search(r'youtube\.com/channel/([^/?&]+)', channel_url)
        if channel_match:
            channel_id = channel_match.group(1)
            logger.info(f"Extracted channel ID directly: {channel_id}")
            return channel_id
        
        # Handle custom URL format: youtube.com/c/CUSTOM_URL
        custom_match = re.search(r'youtube\.com/c/([^/?&]+)', channel_url)
        if custom_match:
            custom_url = custom_match.group(1)
            logger.info(f"Extracted custom URL: {custom_url}, searching for channel ID")
            return get_channel_id_by_search(custom_url)
                
        # Handle username format: youtube.com/user/USERNAME
        user_match = re.search(r'youtube\.com/user/([^/?&]+)', channel_url)
        if user_match:
            username = user_match.group(1)
            logger.info(f"Extracted username: {username}, searching for channel ID")
            return get_channel_id_by_username(username)
                
        # Handle handle format: youtube.com/@handle
        handle_match = re.search(r'youtube\.com/@([^/?&]+)', channel_url)
        if handle_match:
            handle = handle_match.group(1)
            logger.info(f"Extracted handle: {handle}, searching for channel ID")
            return get_channel_id_by_search(handle)
                
        logger.warning(f"Unsupported YouTube URL format: {channel_url}")
        return None
            
    except Exception as e:
        logger.error(f"Error extracting channel ID from URL: {e}")
        return None
        
def get_channel_id_by_search(query: str) -> Optional[str]:
    """Get channel ID by searching for the channel name or custom URL.
    
    Args:
        query: The search query, typically a channel name or custom URL
        
    Returns:
        The channel ID or None if not found
    """
    try:
        search_response = youtube.search().list(
            q=query,
            type='channel',
            part='id',
            maxResults=1
        ).execute()
        
        if search_response.get('items'):
            channel_id = search_response['items'][0]['id']['channelId']
            logger.info(f"Found channel ID via search: {channel_id}")
            return channel_id
            
        logger.warning(f"No channel found for search query: {query}")
        return None
    except Exception as e:
        logger.error(f"Search API error for query '{query}': {e}")
        return None

def get_channel_id_by_username(username: str) -> Optional[str]:
    """Get channel ID from a YouTube username.
    
    Args:
        username: The YouTube username
        
    Returns:
        The channel ID or None if not found
    """
    try:
        channels_response = youtube.channels().list(
            forUsername=username,
            part='id'
        ).execute()
        
        if channels_response.get('items'):
            channel_id = channels_response['items'][0]['id']
            logger.info(f"Found channel ID for username {username}: {channel_id}")
            return channel_id
            
        logger.warning(f"No channel found for username: {username}")
        return None
    except Exception as e:
        logger.error(f"Username lookup error for '{username}': {e}")
        return None

def get_video_details(video_id: str) -> Optional[Dict[str, Any]]:
    """Get detailed information about a video including description.
    
    Args:
        video_id: The YouTube video ID
        
    Returns:
        A dictionary with video details or None if not found
    """
    try:
        video_response = youtube.videos().list(
            part='snippet,contentDetails',
            id=video_id
        ).execute()
        
        if not video_response.get('items'):
            logger.warning(f"No details found for video ID: {video_id}")
            return None
            
        video = video_response['items'][0]
        snippet = video['snippet']
        content_details = video['contentDetails']
        
        # Parse duration from ISO 8601 format (e.g., PT1H30M15S)
        duration_str = content_details.get('duration', 'PT0M0S')
        duration_min = parse_iso_duration_to_minutes(duration_str)
        
        details = {
            'id': video_id,
            'title': snippet.get('title', 'Untitled Video'),
            'description': snippet.get('description', 'No description available.'),
            'thumbnail': snippet.get('thumbnails', {}).get('medium', {}).get('url', ''),
            'publishedAt': snippet.get('publishedAt', ''),
            'duration': duration_min,
            'duration_str': format_duration(duration_min)
        }
        
        logger.info(f"Successfully retrieved details for video ID: {video_id}")
        return details
    except Exception as e:
        logger.error(f"Error fetching video details for ID {video_id}: {e}")
        return None

def parse_iso_duration_to_minutes(duration_str: str) -> int:
    """Parse ISO 8601 duration format to minutes.
    
    Args:
        duration_str: Duration string in ISO 8601 format (e.g., PT1H30M15S)
        
    Returns:
        Duration in minutes
    """
    try:
        hours = 0
        minutes = 0
        seconds = 0
        
        # Extract hours
        hour_match = re.search(r'(\d+)H', duration_str)
        if hour_match:
            hours = int(hour_match.group(1))
            
        # Extract minutes
        minute_match = re.search(r'(\d+)M', duration_str)
        if minute_match:
            minutes = int(minute_match.group(1))
            
        # Extract seconds
        second_match = re.search(r'(\d+)S', duration_str)
        if second_match:
            seconds = int(second_match.group(1))
            
        # Convert to total minutes (rounding up if there are seconds)
        total_minutes = hours * 60 + minutes + (1 if seconds > 0 else 0)
        return max(1, total_minutes)  # Ensure at least 1 minute
    except Exception as e:
        logger.error(f"Error parsing duration '{duration_str}': {e}")
        return 30  # Default to 30 minutes on error

def format_duration(minutes: int) -> str:
    """Format minutes into a human-readable duration string.
    
    Args:
        minutes: Duration in minutes
        
    Returns:
        Formatted duration string (e.g., "1h 30m" or "45m")
    """
    hours = minutes // 60
    mins = minutes % 60
    
    if hours > 0:
        return f"{hours}h {mins}m"
    else:
        return f"{mins}m"

def get_videos_for_channel(channel_url: str, display_option: str = 'random', max_results: int = 5) -> List[Dict[str, Any]]:
    """Get videos from a YouTube channel based on the display option.
    
    Args:
        channel_url: The URL of the YouTube channel.
        display_option: 'random', 'popular', or 'new'.
        max_results: Maximum number of videos to return.
        
    Returns:
        A list of video objects with title, thumbnail, description, and link.
    """
    channel_id = get_channel_id_from_url(channel_url)
    if not channel_id:
        logger.warning(f"Could not extract channel ID from URL: {channel_url}")
        return []
    
    try:
        # Get the channel's uploads playlist ID
        channels_response = youtube.channels().list(
            part='contentDetails',
            id=channel_id
        ).execute()
        
        if not channels_response['items']:
            logger.warning(f"No channel found with ID: {channel_id}")
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
                    part='statistics,snippet,contentDetails',
                    id=','.join(video_ids[:50])  # API limitation
                ).execute()
                
                # Map video statistics to the original video items
                video_details = {item['id']: item for item in videos_response['items']}
                
                # Sort videos by view count (descending)
                videos = sorted(
                    videos, 
                    key=lambda x: int(video_details.get(x['contentDetails']['videoId'], {}).get('statistics', {}).get('viewCount', 0)), 
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
            
            # Get detailed video information including description
            video_details = get_video_details(video_id)
            
            if not video_details:
                # Use basic info if detailed info is not available
                snippet = video['snippet']
                results.append({
                    'id': video_id,
                    'title': snippet['title'],
                    'description': snippet.get('description', 'No description available.'),
                    'thumbnail': snippet['thumbnails']['medium']['url'],
                    'link': f'https://www.youtube.com/watch?v={video_id}',
                    'publishedAt': snippet['publishedAt'],
                    'duration': 30,  # Default duration
                    'duration_str': '30m'
                })
            else:
                # Use detailed info
                results.append({
                    'id': video_id,
                    'title': video_details['title'],
                    'description': video_details['description'],
                    'thumbnail': video_details['thumbnail'],
                    'link': f'https://www.youtube.com/watch?v={video_id}',
                    'publishedAt': video_details['publishedAt'],
                    'duration': video_details['duration'],
                    'duration_str': video_details['duration_str']
                })
            
        logger.info(f"Successfully retrieved {len(results)} videos for channel {channel_id}")
        return results
        
    except Exception as e:
        logger.error(f"Error fetching videos for channel {channel_url}: {e}")
        return []

def get_videos_for_channels(channels_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Get videos for multiple channels based on their display options.
    
    Args:
        channels_data: List of channel data dictionaries
        
    Returns:
        List of channel data with videos included
    """
    result = []
    
    for channel in channels_data:
        channel_videos = []
        retry_count = 0
        max_retries = 2
        
        # Try to get videos with retries
        while retry_count <= max_retries and not channel_videos:
            try:
                for link in channel['youtubeLinks']:
                    videos = get_videos_for_channel(link, channel['displayOption'], max_results=2)
                    channel_videos.extend(videos)
                
                if not channel_videos and retry_count < max_retries:
                    logger.warning(f"No videos found for channel {channel.get('name')}, retrying...")
                    retry_count += 1
                    time.sleep(1)  # Short delay before retry
                else:
                    break
            except Exception as e:
                logger.error(f"Error getting videos for channel {channel.get('name')}: {e}")
                if retry_count < max_retries:
                    retry_count += 1
                    time.sleep(1)  # Short delay before retry
                else:
                    break
            
        # Re-sort or re-shuffle combined videos from multiple channels
        if channel_videos:
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

def get_channel_videos(channel_id: str, max_results: int = 24) -> List[Dict[str, Any]]:
    """
    Get videos for a channel, distributed across 24-hour slots.
    Returns exactly max_results videos to fill the 24-hour schedule.
    
    Args:
        channel_id: YouTube channel ID
        max_results: Maximum number of videos to return
        
    Returns:
        List of video data dictionaries
    """
    base_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        'key': API_KEY,
        'channelId': channel_id,
        'part': 'snippet',
        'order': 'date',
        'type': 'video',
        'maxResults': max_results
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        videos = []
        for item in data.get('items', []):
            video_id = item['id']['videoId']
            
            # Get additional video details including description
            video_details = get_video_details(video_id) or {}
            
            video = {
                'id': video_id,
                'title': item['snippet']['title'],
                'description': video_details.get('description', item['snippet'].get('description', 'No description available.')),
                'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                'publishedAt': item['snippet']['publishedAt'],
                'is_current': False,  # Will be set by the app based on current time
                'duration': video_details.get('duration', 30),
                'duration_str': video_details.get('duration_str', '30m')
            }
            videos.append(video)

        # Pad with None if we don't have enough videos
        while len(videos) < max_results:
            videos.append(None)

        logger.info(f"Successfully retrieved {len(videos)} videos for channel {channel_id}")
        return videos

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error fetching videos for channel {channel_id}: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error fetching videos for channel {channel_id}: {str(e)}")
        return []