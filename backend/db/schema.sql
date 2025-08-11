-- GlobeTrotter Database Schema
-- Run this script to create all the necessary tables

-- Users table with enhanced profile information
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture_url TEXT,
    country_origin VARCHAR(100),
    date_of_birth DATE,
    phone_number VARCHAR(20),
    bio TEXT,
    fav_activities TEXT[],  -- e.g. {'hiking', 'history', 'beaches'}
    fav_places TEXT[],      -- e.g. {'mountains', 'museums'}
    travel_style VARCHAR(50), -- budget, luxury, adventure, etc.
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    travel_experience_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, expert
    notification_preferences JSONB DEFAULT '{"email": true, "push": true}',
    privacy_settings JSONB DEFAULT '{"profile_public": false, "trips_public": false}',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Countries table for destination information
CREATE TABLE countries (
    country_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    country_code VARCHAR(3) UNIQUE NOT NULL, -- ISO 3166-1 alpha-3
    continent VARCHAR(50),
    currency VARCHAR(3),
    timezone VARCHAR(50),
    language VARCHAR(50),
    cost_index INTEGER, -- 1-10 scale (1 = very cheap, 10 = very expensive)
    safety_rating INTEGER, -- 1-10 scale
    best_time_to_visit VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cities table
CREATE TABLE cities (
    city_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id INTEGER REFERENCES countries(country_id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population INTEGER,
    description TEXT,
    cost_index INTEGER, -- 1-10 scale
    popularity_score INTEGER DEFAULT 0,
    image_url TEXT,
    best_time_to_visit VARCHAR(100),
    average_temp_celsius INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Activity categories
CREATE TABLE activity_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- icon name for frontend
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
    activity_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    city_id INTEGER REFERENCES cities(city_id),
    category_id INTEGER REFERENCES activity_categories(category_id),
    estimated_cost DECIMAL(10, 2),
    estimated_duration_hours DECIMAL(4, 2),
    difficulty_level VARCHAR(20), -- easy, moderate, hard
    min_age INTEGER DEFAULT 0,
    max_group_size INTEGER,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    image_urls TEXT[],
    booking_url TEXT,
    operating_hours JSONB, -- {"monday": "9:00-17:00", ...}
    seasonal_availability VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
    trip_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    trip_type VARCHAR(50), -- solo, family, friends, romantic, business
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'planning', -- planning, booked, ongoing, completed, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip stops (cities visited in a trip)
CREATE TABLE trip_stops (
    stop_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    city_id INTEGER REFERENCES cities(city_id),
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    accommodation_budget DECIMAL(10, 2),
    food_budget DECIMAL(10, 2),
    transport_budget DECIMAL(10, 2),
    activity_budget DECIMAL(10, 2),
    notes TEXT,
    stop_order INTEGER NOT NULL, -- order of visit
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trip activities (activities planned for each stop)
CREATE TABLE trip_activities (
    trip_activity_id SERIAL PRIMARY KEY,
    stop_id INTEGER REFERENCES trip_stops(stop_id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES activities(activity_id),
    planned_date DATE,
    planned_time TIME,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    priority INTEGER DEFAULT 1, -- 1 = must do, 2 = would like to do, 3 = if time permits
    status VARCHAR(20) DEFAULT 'planned', -- planned, booked, completed, skipped
    notes TEXT,
    activity_order INTEGER, -- order within the day
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trip sharing and collaboration
CREATE TABLE trip_shares (
    share_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    shared_by_user_id INTEGER REFERENCES users(user_id),
    shared_with_user_id INTEGER REFERENCES users(user_id),
    permission_level VARCHAR(20) DEFAULT 'view', -- view, edit, admin
    share_token VARCHAR(100) UNIQUE, -- for public sharing
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User reviews for activities
CREATE TABLE activity_reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    activity_id INTEGER REFERENCES activities(activity_id),
    trip_id INTEGER REFERENCES trips(trip_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    visit_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, activity_id, trip_id)
);

-- User saved destinations and activities
CREATE TABLE user_saves (
    save_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    saved_type VARCHAR(20) NOT NULL, -- city, activity, trip
    saved_id INTEGER NOT NULL, -- references the ID of the saved item
    saved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, saved_type, saved_id)
);

-- Notifications table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- trip_reminder, share_invite, system_update, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT,
    related_id INTEGER, -- ID of related entity (trip, activity, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Budget tracking
CREATE TABLE expense_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7) -- hex color code
);

CREATE TABLE trip_expenses (
    expense_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    stop_id INTEGER REFERENCES trip_stops(stop_id),
    category_id INTEGER REFERENCES expense_categories(category_id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    expense_date DATE NOT NULL,
    is_planned BOOLEAN DEFAULT TRUE, -- false for actual expenses
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX idx_trip_activities_stop_id ON trip_activities(stop_id);
CREATE INDEX idx_activities_city_id ON activities(city_id);
CREATE INDEX idx_cities_country_id ON cities(country_id);
CREATE INDEX idx_trip_shares_trip_id ON trip_shares(trip_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Insert some default data
INSERT INTO expense_categories (name, icon, color) VALUES
('Accommodation', 'bed', '#3B82F6'),
('Food & Drinks', 'utensils', '#EF4444'),
('Transportation', 'car', '#10B981'),
('Activities', 'map-pin', '#F59E0B'),
('Shopping', 'shopping-bag', '#8B5CF6'),
('Miscellaneous', 'more-horizontal', '#6B7280');

INSERT INTO activity_categories (name, description, icon) VALUES
('Adventure', 'Outdoor activities and adventures', 'mountain'),
('Culture', 'Museums, galleries, historical sites', 'book'),
('Food & Drink', 'Restaurants, food tours, cooking classes', 'utensils'),
('Nature', 'Parks, gardens, wildlife', 'tree'),
('Entertainment', 'Shows, concerts, nightlife', 'music'),
('Sports', 'Sports activities and events', 'activity'),
('Relaxation', 'Spas, beaches, wellness', 'sun'),
('Shopping', 'Markets, malls, boutiques', 'shopping-bag'),
('Religious', 'Churches, temples, spiritual sites', 'home'),
('Architecture', 'Buildings, landmarks, monuments', 'building');
