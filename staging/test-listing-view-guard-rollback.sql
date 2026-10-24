-- Read-only negative-path verification for staging only.
-- A positive duplicate-count test needs a dedicated staging test account
-- because listings.owner_id has a foreign key to auth.users.
-- Do not fabricate an auth.users row or use real production users.
SELECT
  vexorio_private.record_listing_view_guarded(9223372036854775807, repeat('a',64)) IS NULL AS missing_listing_rejected,
  vexorio_private.record_listing_view_guarded(9223372036854775807, 'invalid-digest') IS NULL AS invalid_digest_rejected,
  vexorio_private.record_listing_view_guarded(NULL, repeat('a',64)) IS NULL AS null_listing_rejected,
  NOT EXISTS (
    SELECT 1 FROM vexorio_private.listing_view_guard
    WHERE listing_id = 9223372036854775807
  ) AS no_guard_rows_for_missing_listing;
-- All four columns must be TRUE.
