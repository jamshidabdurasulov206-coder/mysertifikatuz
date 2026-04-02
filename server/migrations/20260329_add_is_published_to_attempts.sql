-- Add is_published column to attempts table
ALTER TABLE attempts ADD COLUMN is_published BOOLEAN DEFAULT false;
