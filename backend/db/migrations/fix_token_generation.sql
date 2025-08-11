-- Update token generation functions to use hex encoding instead of base64url
DROP FUNCTION IF EXISTS generate_share_token() CASCADE;
DROP FUNCTION IF EXISTS auto_generate_share_token() CASCADE;

-- Function to generate a secure random share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate share token for new trips
CREATE OR REPLACE FUNCTION auto_generate_share_token()
RETURNS TRIGGER AS $$
BEGIN
  NEW.share_token = generate_share_token();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS generate_share_token_trigger ON trips;
CREATE TRIGGER generate_share_token_trigger
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_share_token();
