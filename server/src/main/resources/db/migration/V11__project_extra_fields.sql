-- V11: Add contract and client info fields to project table
ALTER TABLE project
  ADD COLUMN IF NOT EXISTS contract_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contract_attachment_id BIGINT,
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS project_description TEXT;
