import time
import logging

logger = logging.getLogger('youtube_api')

class APICache:
    def __init__(self, max_size=100, ttl=3600):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl
        self.access_times = {}
        logger.info(f"Initialized API cache with max_size={max_size}, ttl={ttl}s")

    def get(self, key):
        if key in self.cache:
            timestamp = self.access_times.get(key, 0)
            if time.time() - timestamp <= self.ttl:
                self.access_times[key] = time.time()
                logger.info(f"Cache hit for key: {key}")
                return self.cache[key]
            else:
                del self.cache[key]
                del self.access_times[key]
                logger.info(f"Cache expired for key: {key}")
        return None

    def set(self, key, value):
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.access_times, key=lambda k: self.access_times[k])
            del self.cache[oldest_key]
            del self.access_times[oldest_key]
            logger.info(f"Cache eviction for key: {oldest_key}")
        self.cache[key] = value
        self.access_times[key] = time.time()
        logger.info(f"Cached value for key: {key}")

    def clear(self):
        self.cache.clear()
        self.access_times.clear()
        logger.info("Cache cleared")
