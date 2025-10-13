-- Enable UUID generation if it's not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
--  Core "users" table
--  Stores the fundamental, unique information for each user.
-- =================================================================
CREATE TABLE users (
    -- Use UUID for primary keys. They are globally unique, which is ideal for microservices.
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User's email is their main identifier for login. It must be unique and not null.
    -- Using TEXT is flexible. Using CITEXT (case-insensitive text) extension can also be useful here.
    email TEXT UNIQUE NOT NULL,

    -- A user's chosen display name. Can be null if they haven't set one yet.
    display_name TEXT,

    -- URL for the user's avatar. Can be null.
    avatar_url TEXT,

    -- The unique identifier provided by Google OAuth.
    -- This is UNIQUE, but NULLABLE to allow for other auth methods in the future (e.g., GitHub, email/password).
    google_id TEXT UNIQUE,

    -- Timestamps with time zone are crucial for auditing and consistency across regions.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a trigger to automatically update the updated_at timestamp whenever a row is changed.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add comments to columns for clarity, which helps future developers.
COMMENT ON COLUMN users.id IS 'Primary unique identifier for the user.';
COMMENT ON COLUMN users.email IS 'User''s unique email address, used for login.';
COMMENT ON COLUMN users.google_id IS 'Unique identifier from Google for OAuth.';


-- =================================================================
--  "roles" lookup table
--  Defines all possible roles in the system. This normalizes the data.
-- =================================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

COMMENT ON TABLE roles IS 'Defines the set of user roles (e.g., admin, user).';

-- Insert the default roles your system will have.
INSERT INTO roles (name) VALUES ('user'), ('admin');


-- =================================================================
--  "user_roles" junction table
--  Links users to roles in a many-to-many relationship.
-- =================================================================
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id INTEGER NOT NULL,

    -- Define foreign keys to enforce data integrity.
    -- ON DELETE CASCADE means if a user or a role is deleted, the corresponding link is also deleted.
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,

    -- The primary key is the combination of user_id and role_id, ensuring a user can't have the same role twice.
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Assigns roles to users, forming a many-to-many relationship.';
