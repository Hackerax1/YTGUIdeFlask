import os
import logging
import googleapiclient.discovery
from dotenv import load_dotenv

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
        static_discovery=False
    )
    logger.info("YouTube API client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize YouTube API client: {e}")
    raise
