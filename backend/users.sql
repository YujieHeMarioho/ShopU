-- Add auth0_id column
ALTER TABLE users
ADD COLUMN auth0_id VARCHAR(255) UNIQUE;

-- Add is_admin column
ALTER TABLE users
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
