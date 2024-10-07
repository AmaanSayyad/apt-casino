//! APT Casino on Solana — house vault + per-player ledger + game audit log.
//! Mirrors Aptos `user_balance` custody and `game_logger` (not full on-chain games).

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEtYkkKVhzAXbpqGt");

pub const CONFIG_SEED: &[u8] = b"config";
pub const VAULT_SEED: &[u8] = b"vault";
pub const PLAYER_SEED: &[u8] = b"player";

pub const GAME_PLINKO: u8 = 1;
pub const GAME_MINES: u8 = 2;
pub const GAME_ROULETTE: u8 = 3;
pub const GAME_WHEEL: u8 = 4;

#[program]
pub mod apt_casino {
    use super::*;

    /// One-time setup: admin authority + empty vault PDA.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.bump = ctx.bumps.config;
        config.vault_bump = ctx.bumps.vault;
        config.total_games_logged = 0;
        config.total_deposited = 0;
        config.paused = false;
        Ok(())
    }

    /// Player sends SOL into the program vault and credits their ledger.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.config.paused, AptCasinoError::Paused);
        require!(amount > 0, AptCasinoError::InvalidAmount);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let ledger = &mut ctx.accounts.player_ledger;
        if ledger.player == Pubkey::default() {
            ledger.player = ctx.accounts.player.key();
            ledger.bump = ctx.bumps.player_ledger;
        }
        ledger.balance = ledger
            .balance
            .checked_add(amount)
            .ok_or(AptCasinoError::Overflow)?;

        let config = &mut ctx.accounts.config;
        config.total_deposited = config
            .total_deposited
            .checked_add(amount)
            .ok_or(AptCasinoError::Overflow)?;

        emit!(DepositEvent {
            player: ctx.accounts.player.key(),
            amount,
            ledger_balance: ledger.balance,
        });

        Ok(())
    }

    /// Admin withdraws SOL from vault to player after debiting ledger.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.config.paused, AptCasinoError::Paused);
        require!(amount > 0, AptCasinoError::InvalidAmount);

        let ledger = &mut ctx.accounts.player_ledger;
        require!(ledger.balance >= amount, AptCasinoError::InsufficientBalance);
        ledger.balance = ledger.balance.checked_sub(amount).ok_or(AptCasinoError::Overflow)?;

        let vault_bump = ctx.accounts.config.vault_bump;
        let seeds: &[&[u8]] = &[VAULT_SEED, &[vault_bump]];
        let signer = &[seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.player.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        emit!(WithdrawEvent {
            player: ctx.accounts.player.key(),
            amount,
            ledger_balance: ledger.balance,
        });

        Ok(())
    }

    /// Admin adjusts player ledger for server-side game debit/credit (no lamport move).
    pub fn admin_settle(ctx: Context<AdminSettle>, delta: i64) -> Result<()> {
        require!(!ctx.accounts.config.paused, AptCasinoError::Paused);

        let ledger = &mut ctx.accounts.player_ledger;
        if ledger.player == Pubkey::default() {
            ledger.player = ctx.accounts.player.key();
            ledger.bump = ctx.bumps.player_ledger;
        }

        if delta >= 0 {
            let add = u64::try_from(delta).map_err(|_| AptCasinoError::Overflow)?;
            ledger.balance = ledger
                .balance
                .checked_add(add)
                .ok_or(AptCasinoError::Overflow)?;
        } else {
            let sub = u64::try_from(-delta).map_err(|_| AptCasinoError::Overflow)?;
            require!(ledger.balance >= sub, AptCasinoError::InsufficientBalance);
            ledger.balance = ledger.balance.checked_sub(sub).ok_or(AptCasinoError::Overflow)?;
        }

        emit!(SettleEvent {
            player: ctx.accounts.player.key(),
            delta,
            ledger_balance: ledger.balance,
        });

        Ok(())
    }

    /// Treasury-signed game audit (mirrors Aptos `game_logger::log_game`).
    pub fn log_game(
        ctx: Context<LogGame>,
        game_type: u8,
        bet_lamports: u64,
        payout_lamports: u64,
        result_hash: [u8; 32],
        proof_reference: [u8; 32],
    ) -> Result<()> {
        require!(
            game_type >= GAME_PLINKO && game_type <= GAME_WHEEL,
            AptCasinoError::InvalidGameType
        );

        let config = &mut ctx.accounts.config;
        config.total_games_logged = config
            .total_games_logged
            .checked_add(1)
            .ok_or(AptCasinoError::Overflow)?;
        let game_id = config.total_games_logged;

        emit!(GamePlayedEvent {
            game_id,
            game_type,
            player: ctx.accounts.player.key(),
            bet_lamports,
            payout_lamports,
            result_hash,
            proof_reference,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.config.paused = paused;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct CasinoConfig {
    pub admin: Pubkey,
    pub bump: u8,
    pub vault_bump: u8,
    pub total_games_logged: u64,
    pub total_deposited: u64,
    pub paused: bool,
}

#[account]
#[derive(InitSpace)]
pub struct PlayerLedger {
    pub player: Pubkey,
    pub bump: u8,
    pub balance: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + CasinoConfig::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, CasinoConfig>,

    /// CHECK: PDA vault holding native SOL
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, CasinoConfig>,

    /// CHECK: vault PDA
    #[account(mut, seeds = [VAULT_SEED], bump = config.vault_bump)]
    pub vault: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerLedger::INIT_SPACE,
        seeds = [PLAYER_SEED, player.key().as_ref()],
        bump
    )]
    pub player_ledger: Account<'info, PlayerLedger>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        constraint = admin.key() == config.admin @ AptCasinoError::NotAuthorized
    )]
    pub admin: Signer<'info>,

    /// CHECK: recipient
    #[account(mut)]
    pub player: UncheckedAccount<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, CasinoConfig>,

    #[account(mut, seeds = [VAULT_SEED], bump = config.vault_bump)]
    pub vault: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [PLAYER_SEED, player.key().as_ref()],
        bump = player_ledger.bump
    )]
    pub player_ledger: Account<'info, PlayerLedger>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminSettle<'info> {
    #[account(
        constraint = admin.key() == config.admin @ AptCasinoError::NotAuthorized
    )]
    pub admin: Signer<'info>,

    /// CHECK: player wallet being settled
    pub player: UncheckedAccount<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, CasinoConfig>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + PlayerLedger::INIT_SPACE,
        seeds = [PLAYER_SEED, player.key().as_ref()],
        bump
    )]
    pub player_ledger: Account<'info, PlayerLedger>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LogGame<'info> {
    #[account(
        constraint = admin.key() == config.admin @ AptCasinoError::NotAuthorized
    )]
    pub admin: Signer<'info>,

    /// CHECK: player referenced in audit
    pub player: UncheckedAccount<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, CasinoConfig>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        constraint = admin.key() == config.admin @ AptCasinoError::NotAuthorized
    )]
    pub admin: Signer<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, CasinoConfig>,
}

#[event]
pub struct DepositEvent {
    pub player: Pubkey,
    pub amount: u64,
    pub ledger_balance: u64,
}

#[event]
pub struct WithdrawEvent {
    pub player: Pubkey,
    pub amount: u64,
    pub ledger_balance: u64,
}

#[event]
pub struct SettleEvent {
    pub player: Pubkey,
    pub delta: i64,
    pub ledger_balance: u64,
}

#[event]
pub struct GamePlayedEvent {
    pub game_id: u64,
    pub game_type: u8,
    pub player: Pubkey,
    pub bet_lamports: u64,
    pub payout_lamports: u64,
    pub result_hash: [u8; 32],
    pub proof_reference: [u8; 32],
    pub timestamp: i64,
}

#[error_code]
pub enum AptCasinoError {
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Invalid game type")]
    InvalidGameType,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient ledger balance")]
    InsufficientBalance,
    #[msg("Math overflow")]
    Overflow,
    #[msg("Program is paused")]
    Paused,
}
