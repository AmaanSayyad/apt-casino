module apt_casino::user_balance {
    use std::signer;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;

    friend apt_casino::wheel;
    friend apt_casino::plinko;
    friend apt_casino::mines;
    friend apt_casino::roulette;

    struct House has key { admin: address }
    struct UserBalance has key { balance: u64 }

    #[event]
    struct WithdrawRequested has drop, store, copy {
        user: address,
        amount: u64,
    }

    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ALREADY_INIT: u64 = 3;
    const E_DEPRECATED: u64 = 4;

    public entry fun init(admin: &signer) {
        assert!(!exists<House>(signer::address_of(admin)), E_ALREADY_INIT);
        move_to(admin, House { admin: signer::address_of(admin) });
        coin::register<AptosCoin>(admin);
    }

    public entry fun deposit(user: &signer, amount: u64) acquires UserBalance {
        let user_addr = signer::address_of(user);
        
        // Transfer APT from user to house account
        coin::transfer<AptosCoin>(user, @apt_casino, amount);
        
        // Update user balance
        if (exists<UserBalance>(user_addr)) {
            let user_balance = borrow_global_mut<UserBalance>(user_addr);
            user_balance.balance = user_balance.balance + amount;
        } else {
            move_to(user, UserBalance { balance: amount });
        }
    }

    /// User requests withdrawal — debits ledger; admin must call admin_fulfill_withdraw to send APT.
    public entry fun request_withdraw(user: &signer, amount: u64) acquires UserBalance {
        let user_addr = signer::address_of(user);
        assert!(exists<UserBalance>(user_addr), E_INSUFFICIENT_BALANCE);
        let user_balance = borrow_global_mut<UserBalance>(user_addr);
        assert!(user_balance.balance >= amount, E_INSUFFICIENT_BALANCE);
        user_balance.balance = user_balance.balance - amount;
        event::emit(WithdrawRequested { user: user_addr, amount });
    }

    /// Deprecated — use request_withdraw + admin_fulfill_withdraw.
    public entry fun withdraw(user: &signer, _amount: u64) acquires UserBalance {
        let user_addr = signer::address_of(user);
        if (exists<UserBalance>(user_addr)) {
            let _balance = borrow_global<UserBalance>(user_addr);
            assert!(false, E_DEPRECATED);
        };
        abort E_DEPRECATED
    }

    /// Admin sends APT after request_withdraw (or manual payout).
    public entry fun admin_fulfill_withdraw(admin: &signer, to: address, amount: u64) acquires House {
        let house = borrow_global<House>(@apt_casino);
        assert!(signer::address_of(admin) == house.admin, E_NOT_ADMIN);
        coin::transfer<AptosCoin>(admin, to, amount);
    }

    // Admin function to update user balance after verifying external transfer
    public entry fun admin_deposit(admin: &signer, user_addr: address, amount: u64) acquires House, UserBalance {
        // Verify admin
        let house = borrow_global<House>(@apt_casino);
        assert!(signer::address_of(admin) == house.admin, E_NOT_ADMIN);
        
        // Update user balance
        if (exists<UserBalance>(user_addr)) {
            let user_balance = borrow_global_mut<UserBalance>(user_addr);
            user_balance.balance = user_balance.balance + amount;
        } else {
            // Note: Cannot create UserBalance for another user from admin account
            // User must call deposit first to create their UserBalance resource
            assert!(false, E_INSUFFICIENT_BALANCE); // User must have existing balance
        }
    }

    // Get user balance
    public fun get_balance(user_addr: address): u64 acquires UserBalance {
        if (exists<UserBalance>(user_addr)) {
            borrow_global<UserBalance>(user_addr).balance
        } else {
            0
        }
    }

    // Get admin address
    public fun get_admin_addr(): address acquires House {
        borrow_global<House>(@apt_casino).admin
    }

    /// Deprecated — exploitable; use admin_add_winnings or in-package game settlement.
    public entry fun add_winnings_with_signer(user: &signer, _amount: u64) acquires UserBalance {
        let user_addr = signer::address_of(user);
        if (exists<UserBalance>(user_addr)) {
            let _balance = borrow_global<UserBalance>(user_addr);
            assert!(false, E_DEPRECATED);
        };
        abort E_DEPRECATED
    }

    /// Credit winnings (legacy public visibility retained for module upgrade compatibility).
    public fun add_winnings(user_addr: address, amount: u64) acquires UserBalance {
        assert!(exists<UserBalance>(user_addr), E_INSUFFICIENT_BALANCE);
        let user_balance = borrow_global_mut<UserBalance>(user_addr);
        user_balance.balance = user_balance.balance + amount;
    }

    /// Admin-only balance credit (manual reconciliation / legacy ops).
    public entry fun admin_add_winnings(admin: &signer, user_addr: address, amount: u64) acquires House, UserBalance {
        let house = borrow_global<House>(@apt_casino);
        assert!(signer::address_of(admin) == house.admin, E_NOT_ADMIN);
        assert!(exists<UserBalance>(user_addr), E_INSUFFICIENT_BALANCE);
        let user_balance = borrow_global_mut<UserBalance>(user_addr);
        user_balance.balance = user_balance.balance + amount;
    }
}
