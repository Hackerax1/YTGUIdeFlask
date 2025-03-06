import re
import logging

logger = logging.getLogger('youtube_api')

def parse_iso_duration_to_minutes(duration_str: str) -> int:
    try:
        hours = 0
        minutes = 0
        seconds = 0
        hour_match = re.search(r'(\d+)H', duration_str)
        if hour_match:
            hours = int(hour_match.group(1))
        minute_match = re.search(r'(\d+)M', duration_str)
        if minute_match:
            minutes = int(minute_match.group(1))
        second_match = re.search(r'(\d+)S', duration_str)
        if second_match:
            seconds = int(second_match.group(1))
        total_minutes = hours * 60 + minutes + (1 if seconds > 0 else 0)
        return max(1, total_minutes)
    except Exception as e:
        logger.error(f"Error parsing duration '{duration_str}': {e}")
        return 30

def format_duration(minutes: int) -> str:
    hours = minutes // 60
    mins = minutes % 60
    if hours > 0:
        return f"{hours}h {mins}m"
    else:
        return f"{mins}m"
