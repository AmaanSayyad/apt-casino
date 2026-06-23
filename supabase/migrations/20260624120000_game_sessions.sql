-- Server-issued game rounds for payout verification (outcome derived from server_seed).
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  chain TEXT NOT NULL,
  game TEXT NOT NULL,
  bet_raw TEXT NOT NULL,
  server_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT,
  game_data JSONB NOT NULL DEFAULT '{}',
  final_outcome JSONB,
  payout_multiplier DECIMAL(20, 6),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_wallet ON game_sessions (wallet);
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires ON game_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_consumed ON game_sessions (consumed_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_cleanup
  ON game_sessions (expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage game sessions" ON game_sessions;
CREATE POLICY "Service role can manage game sessions"
  ON game_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE game_sessions IS 'Server-side game rounds; server_seed used to derive outcomes on settle/credit';
