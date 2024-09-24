module apt_casino::user_balance {
    use std::signer;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;

    struct House has key { admin: address }
    struct UserBalance has key { balance: u64 }

    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ALREADY_INIT: u64 = 3;

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

    public entry fun withdraw(user: &signer, amount: u64) acquires UserBalance {
        let user_addr = signer::address_of(user);
        
        // Check if user has sufficient balance
        assert!(exists<UserBalance>(user_addr), E_INSUFFICIENT_BALANCE);
        let user_balance = borrow_global_mut<UserBalance>(user_addr);
        assert!(user_balance.balance >= amount, E_INSUFFICIENT_BALANCE);
        
        // Update user balance
        user_balance.balance = user_balance.balance - amount;
        
        // Note: Actual transfer will be handled by admin later
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

    // Add winnings from games (can be called by other modules)
    public fun add_winnings(user_addr: address, amount: u64) acquires UserBalance {
        if (exists<UserBalance>(user_addr)) {
            let user_balance = borrow_global_mut<UserBalance>(user_addr);
            user_balance.balance = user_balance.balance + amount;
        } else {
            // Create new balance if it doesn't exist
            // Note: This requires the user to have called deposit at least once
        };
    }

    // Add winnings with signer (can create new balance if needed)
    public entry fun add_winnings_with_signer(user: &signer, amount: u64) acquires UserBalance {
        let user_addr = signer::address_of(user);
        if (exists<UserBalance>(user_addr)) {
            let user_balance = borrow_global_mut<UserBalance>(user_addr);
            user_balance.balance = user_balance.balance + amount;
        } else {
            // Create new balance if it doesn't exist
            move_to(user, UserBalance { balance: amount });
        };
    }
}
