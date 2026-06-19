# Game Verification Exploit - Fix Implementation

## Summary

A critical security vulnerability was discovered where players could manipulate game outcomes by sending arbitrary "credit" requests to the server without proper verification. The server was blindly trusting client-sent win amounts, allowing an attacker to achieve a 100% win rate.

### Evidence of Exploit:
- **House Edge**: -88.88 (impossible - house was losing money)
- **Win Rate**: 100% (statistically impossible without cheating)
- **Wallet**: `CJf1Nuvxk_9znm` (now banned)
- **Pattern**: Rapid small bets followed by large credits (up to 2000x multiplier)

---

## Fix Implementation

### 1. Server-Side Game Verification (`/src/lib/server/play/gameVerification.ts`)

**New System:**
- Server generates cryptographic seeds for each game session
- Server verifies game outcomes before crediting wins
- Multipliers are calculated server-side and validated
- Game sessions expire after 15 minutes

**Key Functions:**
- `createGameSession()` - Creates a verified game session with server seed
- `verifyGameOutcome()` - Validates game outcome before allowing credit
- Mines, Plinko, Roulette, and Wheel verification functions

### 2. Database Migration (`/supabase/migrations/20260619000000_game_sessions_table.sql`)

**New Table: `game_sessions`**
- Stores server seeds, game data, and outcomes
- Tracks session expiration and consumption
- Indexed for fast lookups

### 3. Updated Bet Handlers

**Both Aptos and Solana handlers now:**

#### Debit Flow (Starting a game):
1. Debit player's balance
2. Create game session with server seed
3. Return `sessionId` and `serverSeedHash` to client
4. Record pending stake

#### Credit Flow (Claiming a win):
1. Require `sessionId` and `outcome` from client
2. Verify game outcome server-side
3. Calculate actual payout based on verified multiplier
4. Only credit if verification passes
5. Return verified multiplier and server seed

### 4. Banned Exploiter (`/supabase/migrations/20260619000001_ban_exploiter_wallets.sql`)

Wallet `CJf1Nuvxk_9znm` has been permanently banned.

---

## Client-Side Changes Required

⚠️ **IMPORTANT**: Games will NOT work until you update the client-side code!

### Required Updates for All Games:

#### 1. **Mines Game** (`/src/app/game/mines/game.jsx`)

**Current problematic flow:**
```javascript
// WRONG - Client decides to credit itself
await debitNative(stake, playAddress);
// ... game plays client-side ...
await creditNative(payout, playAddress); // ❌ No verification!
```

**Fixed flow:**
```javascript
// 1. Start bet - get session ID
const betResult = await debitNative(stake, playAddress, {
  game: 'mines',
  gameData: { minesCount, gridSize }
});
const { sessionId, serverSeedHash } = betResult;

// 2. Play game client-side (for UX only)
// ... reveal tiles, calculate outcome ...

// 3. Claim win with verification
const creditResult = await creditNative(payout, playAddress, {
  sessionId,
  outcome: {
    revealedTiles: numberOfTilesRevealed,
    hitMine: didHitMine,
    clientSeed: optionalClientSeed
  }
});

// Server will verify and return actual payout
const { verifiedMultiplier, serverSeed } = creditResult;
```

#### 2. **Plinko Game** (`/src/app/game/plinko/components/PlinkoGame.jsx`)

Similar updates needed:
```javascript
// 1. Start drop - get session
const betResult = await debitNative(stake, playAddress, {
  game: 'plinko',
  gameData: { rows: rowCount, riskLevel }
});

// 2. Drop ball (visual only)
const binIndex = dropBall();

// 3. Claim win with verification
const creditResult = await creditNative(payout, playAddress, {
  sessionId: betResult.sessionId,
  outcome: {
    binIndex,
    multiplier: clientCalculatedMultiplier
  }
});
```

#### 3. **Roulette & Wheel Games**

Follow the same pattern:
- Get sessionId on debit
- Play animation client-side
- Submit outcome for verification on credit

### Update Hook: `/src/hooks/usePlayBalance.js`

You'll need to update `debitNative` and `creditNative` to handle the new parameters:

```javascript
const debitNative = async (amountNative, wallet, gameOptions = {}) => {
  const result = await postPlayBet(chain, { 
    wallet, 
    action: 'debit', 
    amountNative,
    game: gameOptions.game,
    gameData: gameOptions.gameData,
    clientSeed: gameOptions.clientSeed
  });
  
  if (!result.ok) return result;
  
  dispatch(setBalance(String(result.balanceRaw ?? '0')));
  return { 
    ok: true, 
    sessionId: result.sessionId,
    serverSeedHash: result.serverSeedHash
  };
};

const creditNative = async (amountNative, wallet, verificationData = {}) => {
  const result = await postPlayBet(chain, {
    wallet,
    action: 'credit',
    amountNative,
    sessionId: verificationData.sessionId,
    outcome: verificationData.outcome
  });
  
  if (!result.ok) return result;
  
  dispatch(setBalance(String(result.balanceRaw ?? '0')));
  return {
    ok: true,
    verifiedMultiplier: result.verifiedMultiplier,
    serverSeed: result.serverSeed
  };
};
```

---

## Testing

### Before Deploying:

1. **Test Mines Game:**
   - Start a game → Should receive sessionId
   - Reveal tiles → Visual feedback only
   - Cash out → Server verifies outcome
   - Try to cheat (modify multiplier) → Should be rejected

2. **Test Plinko:**
   - Drop ball → Get sessionId
   - Ball lands → Visual only
   - Claim win → Verification should match bin

3. **Test Failure Cases:**
   - Try to credit without sessionId → Should fail
   - Try to credit with invalid outcome → Should fail
   - Try to credit with expired session (>15 min) → Should fail
   - Try to credit with someone else's sessionId → Should fail

---

## Migration Commands

```bash
# Push migrations to Supabase
npx supabase db push

# Or manually run in Supabase SQL editor:
# 1. 20260619000000_game_sessions_table.sql
# 2. 20260619000001_ban_exploiter_wallets.sql
```

---

## Security Improvements

✅ **Server-side verification**: Game outcomes calculated and verified server-side
✅ **Session-based games**: Each game has unique session preventing replay attacks
✅ **Multiplier validation**: Server enforces maximum multipliers per game type
✅ **Time-limited sessions**: Sessions expire after 15 minutes
✅ **Banned exploiter**: Wallet permanently blocked
✅ **Pending stake verification**: Additional layer validates bet amount vs payout

---

## Monitoring

### Check for Other Exploiters:

```sql
-- Find wallets with suspicious win rates
SELECT 
  wallet,
  COUNT(*) as total_games,
  SUM(CASE WHEN payout > 0 THEN 1 ELSE 0 END) as wins,
  ROUND(100.0 * SUM(CASE WHEN payout > 0 THEN 1 ELSE 0 END) / COUNT(*), 2) as win_rate_pct
FROM play_pending_stakes
WHERE consumed_at IS NOT NULL
GROUP BY wallet
HAVING win_rate_pct > 70  -- Suspiciously high
ORDER BY win_rate_pct DESC;

-- Find wallets with excessive payouts
SELECT 
  wallet,
  SUM(credit_raw) as total_credits,
  SUM(bet_raw) as total_bets,
  ROUND(SUM(credit_raw)::DECIMAL / NULLIF(SUM(bet_raw), 0), 2) as profit_ratio
FROM game_sessions
WHERE consumed_at IS NOT NULL
GROUP BY wallet
HAVING profit_ratio > 5  -- Winning more than 5x what they bet
ORDER BY profit_ratio DESC;
```

---

## Questions?

If you need help updating the client-side games, let me know which game to start with and I can provide the exact code changes.
