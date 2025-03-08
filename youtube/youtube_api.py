import os
import random
from datetime import datetime, timedelta
import re
import json
import requests
from typing import List, Dict, Any, Optional, Union, Callable, TypeVar
import logging
import time

# Fix imports to use relative imports for local modules
from .youtube_client import youtube
from .api_cache import APICache
from .retry_decorator import retry_on_error
from .youtube_utils import parse_iso_duration_to_minutes, format_duration
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='youtube_api.log'
)
logger = logging.getLogger('youtube_api')

# Type variable for generic return type
T = TypeVar('T')

# Initialize cache with improved defaults for better performance
# Increased TTL from 1800 (30 minutes) to 3600 (1 hour) to reduce API calls
api_cache = APICache(max_size=150, ttl=3600)

# Load environment variables
load_dotenv()

# Get API key from environment
API_KEY = os.getenv('VITE_YT_API_KEY')

if not API_KEY:
    logger.error("YouTube API key not found. Make sure you have a .env file with VITE_YT_API_KEY set.")
    raise ValueError("YouTube API key not found. Make sure you have a .env file with VITE_YT_API_KEY set.")

# Maximum number of videos to fetch in one request
# Reduced from 50 to 30 to decrease initial load time
MAX_VIDEOS_PER_REQUEST = 30

# Maximum number of videos to show in 24-hour schedule
# Reduced from 24 to 12 (showing fewer hours ahead)
DEFAULT_MAX_SCHEDULE_VIDEOS = 12

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
    
    # Check cache first    
    cache_key = f"channel_id:{channel_url}"
    cached_result = api_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
        
    try:
        # Direct channel ID format: youtube.com/channel/CHANNEL_ID
        channel_match = re.search(r'youtube\.com/channel/([^/?&]+)', channel_url)
        if channel_match:
            channel_id = channel_match.group(1)
            logger.info(f"Extracted channel ID directly: {channel_id}")
            api_cache.set(cache_key, channel_id)
            return channel_id
        
        # Handle custom URL format: youtube.com/c/CUSTOM_URL
        custom_match = re.search(r'youtube\.com/c/([^/?&]+)', channel_url)
        if custom_match:
            custom_url = custom_match.group(1)
            logger.info(f"Extracted custom URL: {custom_url}, searching for channel ID")
            channel_id = get_channel_id_by_search(custom_url)
            if channel_id:
                api_cache.set(cache_key, channel_id)
            return channel_id
                
        # Handle username format: youtube.com/user/USERNAME
        user_match = re.search(r'youtube\.com/user/([^/?&]+)', channel_url)
        if user_match:
            username = user_match.group(1)
            logger.info(f"Extracted username: {username}, searching for channel ID")
            channel_id = get_channel_id_by_username(username)
            if channel_id:
                api_cache.set(cache_key, channel_id)
            return channel_id
                
        # Handle handle format: youtube.com/@handle
        handle_match = re.search(r'youtube\.com/@([^/?&]+)', channel_url)
        if handle_match:
            handle = handle_match.group(1)
            logger.info(f"Extracted handle: {handle}, searching for channel ID")
            channel_id = get_channel_id_by_search(handle)
            if channel_id:
                api_cache.set(cache_key, channel_id)
            return channel_id
                
        logger.warning(f"Unsupported YouTube URL format: {channel_url}")
        return None
            
    except Exception as e:
        logger.error(f"Error extracting channel ID from URL: {e}")
        return None

@retry_on_error(max_retries=3, base_delay=2)
def get_channel_id_by_search(query: str) -> Optional[str]:
    """Get channel ID by searching for the channel name or custom URL.
    
    Args:
        query: The search query, typically a channel name or custom URL
        
    Returns:
        The channel ID or None if not found
    """
    # Check cache first
    cache_key = f"search:{query}"
    cached_result = api_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
        
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
            api_cache.set(cache_key, channel_id)
            return channel_id
            
        logger.warning(f"No channel found for search query: {query}")
        api_cache.set(cache_key, None)  # Cache negative results too
        return None
    except Exception as e:
        logger.error(f"Search API error for query '{query}': {e}")
        # Let the retry decorator handle retries
        raise

@retry_on_error()
def get_channel_id_by_username(username: str) -> Optional[str]:
    """Get channel ID from a YouTube username.
    
    Args:
        username: The YouTube username
        
    Returns:
        The channel ID or None if not found
    """
    # Check cache first
    cache_key = f"username:{username}"
    cached_result = api_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
        
    try:
        channels_response = youtube.channels().list(
            forUsername=username,
            part='id'
        ).execute()
        
        if channels_response.get('items'):
            channel_id = channels_response['items'][0]['id']
            logger.info(f"Found channel ID for username {username}: {channel_id}")
            api_cache.set(cache_key, channel_id)
            return channel_id
            
        logger.warning(f"No channel found for username: {username}")
        api_cache.set(cache_key, None)  # Cache negative results too
        return None
    except Exception as e:
        logger.error(f"Username lookup error for '{username}': {e}")
        # Let the retry decorator handle retries
        raise

@retry_on_error()
def get_video_details(video_id: str, minimal: bool = False) -> Optional[Dict[str, Any]]:
    """Get detailed information about a video including description.
    
    Args:
        video_id: The YouTube video ID
        minimal: If True, fetch only essential fields (reduces API quota usage)
        
    Returns:
        A dictionary with video details or None if not found
    """
    # Check cache first
    cache_key = f"video:{video_id}:{minimal}"
    cached_result = api_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
        
    try:
        # Use minimal part list if minimal flag is set to reduce data processing
        parts = 'snippet,contentDetails' if not minimal else 'contentDetails'
        
        video_response = youtube.videos().list(
            part=parts,
            id=video_id
        ).execute()
        
        if not video_response.get('items'):
            logger.warning(f"No details found for video ID: {video_id}")
            api_cache.set(cache_key, None)
            return None
            
        video = video_response['items'][0]
        content_details = video['contentDetails']
        
        # Parse duration from ISO 8601 format (e.g., PT1H30M15S)
        duration_str = content_details.get('duration', 'PT0M0S')
        duration_min = parse_iso_duration_to_minutes(duration_str)
        
        # Create minimal detail object if minimal flag is set
        if minimal:
            details = {
                'id': video_id,
                'duration': duration_min,
                'duration_str': format_duration(duration_min)
            }
        else:
            snippet = video['snippet']
            details = {
                'id': video_id,
                'title': snippet.get('title', 'Untitled Video'),
                'description': snippet.get('description', 'No description available.'),
                'thumbnail': snippet.get('thumbnails', {}).get('medium', {}).get('url', ''),
                'publishedAt': snippet.get('publishedAt', ''),
                'duration': duration_min,
                'duration_str': format_duration(duration_min)
            }
        
        logger.info(f"Successfully retrieved {'minimal ' if minimal else ''}details for video ID: {video_id}")
        api_cache.set(cache_key, details)
        return details
    except Exception as e:
        logger.error(f"Error fetching video details for ID {video_id}: {e}")
        # Let the retry decorator handle retries
        raise

@retry_on_error(max_retries=3)
def get_videos_for_channel(channel_url: str, display_option: str = 'random', max_results: int = 5) -> List[Dict[str, Any]]:
    """Get videos from a YouTube channel based on the display option.
    
    Args:
        channel_url: The URL of the YouTube channel.
        display_option: 'random', 'popular', or 'new'.
        max_results: Maximum number of videos to return.
        
    Returns:
        A list of video objects with title, thumbnail, description, and link.
    """
    # Add cache key for this specific query
    cache_key = f"videos:{channel_url}:{display_option}:{max_results}"
    cached_result = api_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
        
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
            api_cache.set(cache_key, [])
            return []
            
        uploads_list_id = channels_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        # Get videos from the uploads playlist - reduced max results
        playlist_items_response = youtube.playlistItems().list(
            part='snippet,contentDetails',
            playlistId=uploads_list_id,
            maxResults=min(MAX_VIDEOS_PER_REQUEST, max(10, max_results * 2))  # Fetch more than needed but with a cap
        ).execute()
        
        videos = playlist_items_response['items']
        
        # Sort or filter videos based on display_option
        if display_option == 'popular':
            # Get video statistics to sort by view count
            video_ids = [item['contentDetails']['videoId'] for item in videos]
            
            if video_ids:
                videos_response = youtube.videos().list(
                    part='statistics',  # Only fetch statistics to reduce data size
                    id=','.join(video_ids[:min(len(video_ids), 30)])  # API limitation + reduced limit
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
        
        # Prepare the results (limited to max_results)
        results = []
        for video in videos[:max_results]:
            video_id = video['contentDetails']['videoId']
            snippet = video['snippet']
            
            # Get minimal video details first (just duration)
            video_details = get_video_details(video_id, minimal=True)
            
            # Create video object with basic info
            video_obj = {
                'id': video_id,
                'title': snippet['title'],
                'description': snippet.get('description', 'No description available.'),
                'thumbnail': snippet.get('thumbnails', {}).get('medium', {}).get('url', ''),
                'link': f'https://www.youtube.com/watch?v={video_id}',
                'publishedAt': snippet['publishedAt'],
                'duration': video_details.get('duration', 30) if video_details else 30,
                'duration_str': video_details.get('duration_str', '30m') if video_details else '30m'
            }
            results.append(video_obj)
            
        logger.info(f"Successfully retrieved {len(results)} videos for channel {channel_id}")
        
        # Cache the results
        api_cache.set(cache_key, results)
        return results
        
    except Exception as e:
        logger.error(f"Error fetching videos for channel {channel_url}: {e}")
        # Let the retry decorator handle retries
        raise

def batch_get_videos(channel_urls: List[str], display_option: str, max_results: int) -> List[Dict[str, Any]]:
    """Batch process multiple channel URLs to get videos.
    
    Args:
        channel_urls: List of YouTube channel URLs
        display_option: Display option for sorting videos
        max_results: Maximum results per channel
        
    Returns:
        Combined list of videos from all channels
    """
    all_videos = []
    
    for url in channel_urls:
        try:
            videos = get_videos_for_channel(url, display_option, max_results)
            all_videos.extend(videos)
        except Exception as e:
            logger.error(f"Error getting videos for channel URL {url}: {e}")
            # Continue with other URLs even if one fails
            continue
            
    # Apply sorting based on display option to the combined results
    if display_option == 'popular' and all_videos:
        all_videos = sorted(all_videos, key=lambda x: int(x.get('viewCount', 0)), reverse=True)
    elif display_option == 'new' and all_videos:
        all_videos = sorted(all_videos, key=lambda x: x['publishedAt'], reverse=True)
    elif display_option == 'random' and all_videos:
        random.shuffle(all_videos)
        
    return all_videos[:max_results]

def get_videos_for_channels(channels_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Get videos for multiple channels based on their display options.
    
    Args:
        channels_data: List of channel data dictionaries
        
    Returns:
        List of channel data with videos included
    """
    result = []
    
    for channel in channels_data:
        try:
            # Use the batch processing function to get videos for all links in this channel
            channel_videos = batch_get_videos(
                channel_urls=channel['youtubeLinks'],
                display_option=channel['displayOption'],
                max_results=5  # Limit to 5 videos per channel
            )
            
            # Create a copy of the channel data and add videos
            channel_copy = channel.copy()
            channel_copy['videos'] = channel_videos
            result.append(channel_copy)
            
        except Exception as e:
            logger.error(f"Error processing channel {channel.get('name')}: {e}")
            # Add the channel without videos to avoid breaking the UI
            channel_copy = channel.copy()
            channel_copy['videos'] = []
            result.append(channel_copy)
    
    return result

@retry_on_error(max_retries=2)
def get_channel_videos(channel_id: str, max_results: int = DEFAULT_MAX_SCHEDULE_VIDEOS) -> List[Dict[str, Any]]:
    """
    Get videos for a channel, distributed across time slots.
    Returns videos to fill the schedule.
    
    Args:
        channel_id: YouTube channel ID
        max_results: Maximum number of videos to return (default reduced to 12 hours ahead)
        
    Returns:
        List of video data dictionaries
    """
    # Add cache key for this specific request
    cache_key = f"channel_videos:{channel_id}:{max_results}"
    cached_result = api_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
    
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
            
            # Get only minimal video details (duration only)
            video_details = get_video_details(video_id, minimal=True) or {}
            
            video = {
                'id': video_id,
                'title': item['snippet']['title'],
                'description': item['snippet'].get('description', 'No description available.'),
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
        
        # Cache the results
        api_cache.set(cache_key, videos)
        return videos

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error fetching videos for channel {channel_id}: {str(e)}")
        # Let the retry decorator handle retries
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching videos for channel {channel_id}: {str(e)}")
        # Let the retry decorator handle retries
        raise

# Function to load more videos (pagination)
def load_more_channel_videos(channel_id: str, page_token: str, max_results: int = 10) -> Dict[str, Any]:
    """
    Fetch additional videos for a channel using pagination token.
    This allows loading videos on demand instead of all at once.
    
    Args:
        channel_id: YouTube channel ID
        page_token: Token for the next page of results
        max_results: Maximum number of videos per page
        
    Returns:
        Dictionary with videos list and next page token if available
    """
    cache_key = f"more_videos:{channel_id}:{page_token}:{max_results}"
    cached_result = api_cache.get(cache_key)
    if cached_result is not None:
        return cached_result
    
    base_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        'key': API_KEY,
        'channelId': channel_id,
        'part': 'snippet',
        'order': 'date',
        'type': 'video',
        'maxResults': max_results,
        'pageToken': page_token
    }
    
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        videos = []
        for item in data.get('items', []):
            video_id = item['id']['videoId']
            # Only get minimal details
            video_details = get_video_details(video_id, minimal=True) or {}
            
            video = {
                'id': video_id,
                'title': item['snippet']['title'],
                'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                'publishedAt': item['snippet']['publishedAt'],
                'duration': video_details.get('duration', 30),
                'duration_str': video_details.get('duration_str', '30m')
            }
            videos.append(video)
        
        result = {
            'videos': videos,
            'next_page_token': data.get('nextPageToken')
        }
        
        api_cache.set(cache_key, result)
        return result
        
    except Exception as e:
        logger.error(f"Error loading more videos for channel {channel_id}: {e}")
        raise