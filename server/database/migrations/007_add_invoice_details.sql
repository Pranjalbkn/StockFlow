ALTER TABLE sales
ADD COLUMN customer_phone VARCHAR(20),
ADD COLUMN created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

UPDATE sales
SET created_by_user_id = user_id
WHERE created_by_user_id IS NULL;

CREATE INDEX sales_created_by_user_id_index ON sales(created_by_user_id);
