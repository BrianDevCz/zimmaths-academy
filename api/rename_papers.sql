DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM "Paper" ORDER BY year ASC, session ASC, "paperNumber" ASC
  LOOP
    UPDATE "Paper" 
    SET title = 'ZimMaths Practice ' || counter
    WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$;