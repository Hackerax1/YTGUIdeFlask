import random
import time
import logging
import requests
import googleapiclient.errors
from functools import wraps

logger = logging.getLogger('youtube_api')

# Retry decorator for API functions
def retry_on_error(max_retries=3, base_delay=1, backoff_factor=2, retriable_exceptions=(requests.RequestException, googleapiclient.errors.HttpError)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            delay = base_delay
            while True:
                try:
                    return func(*args, **kwargs)
                except retriable_exceptions as e:
                    retries += 1
                    if retries > max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}: {e}")
                        raise
                    jitter = random.uniform(0.8, 1.2)
                    sleep_time = delay * jitter
                    logger.warning(f"Retry {retries}/{max_retries} for {func.__name__} after {sleep_time:.2f}s: {e}")
                    time.sleep(sleep_time)
                    delay *= backoff_factor
        return wrapper
    return decorator
