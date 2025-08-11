-- Sample data for testing the dashboard
-- Run this after creating the main schema

-- Insert sample countries
INSERT INTO countries (name, country_code, continent, currency, language, cost_index, safety_rating) VALUES
('United States', 'USA', 'North America', 'USD', 'English', 7, 8),
('France', 'FRA', 'Europe', 'EUR', 'French', 8, 9),
('Japan', 'JPN', 'Asia', 'JPY', 'Japanese', 9, 10),
('Thailand', 'THA', 'Asia', 'THB', 'Thai', 3, 7),
('United Kingdom', 'GBR', 'Europe', 'GBP', 'English', 8, 9),
('Australia', 'AUS', 'Oceania', 'AUD', 'English', 7, 9),
('Germany', 'DEU', 'Europe', 'EUR', 'German', 7, 9),
('Italy', 'ITA', 'Europe', 'EUR', 'Italian', 6, 8),
('Spain', 'ESP', 'Europe', 'EUR', 'Spanish', 5, 8),
('India', 'IND', 'Asia', 'INR', 'Hindi', 2, 6);

-- Insert sample cities
INSERT INTO cities (name, country_id, latitude, longitude, population, description, cost_index, popularity_score, best_time_to_visit) VALUES
('New York', 1, 40.7128, -74.0060, 8175133, 'The city that never sleeps', 8, 95, 'April to June, September to November'),
('Paris', 2, 48.8566, 2.3522, 2161000, 'The city of light and romance', 8, 98, 'April to June, September to October'),
('Tokyo', 3, 35.6762, 139.6503, 13960000, 'Modern metropolis with ancient traditions', 9, 92, 'March to May, September to November'),
('Bangkok', 4, 13.7563, 100.5018, 8281000, 'Vibrant street life and cultural landmarks', 3, 87, 'November to March'),
('London', 5, 51.5074, -0.1278, 8982000, 'Historic capital with modern attractions', 8, 94, 'April to September'),
('Sydney', 6, -33.8688, 151.2093, 5312000, 'Harbor city with iconic landmarks', 7, 89, 'September to November, March to May'),
('Berlin', 7, 52.5200, 13.4050, 3669000, 'Historical city with vibrant culture', 6, 85, 'May to September'),
('Rome', 8, 41.9028, 12.4964, 2873000, 'Eternal city with ancient wonders', 6, 91, 'April to June, September to October'),
('Barcelona', 9, 41.3851, 2.1734, 1620000, 'Architectural marvels and beach life', 5, 88, 'April to June, September to October'),
('Mumbai', 10, 19.0760, 72.8777, 12478000, 'Bollywood capital and financial hub', 2, 82, 'November to February');

-- Insert sample activity categories
INSERT INTO activity_categories (name, description, icon) VALUES
('Sightseeing', 'Tourist attractions and landmarks', 'eye'),
('Museums', 'Art galleries and cultural exhibits', 'building'),
('Food Tours', 'Culinary experiences and local cuisine', 'utensils'),
('Adventure', 'Outdoor and extreme activities', 'mountain'),
('Shopping', 'Markets and retail experiences', 'shopping-bag'),
('Nightlife', 'Bars, clubs, and entertainment', 'music'),
('Nature', 'Parks, gardens, and wildlife', 'tree'),
('Cultural', 'Traditional experiences and festivals', 'users');

-- Insert sample activities
INSERT INTO activities (name, description, city_id, category_id, estimated_cost, estimated_duration_hours, difficulty_level, rating) VALUES
('Statue of Liberty', 'Iconic symbol of freedom and democracy', 1, 1, 25.00, 4.0, 'easy', 4.5),
('Central Park', 'Urban oasis in the heart of Manhattan', 1, 7, 0.00, 3.0, 'easy', 4.6),
('Eiffel Tower', 'Iconic iron lattice tower', 2, 1, 25.00, 2.0, 'easy', 4.7),
('Louvre Museum', 'World''s largest art museum', 2, 2, 17.00, 4.0, 'easy', 4.6),
('Tokyo Skytree', 'Tallest structure in Japan', 3, 1, 28.00, 2.0, 'easy', 4.3),
('Senso-ji Temple', 'Ancient Buddhist temple', 3, 8, 0.00, 1.5, 'easy', 4.4),
('Grand Palace', 'Former royal residence', 4, 1, 15.00, 3.0, 'easy', 4.5),
('Floating Markets', 'Traditional river markets', 4, 3, 20.00, 4.0, 'easy', 4.2),
('Big Ben', 'Iconic clock tower', 5, 1, 0.00, 1.0, 'easy', 4.4),
('British Museum', 'World history and culture', 5, 2, 0.00, 3.0, 'easy', 4.6);

-- Note: You would need actual user data to test the full dashboard functionality
-- The dashboard will work with an authenticated user and will show empty states for new users
