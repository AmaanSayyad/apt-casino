module apt_casino::wheel {
    use std::signer;
    use aptos_framework::event;
    use aptos_framework::error;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::randomness;
    use apt_casino::user_balance;

    struct House has key { admin: address }
    struct Balance has key { amount: u64 }

    #[event]
    struct WheelBetPlaced has drop, store, copy { player: address, amount: u64, sectors: u8 }
    #[event]
    struct WheelBetResult has drop, store, copy { player: address, result: u8, payout: u64 }

    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_ESCROW: u64 = 2;
    const E_INVALID_BET: u64 = 3;
    const E_ALREADY_INIT: u64 = 4;

    public entry fun init(admin: &signer) {
        assert!(!exists<House>(signer::address_of(admin)), E_ALREADY_INIT);
        move_to(admin, House { admin: signer::address_of(admin) });
        coin::register<AptosCoin>(admin);
    }

    // Keep for backward compatibility (not used in new system)
    public entry fun deposit(user: &signer, amount: u64, house_addr: address) acquires Balance {
        coin::transfer<AptosCoin>(user, house_addr, amount);
        let addr = signer::address_of(user);
        if (exists<Balance>(addr)) {
            let b = borrow_global_mut<Balance>(addr);
            b.amount = b.amount + amount;
        } else {
            move_to(user, Balance { amount });
        }
    }

    public entry fun request_withdraw(user: &signer, amount: u64) acquires Balance {
        let addr = signer::address_of(user);
        assert!(exists<Balance>(addr), error::not_found(E_INSUFFICIENT_ESCROW));
        let b = borrow_global_mut<Balance>(addr);
        assert!(b.amount >= amount, error::invalid_argument(E_INSUFFICIENT_ESCROW));
        b.amount = b.amount - amount;
    }

    public entry fun admin_payout(admin: &signer, to: address, amount: u64) acquires House {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        coin::transfer<AptosCoin>(admin, to, amount);
    }

    #[randomness]
    entry fun house_spin(admin: &signer, player: address, amount: u64, sectors: u8) acquires House, Balance {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        spin_internal(admin, player, amount, sectors);
    }

    #[randomness]
    entry fun user_spin(user: &signer, amount: u64, sectors: u8) acquires Balance {
        let addr = signer::address_of(user);
        
        // Take APT directly from user's wallet
        coin::transfer<AptosCoin>(user, @apt_casino, amount);
        
        // Create wheel balance for this user if it doesn't exist
        if (!exists<Balance>(addr)) {
            move_to(user, Balance { amount: 0 });
        };
        
        // Now spin with the bet amount
        spin_internal(user, addr, amount, sectors);
    }

    fun spin_internal(user: &signer, player: address, amount: u64, sectors: u8) acquires Balance {
        // No need to check Balance resource - we're using the bet amount directly
        assert!(amount > 0, error::invalid_argument(E_INVALID_BET));
        assert!(sectors > 1 && sectors <= 12, error::invalid_argument(E_INVALID_BET));

        event::emit<WheelBetPlaced>(WheelBetPlaced { player, amount, sectors });
        
        // Calculate result and payout
        let result: u8 = (randomness::u64_range(0, (sectors as u64)) as u8);
        
        // Define multipliers based on risk level
        let multiplier = if (sectors == 2) {
            // Low risk: 1 winning sector out of 2, 1.98x multiplier
            198 // 1.98x as integer (multiply by 100)
        } else if (sectors == 4) {
            // Medium risk: 1 winning sector out of 4, 3.96x multiplier  
            396 // 3.96x as integer
        } else if (sectors == 8) {
            // High risk: 1 winning sector out of 8, 7.92x multiplier
            792 // 7.92x as integer
        } else {
            // Default case - should not happen with proper validation
            100 // 1x (no win)
        };
        
        // Randomly select winning sector for fairness (different from result)
        let winning_sector = (randomness::u64_range(0, (sectors as u64)) as u8);
        
        // Check if result is a winning sector
        let is_winner = result == winning_sector;
        
        let payout = if (is_winner) {
            amount * multiplier / 100 // Convert back from integer multiplier
        } else {
            0 // Player loses, no payout
        };
        
        if (payout > 0) { 
            // Transfer winnings to main user_balance system
            user_balance::add_winnings_with_signer(user, payout);
            
            // Also add to wheel balance for immediate use
            let b = borrow_global_mut<Balance>(player);
            b.amount = b.amount + payout;
        };
        
        event::emit<WheelBetResult>(WheelBetResult { player, result, payout });
    }

    public fun get_balance(addr: address): u64 acquires Balance { if (exists<Balance>(addr)) borrow_global<Balance>(addr).amount else 0 }
    public fun get_admin_addr(): address acquires House { borrow_global<House>(@apt_casino).admin }
}
