-- attempts jadvalidagi is_reviewed ustunini BOOLEAN qilib o'zgartirish va default qiymat berish
ALTER TABLE attempts ALTER COLUMN is_reviewed TYPE BOOLEAN USING (is_reviewed::boolean);
ALTER TABLE attempts ALTER COLUMN is_reviewed SET DEFAULT false;
UPDATE attempts SET is_reviewed = false WHERE is_reviewed IS NULL OR is_reviewed = '';
