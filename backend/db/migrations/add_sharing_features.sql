-- Add enhanced sharing features to trips table
-- Run this migration to add sharing and visibility enhancements

-- Add new columns to trips table for enhanced sharing
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private', -- private, public, unlisted, friends_only
ADD COLUMN IF NOT EXISTS share_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_cloning BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_settings JSONB DEFAULT '{"email_notifications": true, "show_budget": true, "show_personal_info": false}';

-- Update existing is_public field logic
UPDATE trips SET visibility = 'public' WHERE is_public = true;
UPDATE trips SET visibility = 'private' WHERE is_public = false;

-- Create index for performance on share tokens
CREATE INDEX IF NOT EXISTS idx_trips_share_token ON trips(share_token);
CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility);

-- Enhance trip_shares table with more features
ALTER TABLE trip_shares 
ADD COLUMN IF NOT EXISTS shared_via VARCHAR(20) DEFAULT 'direct', -- direct, link, email
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"can_comment": false, "can_suggest": false}';

-- Create trip likes table for public trips
CREATE TABLE IF NOT EXISTS trip_likes (
    like_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Create trip comments table for shared trips
CREATE TABLE IF NOT EXISTS trip_comments (
    comment_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES trip_comments(comment_id),
    is_suggestion BOOLEAN DEFAULT FALSE,
    suggested_changes JSONB,
    status VARCHAR(20) DEFAULT 'active', -- active, deleted, hidden
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create trip views table for analytics
CREATE TABLE IF NOT EXISTS trip_views (
    view_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    viewer_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    viewer_ip VARCHAR(45),
    viewed_at TIMESTAMP DEFAULT NOW(),
    session_id VARCHAR(255)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_likes_trip_id ON trip_likes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_trip_id ON trip_comments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_views_trip_id ON trip_views(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_views_viewed_at ON trip_views(viewed_at);

-- Update share_token generator function
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share tokens for public trips
CREATE OR REPLACE FUNCTION auto_generate_share_token() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.visibility IN ('public', 'unlisted') AND NEW.share_token IS NULL THEN
        NEW.share_token = generate_share_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_auto_share_token 
    BEFORE INSERT OR UPDATE OF visibility 
    ON trips 
    FOR EACH ROW 
    EXECUTE FUNCTION auto_generate_share_token();
