-- V19: Add idempotency key to form_record to prevent duplicate submissions
-- idem_key is nullable: existing records and requests without the header remain unaffected.
-- The unique index filters out NULLs so only non-null keys participate in deduplication.
ALTER TABLE form_record ADD COLUMN IF NOT EXISTS idem_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS uq_form_record_submitter_idem
  ON form_record (submitter_id, idem_key)
  WHERE idem_key IS NOT NULL;
