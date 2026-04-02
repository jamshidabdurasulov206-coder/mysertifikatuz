-- Normalize legacy manual difficulty values to neutral default for Rasch workflow
UPDATE questions
SET difficulty_level = 1.0
WHERE difficulty_level IS DISTINCT FROM 1.0;
