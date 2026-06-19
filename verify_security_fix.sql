-- ================================================================
-- SECURITY FIX VERIFICATION & DAMAGE ASSESSMENT QUERIES
-- Run these in Supabase SQL Editor to check the state of your system
-- ================================================================

-- 1. VERIFY MIGRATIONS ARE APPLIED
-- ================================

-- Check if game_sessions table exists and is empty (new table)
SELECT 
  'game_sessions table' as check_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Table exists and is ready'
    ELSE '⚠️ Table has records (might be from testing)'
  END as status
FROM game_sessions;

-- Check if exploiter is banned
SELECT 
  'exploiter_banned' as check_name,
  COUNT(*) as banned_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exploiter wallet is banned'
    ELSE '❌ Exploiter NOT banned - migration may have failed'
  END as status
FROM banned_wallets
WHERE wallet_address = 'CJf1Nuvxk_9znm';


-- 2. FIND ALL EXPLOITERS (SUSPICIOUS ACTIVITY)
-- =============================================

-- Find wallets with suspiciously high win rates (>70%)
SELECT 
  wallet,
  chain,
  COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) as completed_games,
  COUNT(*) FILTER (WHERE consumed_at IS NULL) as pending_games,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) 
    / NULLIF(COUNT(*), 0), 
    2
  ) as completion_rate_pct,
  TO_CHAR(MIN(created_at), 'YYYY-MM-DD HH24:MI') as first_activity,
  TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI') as last_activity
FROM play_pending_stakes
GROUP BY wallet, chain
HAVING COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) >= 5  -- At least 5 games
ORDER BY completion_rate_pct DESC
LIMIT 20;


-- 3. DAMAGE ASSESSMENT - HOW MUCH WAS STOLEN
-- ===========================================

-- Check the exploiter's activity summary
WITH exploiter_activity AS (
  SELECT 
    wallet,
    chain,
    COUNT(*) as total_bets,
    SUM(bet_raw::bigint) as total_wagered_raw,
    TO_CHAR(MIN(created_at), 'YYYY-MM-DD HH24:MI') as first_bet,
    TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI') as last_bet
  FROM play_pending_stakes
  WHERE wallet = 'CJf1Nuvxk_9znm'
  GROUP BY wallet, chain
)
SELECT 
  '💰 EXPLOITER ACTIVITY SUMMARY' as report_section,
  *
FROM exploiter_activity;

-- Check exploiter's deposits
SELECT 
  'EXPLOITER DEPOSITS' as section,
  wallet,
  chain,
  COUNT(*) as deposit_count,
  SUM(amount_octas::bigint) as total_deposited_raw,
  CASE 
    WHEN chain = 'aptos' THEN ROUND(SUM(amount_octas::bigint) / 100000000.0, 4)
    WHEN chain = 'solana' THEN ROUND(SUM(amount_octas::bigint) / 1000000000.0, 4)
  END as total_deposited_native,
  TO_CHAR(MIN(created_at), 'YYYY-MM-DD HH24:MI') as first_deposit,
  TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI') as last_deposit
FROM deposits_log
WHERE wallet = 'CJf1Nuvxk_9znm'
GROUP BY wallet, chain;

-- Check exploiter's withdrawals
SELECT 
  'EXPLOITER WITHDRAWALS' as section,
  wallet,
  chain,
  COUNT(*) as withdrawal_count,
  SUM(gross_octas::bigint) as total_withdrawn_raw,
  CASE 
    WHEN chain = 'aptos' THEN ROUND(SUM(gross_octas::bigint) / 100000000.0, 4)
    WHEN chain = 'solana' THEN ROUND(SUM(gross_octas::bigint) / 1000000000.0, 4)
  END as total_withdrawn_native,
  SUM(user_payout_octas::bigint) as total_payout_raw,
  COUNT(*) FILTER (WHERE status = 'auto') as auto_approved,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_approval
FROM withdrawal_requests
WHERE wallet = 'CJf1Nuvxk_9znm'
GROUP BY wallet, chain;

-- Calculate net profit/loss for exploiter
SELECT 
  'NET DAMAGE (Exploiter Profit)' as section,
  d.wallet,
  d.chain,
  COALESCE(d.total_deposited, 0) as deposited,
  COALESCE(w.total_withdrawn, 0) as withdrawn,
  COALESCE(w.total_withdrawn, 0) - COALESCE(d.total_deposited, 0) as net_profit,
  CASE 
    WHEN d.chain = 'aptos' THEN 'APT'
    WHEN d.chain = 'solana' THEN 'SOL'
  END as currency
FROM (
  SELECT 
    wallet, 
    chain,
    SUM(amount_octas::bigint) as total_deposited
  FROM deposits_log
  WHERE wallet = 'CJf1Nuvxk_9znm'
  GROUP BY wallet, chain
) d
FULL OUTER JOIN (
  SELECT 
    wallet, 
    chain,
    SUM(gross_octas::bigint) as total_withdrawn
  FROM withdrawal_requests
  WHERE wallet = 'CJf1Nuvxk_9znm'
  GROUP BY wallet, chain
) w ON d.wallet = w.wallet AND d.chain = w.chain;


-- 4. FIND OTHER POTENTIAL EXPLOITERS
-- ===================================

-- Wallets with abnormally high win rates on Aptos
WITH aptos_stats AS (
  SELECT 
    wallet,
    COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) as games_played,
    -- Rough approximation: if most games result in credits, win rate is high
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) 
      / NULLIF(COUNT(*), 0), 
      2
    ) as estimated_win_rate
  FROM play_pending_stakes
  WHERE chain = 'aptos'
    AND created_at > NOW() - INTERVAL '7 days'  -- Last 7 days
  GROUP BY wallet
  HAVING COUNT(*) >= 3  -- At least 3 games
)
SELECT 
  '🚨 SUSPICIOUS APTOS WALLETS (Last 7 Days)' as alert_type,
  wallet,
  games_played,
  estimated_win_rate,
  CASE 
    WHEN estimated_win_rate > 90 THEN '🔴 EXTREMELY SUSPICIOUS - Likely exploiting'
    WHEN estimated_win_rate > 75 THEN '🟠 VERY SUSPICIOUS - Should investigate'
    WHEN estimated_win_rate > 60 THEN '🟡 SUSPICIOUS - Monitor closely'
  END as risk_level
FROM aptos_stats
WHERE estimated_win_rate > 60
ORDER BY estimated_win_rate DESC, games_played DESC;

-- Wallets with rapid deposit -> play -> withdraw cycles (classic exploit pattern)
WITH wallet_timeline AS (
  SELECT 
    wallet,
    chain,
    MIN(d.created_at) as first_deposit,
    MAX(w.created_at) as last_withdrawal,
    EXTRACT(EPOCH FROM (MAX(w.created_at) - MIN(d.created_at))) / 3600 as hours_between
  FROM deposits_log d
  LEFT JOIN withdrawal_requests w ON d.wallet = w.wallet AND d.chain = w.chain
  WHERE d.created_at > NOW() - INTERVAL '7 days'
  GROUP BY wallet, chain
  HAVING MAX(w.created_at) IS NOT NULL
)
SELECT 
  '⚠️ RAPID DEPOSIT-WITHDRAW PATTERN' as pattern_type,
  wallet,
  chain,
  ROUND(hours_between::numeric, 2) as hours_between_first_last,
  TO_CHAR(first_deposit, 'YYYY-MM-DD HH24:MI') as first_deposit_time,
  TO_CHAR(last_withdrawal, 'YYYY-MM-DD HH24:MI') as last_withdrawal_time,
  CASE 
    WHEN hours_between < 1 THEN '🔴 CRITICAL - Under 1 hour (likely bot/exploit)'
    WHEN hours_between < 6 THEN '🟠 SUSPICIOUS - Very fast turnaround'
    WHEN hours_between < 24 THEN '🟡 MONITOR - Quick cycle'
  END as risk_assessment
FROM wallet_timeline
WHERE hours_between < 24  -- Less than 24 hours from deposit to withdraw
ORDER BY hours_between ASC;


-- 5. HOUSE BALANCE CHECK
-- =======================

-- Current house balances per chain
SELECT 
  'CURRENT HOUSE BALANCES' as section,
  chain,
  currency,
  SUM(balance_raw::bigint) as total_balance_raw,
  CASE 
    WHEN chain = 'aptos' THEN ROUND(SUM(balance_raw::bigint) / 100000000.0, 4)
    WHEN chain = 'solana' THEN ROUND(SUM(balance_raw::bigint) / 1000000000.0, 4)
  END as total_balance_native,
  COUNT(DISTINCT wallet) as unique_wallets
FROM house_balances
GROUP BY chain, currency
ORDER BY chain;


-- 6. RECENT ACTIVITY AFTER FIX DEPLOYMENT
-- ========================================

-- Check for any activity since the fix was deployed (adjust timestamp as needed)
SELECT 
  'ACTIVITY SINCE FIX DEPLOYMENT' as section,
  COUNT(*) as bet_attempts,
  COUNT(DISTINCT wallet) as unique_wallets,
  COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) as completed_bets,
  COUNT(*) FILTER (WHERE consumed_at IS NULL) as pending_bets
FROM play_pending_stakes
WHERE created_at > '2026-06-19 19:00:00'::timestamptz  -- Adjust to your deployment time
GROUP BY chain
ORDER BY chain;


-- ================================================================
-- END OF VERIFICATION QUERIES
-- ================================================================

-- SUMMARY RECOMMENDATIONS:
-- 1. Review any wallets flagged as 🔴 CRITICAL or 🟠 VERY SUSPICIOUS
-- 2. Ban additional exploiters if found
-- 3. Consider reverting/freezing balances of confirmed exploiters
-- 4. Monitor the "ACTIVITY SINCE FIX DEPLOYMENT" section - should show 0 completed bets until client code is updated
-- 5. Check NET DAMAGE to calculate total losses
