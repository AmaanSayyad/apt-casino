import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_PLAY_CHAIN, resolveActiveChain } from '@/lib/chains/registry';
import {
  demoStartBalanceRaw,
  readDemoBalancesByChain,
  writeDemoBalancesByChain,
} from '@/lib/play/demoPlay';

const DEMO_LS = 'aptcasino_demo_mode';
const BAL_BACKUP_LS = 'aptcasino_balance_backup_octas';
const CHAIN_LS = 'aptcasino_active_chain';
const LEGACY_DEMO_BAL_LS = 'aptcasino_demo_balance_octas';

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
        localStorage.setItem('userBalance', state.userBalance);
        if (state.demoMode) {
          persistDemoBalance(state.activeChain, state.userBalance);
        }
      }
    },
    addToBalance(state, action) {
      const amountToAdd = parseFloat(action.payload);
      const currentBalance = parseFloat(state.userBalance);
      const newBalance = Math.max(0, currentBalance + amountToAdd).toFixed(0);
      state.userBalance = newBalance;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userBalance', newBalance);
        if (state.demoMode) persistDemoBalance(state.activeChain, newBalance);
      }
    },
    subtractFromBalance(state, action) {
      const amountToSubtract = parseFloat(action.payload);
      const currentBalance = parseFloat(state.userBalance);
      const newBalance = Math.max(0, currentBalance - amountToSubtract).toFixed(0);
      state.userBalance = newBalance;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userBalance', newBalance);
        if (state.demoMode) persistDemoBalance(state.activeChain, newBalance);
      }
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoading', action.payload.toString());
      }
    },
    setActiveChain(state, action) {
      const chain = resolveActiveChain(action.payload);
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
  setLoading,
  setDemoMode,
  setActiveChain,
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
