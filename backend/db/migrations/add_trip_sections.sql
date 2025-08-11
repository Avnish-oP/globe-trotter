-- Add trip sections table for organizing activities within trips
CREATE TABLE trip_sections (
    section_id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(trip_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL, -- The place/city for this section
    budget_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    section_order INTEGER NOT NULL, -- order within the trip
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip section places (suggested places for each section)
CREATE TABLE trip_section_places (
    place_id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES trip_sections(section_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    estimated_cost VARCHAR(100),
    popularity VARCHAR(50),
    is_selected BOOLEAN DEFAULT FALSE,
    place_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_trip_sections_trip_id ON trip_sections(trip_id);
CREATE INDEX idx_trip_sections_order ON trip_sections(trip_id, section_order);
CREATE INDEX idx_trip_section_places_section_id ON trip_section_places(section_id);
CREATE INDEX idx_trip_section_places_selected ON trip_section_places(section_id, is_selected);
