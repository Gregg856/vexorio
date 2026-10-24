-- Run ONLY against VEXORIO staging (owkjdlpawczrnwyszduj).
-- Rollback leaves no test listing or view-guard records.
BEGIN;
DO $test$
DECLARE
  listing_id bigint := 900000000000000001;
  visitor_a text := repeat('a',64);
  visitor_b text := repeat('b',64);
  first_count bigint;
  duplicate_count bigint;
  second_visitor_count bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id) THEN
    RAISE EXCEPTION 'Test listing ID already exists; choose another';
  END IF;
  INSERT INTO public.listings(id, owner_id, title, status, moderation_status, view_count)
  VALUES (listing_id, '00000000-0000-0000-0000-000000000001'::uuid,
    'STAGING TEST - WILL ROLLBACK', 'active', 'approved', 0);
  SELECT vexorio_private.record_listing_view_guarded(listing_id,visitor_a) INTO first_count;
  SELECT vexorio_private.record_listing_view_guarded(listing_id,visitor_a) INTO duplicate_count;
  SELECT vexorio_private.record_listing_view_guarded(listing_id,visitor_b) INTO second_visitor_count;
  IF first_count IS DISTINCT FROM 1 OR duplicate_count IS DISTINCT FROM 1 OR second_visitor_count IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'Unexpected view counts: first %, duplicate %, second %',first_count,duplicate_count,second_visitor_count;
  END IF;
  IF (SELECT count(*) FROM vexorio_private.listing_view_guard WHERE listing_id = listing_id) <> 2 THEN
    RAISE EXCEPTION 'Expected exactly two visitor guard records';
  END IF;
  RAISE NOTICE 'PASS: duplicate visitor does not increment count; second visitor does';
END $test$;
ROLLBACK;
