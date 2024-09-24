module apt_casino::game_logger {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_GAME_TYPE: u64 = 2;

    // Game types
    const GAME_PLINKO: u8 = 1;
    const GAME_MINES: u8 = 2;
    const GAME_ROULETTE: u8 = 3;
    const GAME_WHEEL: u8 = 4;

    struct GameLog has key {
        games: vector<GameEntry>,
    }

    struct GameEntry has store, drop, copy {
        game_id: u64,
        game_type: u8,
        player_address: String,
        bet_amount: u64,
        result: String,
        payout: u64,
        timestamp: u64,
        random_seed: u64,
    }

    #[event]
    struct GamePlayedEvent has drop, store {
        game_id: u64,
        game_type: u8,
        player_address: String,
        bet_amount: u64,
        result: String,
        payout: u64,
        timestamp: u64,
    }

    // Initialize the game logger
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<GameLog>(account_addr), E_NOT_AUTHORIZED);
        
        move_to(account, GameLog {
            games: vector::empty<GameEntry>(),
        });
    }

    // Log a game result (only callable by treasury)
    public entry fun log_game(
        treasury: &signer,
        game_type: u8,
        player_address: String,
        bet_amount: u64,
        result: String,
        payout: u64,
    ) acquires GameLog {
        let treasury_addr = signer::address_of(treasury);
        assert!(exists<GameLog>(treasury_addr), E_NOT_AUTHORIZED);
        
        let game_log = borrow_global_mut<GameLog>(treasury_addr);
        let game_id = vector::length(&game_log.games) + 1;
        
        // Generate pseudo-random seed using timestamp and game_id
        let random_seed = timestamp::now_microseconds() + (game_id * 1000000);
        
        let game_entry = GameEntry {
            game_id,
            game_type,
            player_address,
            bet_amount,
            result,
            payout,
            timestamp: timestamp::now_seconds(),
            random_seed,
        };
        
        vector::push_back(&mut game_log.games, game_entry);
        
        // Emit event
        event::emit(GamePlayedEvent {
            game_id,
            game_type,
            player_address,
            bet_amount,
            result,
            payout,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Get game history
    #[view]
    public fun get_game_history(treasury_addr: address): vector<GameEntry> acquires GameLog {
        if (!exists<GameLog>(treasury_addr)) {
            return vector::empty<GameEntry>()
        };
        
        let game_log = borrow_global<GameLog>(treasury_addr);
        game_log.games
    }

    // Get specific game
    #[view]
    public fun get_game(treasury_addr: address, game_id: u64): GameEntry acquires GameLog {
        let game_log = borrow_global<GameLog>(treasury_addr);
        *vector::borrow(&game_log.games, game_id - 1)
    }

    // Helper functions for game types
    public fun game_type_plinko(): u8 { GAME_PLINKO }
    public fun game_type_mines(): u8 { GAME_MINES }
    public fun game_type_roulette(): u8 { GAME_ROULETTE }
    public fun game_type_wheel(): u8 { GAME_WHEEL }
}