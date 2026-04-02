-- attempts jadvalidagi is_reviewed va is_published ustunlarini BOOLEAN qilib o'zgartirish va default qiymat berish
ALTER TABLE attempts ALTER COLUMN is_reviewed TYPE BOOLEAN USING (is_reviewed::boolean);
ALTER TABLE attempts ALTER COLUMN is_reviewed SET DEFAULT false;
UPDATE attempts SET is_reviewed = false WHERE is_reviewed IS NULL OR is_reviewed = '' OR is_reviewed = '[]';

ALTER TABLE attempts ALTER COLUMN is_published TYPE BOOLEAN USING (is_published::boolean);
ALTER TABLE attempts ALTER COLUMN is_published SET DEFAULT false;
UPDATE attempts SET is_published = false WHERE is_published IS NULL OR is_published = '' OR is_published = '[]';
