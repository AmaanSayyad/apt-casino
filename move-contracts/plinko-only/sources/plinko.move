module apt_casino::plinko {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::event;
    use aptos_framework::error;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    // randomness removed; using timestamp-based deterministic path for now
    use aptos_framework::timestamp;

    struct House has key { 
        admin: address,
        treasury: address,
        min_bet: u64,
        max_bet: u64,
        house_edge: u64,
        total_volume: u64,
        total_payouts: u64
    }

    struct Balance has key { 
        amount: u64,
        last_activity: u64
    }

    struct GameSession has key {
        player: address,
        bet_amount: u64,
        risk_level: u8,
        rows: u8,
        start_time: u64,
        completed: bool
    }

    /// Copyable view for GameSession
    struct GameSessionView has store, copy, drop {
        player: address,
        bet_amount: u64,
        risk_level: u8,
        rows: u8,
        start_time: u64,
        completed: bool
    }

    struct LeaderboardEntry has store, copy, drop {
        player: address,
        total_won: u64,
        games_played: u64,
        biggest_win: u64
    }

    #[event]
    struct PlinkoBetPlaced has drop, store, copy { 
        player: address, 
        amount: u64, 
        risk_level: u8, 
        rows: u8,
        session_id: u64,
        timestamp: u64
    }
    
    #[event]
    struct PlinkoBetResult has drop, store, copy { 
        player: address, 
        win: bool, 
        final_position: u8, 
        payout: u64,
        path: vector<u8>,
        session_id: u64,
        timestamp: u64
    }

    #[event]
    struct HouseStatsUpdated has drop, store, copy {
        total_volume: u64,
        total_payouts: u64,
        house_edge: u64,
        timestamp: u64
    }

    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_ESCROW: u64 = 2;
    const E_INVALID_BET: u64 = 3;
    const E_ALREADY_INIT: u64 = 4;
    const E_INVALID_RISK_LEVEL: u64 = 5;
    const E_INVALID_ROWS: u64 = 6;
    const E_BET_TOO_SMALL: u64 = 7;
    const E_BET_TOO_LARGE: u64 = 8;
    const E_SESSION_NOT_FOUND: u64 = 9;
    const E_SESSION_ALREADY_COMPLETED: u64 = 10;
    const E_INVALID_HOUSE_EDGE: u64 = 11;

    const MIN_ROWS: u8 = 8;
    const MAX_ROWS: u8 = 16;
    const MIN_RISK_LEVEL: u8 = 1;
    const MAX_RISK_LEVEL: u8 = 3;
    const DEFAULT_HOUSE_EDGE: u64 = 250; // 2.5%
    const MIN_BET_DEFAULT: u64 = 1000000; // 1 APT in octas
    const MAX_BET_DEFAULT: u64 = 1000000000; // 1000 APT in octas

    public entry fun init(admin: &signer) {
        assert!(!exists<House>(@apt_casino), E_ALREADY_INIT);
        move_to(admin, House { 
            admin: signer::address_of(admin),
            treasury: signer::address_of(admin),
            min_bet: MIN_BET_DEFAULT,
            max_bet: MAX_BET_DEFAULT,
            house_edge: DEFAULT_HOUSE_EDGE,
            total_volume: 0,
            total_payouts: 0
        });
        coin::register<AptosCoin>(admin);
    }

    public entry fun update_house_settings(
        admin: &signer, 
        min_bet: u64, 
        max_bet: u64, 
        house_edge: u64
    ) acquires House {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        assert!(min_bet > 0, error::invalid_argument(E_INVALID_BET));
        assert!(max_bet > min_bet, error::invalid_argument(E_INVALID_BET));
        assert!(house_edge <= 1000, error::invalid_argument(E_INVALID_HOUSE_EDGE));
        
        let house = borrow_global_mut<House>(@apt_casino);
        house.min_bet = min_bet;
        house.max_bet = max_bet;
        house.house_edge = house_edge;
    }

    public entry fun update_treasury(admin: &signer, new_treasury: address) acquires House {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        let house = borrow_global_mut<House>(@apt_casino);
        house.treasury = new_treasury;
    }

    public entry fun deposit(user: &signer, amount: u64) acquires Balance {
        coin::transfer<AptosCoin>(user, @apt_casino, amount);
        let addr = signer::address_of(user);
        let current_time = timestamp::now_seconds();
        
        if (exists<Balance>(addr)) {
            let b = borrow_global_mut<Balance>(addr);
            b.amount = b.amount + amount;
            b.last_activity = current_time;
        } else {
            move_to(user, Balance { 
                amount,
                last_activity: current_time
            });
        };
    }

    public entry fun withdraw(user: &signer, amount: u64) acquires Balance {
        let addr = signer::address_of(user);
        assert!(exists<Balance>(addr), error::not_found(E_INSUFFICIENT_ESCROW));
        let b = borrow_global_mut<Balance>(addr);
        assert!(b.amount >= amount, error::invalid_argument(E_INSUFFICIENT_ESCROW));
        
        b.amount = b.amount - amount;
        b.last_activity = timestamp::now_seconds();
        // NOTE: Actual coin transfer requires a signer for the treasury/admin account.
        // For safety, we only update internal ledger here. Admin can payout using `admin_payout`.
    }

    public entry fun admin_payout(admin: &signer, to: address, amount: u64) acquires House {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        coin::transfer<AptosCoin>(admin, to, amount);
    }

    #[randomness]
    entry fun house_play(
        admin: &signer, 
        player: address, 
        amount: u64, 
        risk_level: u8, 
        rows: u8
    ) acquires House, Balance, GameSession {
        assert!(signer::address_of(admin) == get_admin_addr(), error::permission_denied(E_NOT_ADMIN));
        play_internal(admin, player, amount, risk_level, rows);
    }

    #[randomness]
    entry fun user_play(
        user: &signer, 
        amount: u64, 
        risk_level: u8, 
        rows: u8
    ) acquires Balance, House, GameSession {
        let user_addr = signer::address_of(user);
        
        let house = borrow_global<House>(@apt_casino);
        assert!(amount >= house.min_bet, error::invalid_argument(E_BET_TOO_SMALL));
        assert!(amount <= house.max_bet, error::invalid_argument(E_BET_TOO_LARGE));
        
        coin::transfer<AptosCoin>(user, @apt_casino, amount);
        
        if (!exists<Balance>(user_addr)) {
            move_to(user, Balance { 
                amount: 0,
                last_activity: timestamp::now_seconds()
            });
        };
        
        play_internal(user, user_addr, amount, risk_level, rows);
    }

    fun play_internal(
        user: &signer, 
        player: address, 
        amount: u64, 
        risk_level: u8, 
        rows: u8
    ) acquires Balance, House, GameSession {
        assert!(amount > 0, error::invalid_argument(E_INVALID_BET));
        assert!(risk_level >= MIN_RISK_LEVEL && risk_level <= MAX_RISK_LEVEL, error::invalid_argument(E_INVALID_RISK_LEVEL));
        assert!(rows >= MIN_ROWS && rows <= MAX_ROWS, error::invalid_argument(E_INVALID_ROWS));

        let session_id = timestamp::now_microseconds();
        let current_time = timestamp::now_seconds();
        
        move_to(user, GameSession {
            player,
            bet_amount: amount,
            risk_level,
            rows,
            start_time: current_time,
            completed: false
        });

        event::emit<PlinkoBetPlaced>(PlinkoBetPlaced { 
            player, 
            amount, 
            risk_level, 
            rows,
            session_id,
            timestamp: current_time
        });
        
        let path = simulate_plinko_path_improved(rows);
        
        let final_position = calculate_final_position(&path);
        
        let (win, payout) = calculate_payout_improved(amount, risk_level, final_position, rows);
        
        let house = borrow_global_mut<House>(@apt_casino);
        house.total_volume = house.total_volume + amount;
        if (win && payout > 0) {
            house.total_payouts = house.total_payouts + payout;
            let b = borrow_global_mut<Balance>(player);
            b.amount = b.amount + payout;
            b.last_activity = current_time;
        };
        
        let session = borrow_global_mut<GameSession>(player);
        session.completed = true;
        
        event::emit<PlinkoBetResult>(PlinkoBetResult { 
            player, 
            win, 
            final_position, 
            payout, 
            path,
            session_id,
            timestamp: current_time
        });

        event::emit<HouseStatsUpdated>(HouseStatsUpdated {
            total_volume: house.total_volume,
            total_payouts: house.total_payouts,
            house_edge: house.house_edge,
            timestamp: current_time
        });
    }

    fun simulate_plinko_path_improved(rows: u8): vector<u8> {
        let path = vector::empty<u8>();
        let current_position = 0u64;
        
        let i = 0u64;
        while (i < (rows as u64)) {
            let seed = timestamp::now_microseconds() + i;
            let random_value = seed % 1000;
            
            let direction: u8 = if (random_value < 480) { 0 } else { 1 };
            vector::push_back(&mut path, direction);
            
            let step: u64 = if (direction == 0) { 0 } else { 1 };
            current_position = current_position + step;
            i = i + 1;
        };
        
        path
    }

    fun calculate_final_position(path: &vector<u8>): u8 {
        let final_pos = 0;
        let i = 0;
        let len = vector::length(path);
        
        while (i < len) {
            let direction = *vector::borrow(path, i);
            final_pos = final_pos + (if (direction == 0) { 0 } else { 1 });
            i = i + 1;
        };
        
        final_pos as u8
    }

    fun calculate_payout_improved(
        amount: u64, 
        risk_level: u8, 
        final_position: u8, 
        rows: u8
    ): (bool, u64) acquires House {
        let house = borrow_global<House>(@apt_casino);
        let multiplier = get_multiplier_improved(risk_level, final_position, rows);
        
        if (multiplier > 0) {
            let payout_before_edge = amount * multiplier / 100;
            let house_edge_amount = payout_before_edge * house.house_edge / 10000;
            let final_payout = payout_before_edge - house_edge_amount;
            
            (true, final_payout)
        } else {
            (false, 0)
        }
    }

    fun get_multiplier_improved(risk_level: u8, final_position: u8, rows: u8): u64 {
        if (risk_level == 1) {
            if (final_position == 0 || final_position == rows) { 250 }
            else if (final_position == 1 || final_position == rows - 1) { 180 }
            else if (final_position == 2 || final_position == rows - 2) { 130 }
            else if (final_position == 3 || final_position == rows - 3) { 110 }
            else { 0 }
        } else if (risk_level == 2) {
            if (final_position == 0 || final_position == rows) { 600 }
            else if (final_position == 1 || final_position == rows - 1) { 350 }
            else if (final_position == 2 || final_position == rows - 2) { 220 }
            else if (final_position == 3 || final_position == rows - 3) { 160 }
            else if (final_position == 4 || final_position == rows - 4) { 120 }
            else { 0 }
        } else {
            if (final_position == 0 || final_position == rows) { 1500 }
            else if (final_position == 1 || final_position == rows - 1) { 800 }
            else if (final_position == 2 || final_position == rows - 2) { 400 }
            else if (final_position == 3 || final_position == rows - 3) { 250 }
            else if (final_position == 4 || final_position == rows - 4) { 180 }
            else if (final_position == 5 || final_position == rows - 5) { 130 }
            else { 0 }
        }
    }

    public fun get_game_session(player: address): Option<GameSessionView> acquires GameSession {
        if (exists<GameSession>(player)) {
            let s_ref = borrow_global<GameSession>(player);
            option::some(GameSessionView {
                player: s_ref.player,
                bet_amount: s_ref.bet_amount,
                risk_level: s_ref.risk_level,
                rows: s_ref.rows,
                start_time: s_ref.start_time,
                completed: s_ref.completed,
            })
        } else {
            option::none()
        }
    }

    public fun get_house_stats(): (u64, u64, u64, u64, u64) acquires House {
        let house = borrow_global<House>(@apt_casino);
        (house.min_bet, house.max_bet, house.house_edge, house.total_volume, house.total_payouts)
    }

    public fun calculate_win_probability(risk_level: u8, rows: u8): u64 {
        if (risk_level == 1) {
            if (rows <= 10) { 45 } else { 40 }
        } else if (risk_level == 2) {
            if (rows <= 10) { 30 } else { 25 }
        } else {
            if (rows <= 10) { 20 } else { 15 }
        }
    }

    public fun get_balance(addr: address): u64 acquires Balance { 
        if (exists<Balance>(addr)) borrow_global<Balance>(addr).amount else 0 
    }
    
    public fun get_admin_addr(): address acquires House { 
        borrow_global<House>(@apt_casino).admin 
    }

    public fun get_treasury_addr(): address acquires House {
        borrow_global<House>(@apt_casino).treasury
    }

    // No admin signer creation in user modules
}


