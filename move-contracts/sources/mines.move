module apt_casino::mines {
    use std::signer;
    use aptos_framework::event;
    use aptos_framework::error;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::randomness;


    /// Admin/House state
    struct House has key { admin: address }

    /// Per-user escrowed balance (internal ledger in Octas)
    struct Balance has key { amount: u64 }

    #[event]
    struct MinesBetPlaced has drop, store, copy { player: address, amount: u64, pick: u8 }
    #[event]
    struct MinesBetResult has drop, store, copy { player: address, win: bool, mine: u8, payout: u64 }

    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_ESCROW: u64 = 2;
    const E_INVALID_BET: u64 = 3;
    const E_ALREADY_INIT: u64 = 4;

    public entry fun init(admin: &signer) {
        assert!(!exists<House>(signer::address_of(admin)), E_ALREADY_INIT);
        move_to(admin, House { admin: signer::address_of(admin) });
        coin::register<AptosCoin>(admin);
    }

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
    entry fun house_play(admin: &signer, player: address, amount: u64, mines: u8) acquires House {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        // For mines game, we don't need this function since users play directly
        // This is kept for compatibility but not used
    }

    #[randomness]
    entry fun user_play(user: &signer, amount: u64, mines: u8) {
        let user_addr = signer::address_of(user);
        assert!(amount > 0, error::invalid_argument(E_INVALID_BET));
        assert!(mines > 0 && mines < 25, error::invalid_argument(E_INVALID_BET));

        // Transfer APT directly from user's wallet to casino
        coin::transfer<AptosCoin>(user, @apt_casino, amount);

        event::emit<MinesBetPlaced>(MinesBetPlaced { player: user_addr, amount, pick: mines });
        
        // For mines game, we don't need randomness here since it's client-side
        // The game result is determined by the client, we just record the bet
        let payout = 0; // Will be calculated client-side
        
        event::emit<MinesBetResult>(MinesBetResult { player: user_addr, win: false, mine: 0, payout });
    }

    // Cashout function for mines game
    public entry fun cashout(user: &signer, payout: u64, multiplier: u64, revealed_count: u64) {
        let user_addr = signer::address_of(user);
        assert!(payout > 0, error::invalid_argument(E_INVALID_BET));
        assert!(multiplier > 0, error::invalid_argument(E_INVALID_BET));
        assert!(revealed_count > 0, error::invalid_argument(E_INVALID_BET));

        // For now, we'll just emit the cashout event
        // In a real implementation, this would need admin signature for payout
        // The payout will be handled by the admin manually
        
        event::emit<MinesBetResult>(MinesBetResult { 
            player: user_addr, 
            win: true, 
            mine: 0, 
            payout 
        });
    }

    // Remove the old play_internal function since it's not needed anymore
    // The mines game logic is handled client-side

    public fun get_balance(addr: address): u64 acquires Balance { if (exists<Balance>(addr)) borrow_global<Balance>(addr).amount else 0 }
    public fun get_admin_addr(): address acquires House { borrow_global<House>(@apt_casino).admin }
    

}
