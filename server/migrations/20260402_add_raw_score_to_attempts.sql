-- Rasch oqimi uchun xom (binary) natijani final ko'rsatkichdan alohida saqlash
ALTER TABLE attempts
ADD COLUMN IF NOT EXISTS raw_score numeric;
