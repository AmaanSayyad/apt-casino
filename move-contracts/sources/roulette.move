module apt_casino::roulette {
    use std::signer;
    use std::vector; // Import the vector module
    use aptos_framework::event; // module events
    use aptos_framework::error; // error helpers
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::randomness; // On-chain randomness (Aptos Roll)


    /// Admin/House state
    struct House has key {
        admin: address,
    }

    /// Per-user escrowed balance (internal ledger in Octas)
    struct Balance has key {
        amount: u64,
    }

    #[event]
    struct BetPlaced has drop, store, copy { player: address, amount: u64, bet_kind: u8, bet_value: u8 }
    #[event]
    struct BetResult has drop, store, copy { player: address, win: bool, roll: u8, payout: u64 }
    #[event]
    struct WithdrawRequested has drop, store, copy { player: address, amount: u64 }
    #[event]
    struct PayoutExecuted has drop, store, copy { player: address, amount: u64 }

    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_ESCROW: u64 = 2;
    const E_INVALID_BET: u64 = 3;
    const E_ALREADY_INIT: u64 = 4;

    /// Publish admin resources under the deployer account.
    public entry fun init(admin: &signer) {
        assert!(!exists<House>(signer::address_of(admin)), E_ALREADY_INIT);
        move_to(admin, House { admin: signer::address_of(admin) });
        // Ensure the house has a CoinStore to receive deposits
        coin::register<AptosCoin>(admin);
    }

    /// User deposits APT into the house escrow. Requires one-time signature from the user.
    public entry fun deposit(user: &signer, amount: u64, house_addr: address) acquires Balance {
        // Transfer APT from user into the house's account
        coin::transfer<AptosCoin>(user, house_addr, amount);

        let user_addr = signer::address_of(user);
        if (exists<Balance>(user_addr)) {
            let b_ref = borrow_global_mut<Balance>(user_addr);
            b_ref.amount = b_ref.amount + amount;
        } else {
            move_to(user, Balance { amount });
        }
        // Note: deposit event intentionally omitted (bet events are primary)
    }

    /// Request withdrawal from internal escrow. House will later execute payout and pay gas.
    public entry fun request_withdraw(user: &signer, amount: u64) acquires Balance {
        let user_addr = signer::address_of(user);
        assert!(exists<Balance>(user_addr), error::not_found(E_INSUFFICIENT_ESCROW));
        let b_ref = borrow_global_mut<Balance>(user_addr);
        assert!(b_ref.amount >= amount, error::invalid_argument(E_INSUFFICIENT_ESCROW));
        b_ref.amount = b_ref.amount - amount;

        event::emit<WithdrawRequested>(WithdrawRequested { player: user_addr, amount });
    }

    /// Admin executes a payout: transfers APT from house to player. Gas is paid by the house.
    public entry fun admin_payout(admin: &signer, to: address, amount: u64) acquires House {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        coin::transfer<AptosCoin>(admin, to, amount);
        event::emit<PayoutExecuted>(PayoutExecuted { player: to, amount });
    }

    /// House places a bet on behalf of a player. Gas is paid by the house. The bet is settled
    /// instantly using on-chain randomness. The player's internal escrow is debited/credited.
    ///
    /// bet_kind:
    ///   0 = single number (0-36), payout 35:1 (36x total)
    ///   1 = color (0=Red,1=Black) using parity rule (even=Black, odd=Red) for demo, payout 1:1 (2x total)
    ///   2 = odd/even (0=Even,1=Odd), payout 1:1 (2x total)
    ///   3 = high/low (0=Low 1-18, 1=High 19-36), payout 1:1 (2x total)
    ///   4 = dozen (0=1st, 1=2nd, 2=3rd), payout 2:1 (3x total)
    ///   5 = column (0=1st, 1=2nd, 2=3rd), payout 2:1 (3x total)
    ///   6 = split bet (adjacent numbers), payout 17:1 (18x total)
    ///   7 = street bet (3 numbers in row), payout 11:1 (12x total)
    ///   8 = corner bet (4 numbers), payout 8:1 (9x total)
    #[randomness]
    entry fun house_place_bet(admin: &signer, player: address, amount: u64, bet_kind: u8, bet_value: u8) acquires House, Balance {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));

        // Load and check player's escrow balance
        assert!(exists<Balance>(player), error::not_found(E_INSUFFICIENT_ESCROW));
        let bal = borrow_global_mut<Balance>(player);
        assert!(bal.amount >= amount, error::invalid_argument(E_INSUFFICIENT_ESCROW));

        // Emit placement event
        event::emit<BetPlaced>(BetPlaced { player, amount, bet_kind, bet_value });

        // Debit upfront
        bal.amount = bal.amount - amount;

        // On-chain randomness: draw number in [0,36]
        // NOTE: Function name may change with framework version; replace with the stable API if needed.
        let roll: u8 = (randomness::u64_range(0, 37) as u8);

        let (win, payout) = settle(amount, bet_kind, bet_value, roll);
        if (win && payout > 0) {
            bal.amount = bal.amount + payout;
        };

        event::emit<BetResult>(BetResult { player, win, roll, payout });
    }

    /// View helpers
    public fun get_balance(addr: address): u64 acquires Balance { 
        if (exists<Balance>(addr)) borrow_global<Balance>(addr).amount else 0
    }

    public fun get_admin_addr(): address acquires House { borrow_global<House>(@apt_casino).admin }

    /// Payout calculation
    fun settle(amount: u64, bet_kind: u8, bet_value: u8, roll: u8): (bool, u64) {
        if (bet_kind == 0) {
            // Single number - 35:1 payout (only winnings, not 36x total)
            if (bet_value <= 36 && roll == bet_value) (true, amount * 35) else (false, 0)
        } else if (bet_kind == 1) {
            // Color by parity: even=Black(1), odd=Red(0). This is a demo mapping.
            let is_red = (roll % 2) == 1; // odd
            let bv_is_red = (bet_value == 0);
            if (roll != 0 && ((is_red && bv_is_red) || (!is_red && !bv_is_red))) (true, amount * 1) else (false, 0)
        } else if (bet_kind == 2) {
            // Odd / Even
            if (roll != 0) {
                let is_odd = (roll % 2) == 1;
                let want_odd = (bet_value == 1);
                if ((is_odd && want_odd) || (!is_odd && !want_odd)) (true, amount * 1) else (false, 0)
            } else (false, 0)
        } else if (bet_kind == 3) { // High/Low bet
            if (roll > 0) {
                if (bet_value == 0 && roll <= 18) { (true, amount * 1) } // Low (1-18)
                else if (bet_value == 1 && roll > 18 && roll <= 36) { (true, amount * 1) } // High (19-36)
                else { (false, 0) }
            } else { (false, 0) }
        } else if (bet_kind == 4) { // Dozen bet
            if (roll > 0) {
                if (bet_value == 0 && roll <= 12) { (true, amount * 2) }
                else if (bet_value == 1 && roll > 12 && roll <= 24) { (true, amount * 2) }
                else if (bet_value == 2 && roll > 24 && roll <= 36) { (true, amount * 2) }
                else { (false, 0) }
            } else { (false, 0) }
        } else if (bet_kind == 5) { // Column bet
            if (roll > 0) {
                if (bet_value == 0 && roll % 3 == 1) { (true, amount * 2) }
                else if (bet_value == 1 && roll % 3 == 2) { (true, amount * 2) }
                else if (bet_value == 2 && roll % 3 == 0) { (true, amount * 2) }
                else { (false, 0) }
            } else { (false, 0) }
        } else if (bet_kind == 6) { // Split bet (2 adjacent numbers)
            // For split, bet_value represents the lower number of the pair
            // Check if roll matches either bet_value or bet_value+1 (or +3 for vertical splits)
            let matches = false;
            if (bet_value > 0 && bet_value <= 35) {
                // Horizontal split (consecutive numbers)
                if (roll == bet_value || roll == bet_value + 1) {
                    matches = true;
                };
                // Vertical split (numbers 3 apart) - only valid for numbers <= 33
                if (bet_value <= 33 && (roll == bet_value || roll == bet_value + 3)) {
                    matches = true;
                };
            };
            if (matches) { (true, amount * 17) } else { (false, 0) }
        } else if (bet_kind == 7) { // Street bet (3 numbers in a row)
            // bet_value represents the first number of the street
            if (bet_value > 0 && bet_value <= 34 && bet_value % 3 == 1) {
                if (roll >= bet_value && roll <= bet_value + 2) {
                    (true, amount * 11)
                } else { (false, 0) }
            } else { (false, 0) }
        } else if (bet_kind == 8) { // Corner bet (4 numbers) - 8:1 payout (only winnings)
            // bet_value represents the top-left number of the corner
            // Corner bet is only valid for specific positions where 4 numbers form a square
            // Valid corner positions: bet_value must be in left column (bet_value % 3 == 1) and not in last row (bet_value <= 32)
            if (bet_value > 0 && bet_value <= 32 && bet_value % 3 == 1) {
                if (roll == bet_value || roll == bet_value + 1 || 
                   roll == bet_value + 3 || roll == bet_value + 4) {
                    (true, amount * 8)
                } else { (false, 0) }
            } else { (false, 0) }
        } else {
            abort error::invalid_argument(E_INVALID_BET)
        }
    }

    /// User places a bet directly (user pays gas). Direct wallet betting, no deposit needed.
    #[randomness]
    entry fun user_place_bet(user: &signer, amount: u64, bet_kind: u8, bet_value: u8) acquires Balance {
        let user_addr = signer::address_of(user);
        
        // Take APT directly from user's wallet
        coin::transfer<AptosCoin>(user, @apt_casino, amount);
        
        // Create roulette balance for this user if it doesn't exist
        if (!exists<Balance>(user_addr)) {
            move_to(user, Balance { amount: 0 });
        };
        
        // Now place bet with the amount
        let bal = borrow_global_mut<Balance>(user_addr);
        
        event::emit<BetPlaced>(BetPlaced { player: user_addr, amount, bet_kind, bet_value });
        
        // Calculate result using on-chain randomness
        let roll: u8 = (randomness::u64_range(0, 37) as u8);
        let (win, payout) = settle(amount, bet_kind, bet_value, roll);
        
        if (win && payout > 0) {
            bal.amount = bal.amount + payout;
            

        };
        
        event::emit<BetResult>(BetResult { player: user_addr, win, roll, payout });
    }

    /// User places multiple bets directly (user pays gas).
    #[randomness]
    entry fun user_place_bets_multiple(user: &signer, amounts: vector<u64>, bet_kinds: vector<u8>, bet_values: vector<u8>) acquires Balance {
        let user_addr = signer::address_of(user);

        // --- 1. Calculate Total Bet Amount & Validate ---
        let num_bets = vector::length(&amounts);
        assert!(vector::length(&bet_kinds) == num_bets, error::invalid_argument(E_INVALID_BET));
        assert!(vector::length(&bet_values) == num_bets, error::invalid_argument(E_INVALID_BET));

        let i = 0;
        let total_amount = 0;
        while (i < num_bets) {
            total_amount = total_amount + *vector::borrow(&amounts, i);
            i = i + 1;
        };
        assert!(total_amount > 0, error::invalid_argument(E_INVALID_BET));

        // --- 2. Transfer Total Amount ---
        coin::transfer<AptosCoin>(user, @apt_casino, total_amount);

        if (!exists<Balance>(user_addr)) {
            move_to(user, Balance { amount: 0 });
        };

        // --- 3. Settle Bets ---
        let roll: u8 = (randomness::u64_range(0, 37) as u8);
        let bal = borrow_global_mut<Balance>(user_addr);
        let total_payout = 0;
        let overall_win = false;
        
        i = 0;
        while (i < num_bets) {
            let amount = *vector::borrow(&amounts, i);
            let bet_kind = *vector::borrow(&bet_kinds, i);
            let bet_value = *vector::borrow(&bet_values, i);

            event::emit<BetPlaced>(BetPlaced { player: user_addr, amount, bet_kind, bet_value });
            let (win, payout) = settle(amount, bet_kind, bet_value, roll);
            if (win) {
                overall_win = true;
                total_payout = total_payout + payout;
            };
            i = i + 1;
        };

        // --- 4. Handle Payouts ---
        if (overall_win && total_payout > 0) {
            bal.amount = bal.amount + total_payout;

        };

        event::emit<BetResult>(BetResult { player: user_addr, win: overall_win, roll, payout: total_payout });
    }
}


