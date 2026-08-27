ALTER TABLE users
ADD COLUMN brand_name VARCHAR(120),
ADD COLUMN owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
ALTER COLUMN brand_name SET DEFAULT 'My Business';

UPDATE users
SET brand_name = name || '''s Store'
WHERE role = 'OWNER' AND brand_name IS NULL;

CREATE INDEX users_owner_user_id_index ON users(owner_user_id);
