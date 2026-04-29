-- V21: Add wizard finalize state keys to system_config (DEF-SETUP-04 C2).
--
-- POST /setup/finalize is a second-stage atomic submission for wizard steps 5-10
-- (custom roles, employee import, org tree, global config, approval flows, retention).
-- It is independent from the recovery code (which rotates on every verify and
-- would invalidate the user's saved code if reused for finalize auth).
--
-- Keys introduced:
--   * wizard_finalize_completed — boolean string ("true" / "false"), default "false".
--     Becomes "true" after a successful /setup/finalize call. Subsequent calls return 409.
--   * wizard_finalize_token     — SHA-256 hex hash of the idempotency token returned
--     by /setup/init in field `wizardFinalizeToken`. Plaintext token lives only in
--     the front-end reactive state during the wizard. Cleared (set to NULL) on
--     successful finalize and on /dev/reset-finalize.
--
-- Uses PostgreSQL ON CONFLICT (also supported by H2 in default mode), avoiding
-- H2-only MERGE INTO ... KEY(...) syntax that broke setup/init in the past.

-- ON CONFLICT DO NOTHING preserves existing token hash on re-run; only seeds initial NULL when row is missing.
INSERT INTO system_config (config_key, config_value, description)
VALUES ('wizard_finalize_completed', 'false', '初始化向导 step 5-10 finalize 完成标记')
ON CONFLICT (config_key) DO NOTHING;

-- ON CONFLICT DO NOTHING preserves existing token hash on re-run; only seeds initial NULL when row is missing.
INSERT INTO system_config (config_key, config_value, description)
VALUES ('wizard_finalize_token', NULL, '初始化向导 finalize 幂等性令牌（SHA-256 哈希），由 /setup/init 生成')
ON CONFLICT (config_key) DO NOTHING;
