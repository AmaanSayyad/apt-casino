import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_PLAY_CHAIN, getPlayChainConfig, resolveActiveChain } from '@/lib/chains/registry';
import {
  demoStartBalanceRaw,
  readDemoBalancesByChain,
  writeDemoBalancesByChain,
} from '@/lib/play/demoPlay';

const DEMO_LS = 'aptcasino_demo_mode';
const BAL_BACKUP_LS = 'aptcasino_balance_backup_octas';
export const CHAIN_LS = 'aptcasino_active_chain';
export const CHAIN_USER_SELECTED_LS = 'aptcasino_chain_user_selected';
const LEGACY_DEMO_BAL_LS = 'aptcasino_demo_balance_octas';

export function isChainUserSelected() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CHAIN_USER_SELECTED_LS) === '1';
}

const loadDemoMode = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_LS) === '1';
};

function resolveDemoBalanceRaw(chain) {
  const byChain = readDemoBalancesByChain();
  if (byChain[chain] && !isNaN(parseFloat(byChain[chain]))) {
    return String(byChain[chain]);
  }
  const legacy = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_DEMO_BAL_LS) : null;
  if (legacy && !isNaN(parseFloat(legacy))) {
    return legacy;
  }
  return demoStartBalanceRaw(chain);
}

function usesServerLedger(chain) {
  return getPlayChainConfig(chain)?.balanceMode === 'server';
}

function shouldPersistUserBalance(state) {
  if (state.demoMode) return true;
  return !usesServerLedger(state.activeChain);
}

function persistDemoBalance(chain, raw) {
  const byChain = readDemoBalancesByChain();
  byChain[chain] = raw;
  writeDemoBalancesByChain(byChain);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LEGACY_DEMO_BAL_LS, raw);
    localStorage.setItem('userBalance', raw);
  }
}

const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    const savedLoading = localStorage.getItem('isLoading');
    const demoMode = loadDemoMode();
    const savedChain = localStorage.getItem(CHAIN_LS);
    const activeChain = resolveActiveChain(savedChain);

    let cleanBalance = '0';
    if (demoMode) {
      cleanBalance = resolveDemoBalanceRaw(activeChain);
    } else if (usesServerLedger(activeChain)) {
      // Server is source of truth — stale localStorage must not override fresh fetches.
      cleanBalance = '0';
    } else {
      const savedBalance = localStorage.getItem('userBalance');
      if (savedBalance && !isNaN(savedBalance) && parseFloat(savedBalance) >= 0) {
        cleanBalance = savedBalance;
      } else {
        localStorage.setItem('userBalance', '0');
      }
    }

    return {
      userBalance: cleanBalance,
      isLoading: savedLoading === 'true' || false,
      demoMode,
      activeChain,
    };
  }
  return {
    userBalance: '0',
    isLoading: false,
    demoMode: false,
    activeChain: DEFAULT_PLAY_CHAIN,
  };
};

const initialState = loadInitialState();

function applyActiveChain(state, chainId) {
  const chain = resolveActiveChain(chainId);
  const prev = state.activeChain;
  if (chain === prev) return;

  if (state.demoMode && typeof window !== 'undefined') {
    persistDemoBalance(prev, state.userBalance);
    state.userBalance = resolveDemoBalanceRaw(chain);
    localStorage.setItem('userBalance', state.userBalance);
  }

  state.activeChain = chain;
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHAIN_LS, chain);
  }
}

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    setBalance(state, action) {
      const newBalance = action.payload;
      if (parseFloat(newBalance) < 0) {
        state.userBalance = '0';
        console.warn('Attempted to set negative balance, setting to 0 instead');
      } else {
        state.userBalance = newBalance;
      }
      if (typeof window !== 'undefined') {
        if (shouldPersistUserBalance(state)) {
          localStorage.setItem('userBalance', state.userBalance);
        }
        if (state.demoMode) {
          persistDemoBalance(state.activeChain, state.userBalance);
        }
      }
    },
    addToBalance(state, action) {
      const amountToAdd = BigInt(String(action.payload || '0'));
      const currentBalance = BigInt(String(state.userBalance || '0'));
      const newBalanceStr = (currentBalance + amountToAdd).toString();
      state.userBalance = newBalanceStr;
      if (typeof window !== 'undefined') {
        if (shouldPersistUserBalance(state)) {
          localStorage.setItem('userBalance', newBalanceStr);
        }
        if (state.demoMode) persistDemoBalance(state.activeChain, newBalanceStr);
      }
    },
    subtractFromBalance(state, action) {
      const amountToSubtract = BigInt(String(action.payload || '0'));
      const currentBalance = BigInt(String(state.userBalance || '0'));
      const newBalance = currentBalance > amountToSubtract ? currentBalance - amountToSubtract : 0n;
      const newBalanceStr = newBalance.toString();
      state.userBalance = newBalanceStr;
      if (typeof window !== 'undefined') {
        if (shouldPersistUserBalance(state)) {
          localStorage.setItem('userBalance', newBalanceStr);
        }
        if (state.demoMode) persistDemoBalance(state.activeChain, newBalanceStr);
      }
    },
    /** Atomic bet settlement: balance -= betRaw + payoutRaw (raw chain units). */
    applyPlaySettlement(state, action) {
      const betRaw = BigInt(String(action.payload?.betRaw ?? '0'));
      const payoutRaw = BigInt(String(action.payload?.payoutRaw ?? '0'));
      const current = BigInt(String(state.userBalance || '0'));
      const next = current - betRaw + payoutRaw;
      const newBalanceStr = (next < 0n ? 0n : next).toString();
      state.userBalance = newBalanceStr;
      if (typeof window !== 'undefined') {
        if (shouldPersistUserBalance(state)) {
          localStorage.setItem('userBalance', newBalanceStr);
        }
        if (state.demoMode) persistDemoBalance(state.activeChain, newBalanceStr);
      }
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoading', action.payload.toString());
      }
    },
    setActiveChain(state, action) {
      applyActiveChain(state, action.payload);
    },
    setUserActiveChain(state, action) {
      applyActiveChain(state, action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHAIN_USER_SELECTED_LS, '1');
      }
    },
    setDemoMode(state, action) {
      const on = !!action.payload;
      if (typeof window === 'undefined') return;

      if (on && !state.demoMode) {
        localStorage.setItem(BAL_BACKUP_LS, state.userBalance);
        const start = demoStartBalanceRaw(state.activeChain);
        state.userBalance = start;
        persistDemoBalance(state.activeChain, start);
      } else if (!on && state.demoMode) {
        const restored = localStorage.getItem(BAL_BACKUP_LS) || '0';
        state.userBalance = restored;
        localStorage.setItem('userBalance', restored);
      }

      state.demoMode = on;
      localStorage.setItem(DEMO_LS, on ? '1' : '0');
    },
    refillDemoBalance(state) {
      if (!state.demoMode || typeof window === 'undefined') return;
      const start = demoStartBalanceRaw(state.activeChain);
      state.userBalance = start;
      persistDemoBalance(state.activeChain, start);
    },
  },
});

export const {
  setBalance,
  addToBalance,
  subtractFromBalance,
  applyPlaySettlement,
  setLoading,
  setDemoMode,
  setActiveChain,
  setUserActiveChain,
  refillDemoBalance,
} = balanceSlice.actions;

export const loadBalanceFromStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userBalance') || '0';
  }
  return '0';
};

export const saveBalanceToStorage = (balance) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userBalance', balance);
  }
};

export default balanceSlice.reducer;
