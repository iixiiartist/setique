-- Update all existing demo datasets to be free ($0)
UPDATE datasets
SET price = 0
WHERE title LIKE '(DEMO)%';
