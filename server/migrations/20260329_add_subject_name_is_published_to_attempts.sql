-- attempts jadvaliga subject_name va is_published ustunlarini qo'shish
ALTER TABLE attempts
ADD COLUMN subject_name VARCHAR(255),
ADD COLUMN is_published BOOLEAN DEFAULT FALSE;

-- Agar status ustuni bo‘lsa, uni olib tashlash
ALTER TABLE attempts
DROP COLUMN IF EXISTS status;
