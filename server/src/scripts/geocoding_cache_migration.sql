-- Create geocoding_cache table for Nominatim address lookup caching
CREATE TABLE IF NOT EXISTS geocoding_cache (
    query TEXT PRIMARY KEY,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on created_at for fast expiration cleanups
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_created_at ON geocoding_cache (created_at);
