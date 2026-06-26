'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, CheckCircle2, Hash, Sparkles, Calculator, ScanSearch } from 'lucide-react';

const CODE_SAMPLES = {
  solana: {
    1: `// Commit before the round resolves
const round = await createFairnessRound(wallet, 'roulette');

// Player sees commitHash before the outcome
// commit = SHA256(revealSeed | wallet | game | requestId)
console.log('Commit:', round.commitHash);`,
    2: `// Deterministic outcome from committed seed
function deriveRouletteOutcome(seedBytes) {
  return Number(seedToU64(seedBytes) % 37n);
}

const roll = deriveRouletteOutcome(round.seedBytes);`,
    3: `// Settle bet + publish reveal proof
const proof = await buildSolanaFairnessProof(
  round,
  wallet,
  'roulette',
  { winningNumber: roll },
);

await postPlayBet({ wallet, amountNative, outcome: roll, proof });`,
    4: `// Verify commit/reveal audit trail
const ok = await verifySolanaFairnessProof(proof);

// Cross-check play events on Solscan
// proofReference links to in-app verification`,
  },
  aptos: {
    1: `#[randomness]
entry fun place_bet(user: &signer, amount: u64) {
    let random = randomness::u64_range(0, 37);
    settle_bet(user, amount, random);
}`,
    2: `use aptos_framework::randomness;

let roll: u8 = (randomness::u64_range(0, 37) as u8);
// VRF bound to this transaction — verifiable on-chain`,
    3: `let (win, payout) = settle(
    amount,
    bet_kind,
    bet_value,
    roll,
);
// All game logic lives in the Move module`,
    4: `// Verify on Aptos Explorer
// Tx hash: 0x...
// • Random number used
// • Game result & payout
// • Module events emitted`,
  },
};

const CODE_FILES = {
  solana: { 1: 'fairness.ts', 2: 'fairness.ts', 3: 'settle.ts', 4: 'verify.ts' },
  aptos: { 1: 'roulette.move', 2: 'randomness.move', 3: 'roulette.move', 4: 'explorer' },
};

const WHY_IT_MATTERS = [
  'Server recomputes payouts — client amounts cannot inflate wins',
  'Commit/reveal proofs are stored with each play event',
  'Deposits and withdrawals settle on-chain to treasury wallets',
  'House edge and max multipliers are published in config',
];

const STEP_ICONS = [Hash, Sparkles, Calculator, ScanSearch];

function highlightLine(line, chain) {
  const accent = chain === 'solana' ? '#6ee7b7' : '#7dd3fc';
  const keyword = chain === 'solana' ? '#c4b5fd' : '#93c5fd';

  if (/^\s*\/\//.test(line) || /^\s*\/\//.test(line.replace(/^#/, ''))) {
    return <span className="text-white/35">{line}</span>;
  }

  const parts = [];
  let rest = line;
  let key = 0;

  const patterns = [
    { re: /\b(async|await|function|const|let|return|entry|fun|use|as|u64|u8)\b/g, color: keyword },
    { re: /\b(createFairnessRound|deriveRouletteOutcome|buildSolanaFairnessProof|verifySolanaFairnessProof|randomness|settle|place_bet)\b/g, color: accent },
    { re: /('[^']*'|"[^"]*")/g, color: '#fcd34d' },
    { re: /(\b\d+n?\b)/g, color: '#fb923c' },
  ];

  while (rest.length > 0) {
    let earliest = null;

    for (const p of patterns) {
      p.re.lastIndex = 0;
      const m = p.re.exec(rest);
      if (m && (earliest == null || m.index < earliest.index)) {
        earliest = { index: m.index, len: m[0].length, color: p.color, text: m[0] };
      }
    }

    if (!earliest) {
      parts.push(<span key={key++}>{rest}</span>);
      break;
    }

    if (earliest.index > 0) {
      parts.push(<span key={key++}>{rest.slice(0, earliest.index)}</span>);
    }
    parts.push(
      <span key={key++} style={{ color: earliest.color }}>
        {earliest.text}
      </span>,
    );
    rest = rest.slice(earliest.index + earliest.len);
  }

  return <>{parts}</>;
}

function CodeBlock({ code, chain, filename }) {
  const lines = code.split('\n');
  const chainLabel = chain === 'solana' ? 'Solana' : 'Aptos';
  const chainClass =
    chain === 'solana'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : 'border-sky-500/25 bg-sky-500/10 text-sky-300';

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080808] shadow-inner">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="truncate font-mono text-[11px] text-white/45">{filename}</span>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chainClass}`}>
          {chainLabel}
        </span>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-[12px] leading-relaxed sm:text-[13px]">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3 hover:bg-white/[0.02] -mx-1 px-1 rounded">
              <span className="select-none w-5 shrink-0 text-right text-white/20 tabular-nums">{i + 1}</span>
              <code className="min-w-0 flex-1 whitespace-pre">{highlightLine(line, chain)}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function ChainToggle({ value, onChange }) {
  const base = 'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all';

  return (
    <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange?.('solana')}
        className={`${base} ${
          value === 'solana' ? 'bg-emerald-500/25 text-emerald-300' : 'text-white/45 hover:text-white/70'
        }`}
      >
        Solana
      </button>
      <button
        type="button"
        onClick={() => onChange?.('aptos')}
        className={`${base} ${
          value === 'aptos' ? 'bg-sky-500/25 text-sky-300' : 'text-white/45 hover:text-white/70'
        }`}
      >
        Aptos
      </button>
    </div>
  );
}

const ProvablyFairSection = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [codeChain, setCodeChain] = useState('solana');

  const steps = [
    {
      id: 1,
      short: 'Request',
      title: 'Randomness request',
      description:
        'Before your bet resolves, Solana commits a hidden seed hash you can audit later. Aptos requests VRF randomness inside the Move transaction.',
    },
    {
      id: 2,
      short: 'Generate',
      title: 'Draw the outcome',
      description:
        'Solana: commit/reveal seed in the browser; the server recomputes the outcome and payout before crediting balance. Aptos: aptos_framework::randomness on future on-chain modules; live play uses server-verified settlement today.',
    },
    {
      id: 3,
      short: 'Settle',
      title: 'Calculate payout',
      description:
        'Solana publishes a commit/reveal proof with the play log. Aptos Move modules are being hardened; production Aptos play uses the same custodial house balance + server verification path as Solana.',
    },
    {
      id: 4,
      short: 'Verify',
      title: 'Check the proof',
      description:
        'Verify fairness proofs in play history. Confirm deposit and withdraw transactions on Solscan or Aptos Explorer.',
    },
  ];

  const step = steps[activeStep - 1];
  const StepIcon = STEP_ICONS[activeStep - 1];
  const codeSample = CODE_SAMPLES[codeChain][activeStep];
  const codeFile = CODE_FILES[codeChain][activeStep];

  return (
    <section className="relative px-4 py-16 md:px-8 lg:px-16">
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-red-magic/5 blur-[100px] z-0" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-magic/5 blur-[100px] z-0" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-red-magic to-blue-magic" />
          <div>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Provably Fair Gaming</h2>
            <p className="mt-1 text-sm text-white/50">Transparent outcomes on Solana & Aptos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left — explainer */}
          <div className="lg:col-span-4">
            <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-sm">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-magic/30 to-blue-magic/30 ring-1 ring-white/10">
                <Shield className="h-5 w-5 text-white" strokeWidth={1.75} />
              </div>

              <h3 className="mb-3 text-xl font-medium text-white">What is provably fair?</h3>
              <p className="mb-6 text-sm leading-relaxed text-white/65">
                Outcomes are tied to cryptography and chain data — not a hidden server RNG. You can
                verify every result yourself instead of taking our word for it.
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  <Image src="/logos/solana-sol-logo.png" alt="" width={14} height={14} className="rounded-full" />
                  Solana
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">
                  <Image src="/logos/aptos-logo.png" alt="" width={14} height={14} className="rounded-full" />
                  Aptos
                </span>
              </div>

              <ul className="space-y-3">
                {WHY_IT_MATTERS.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/90" strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — interactive walkthrough */}
          <div className="lg:col-span-8">
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-[#120010]/80 backdrop-blur-sm">
              <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                <h3 className="text-lg font-medium text-white">How it works</h3>
                <p className="mt-0.5 text-xs text-white/45">Four steps from bet to verifiable result</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,11rem)_1fr]">
                {/* Step nav */}
                <nav className="flex md:flex-col gap-1 border-b md:border-b-0 md:border-r border-white/10 p-2 sm:p-3 overflow-x-auto md:overflow-visible">
                  {steps.map((s) => {
                    const Icon = STEP_ICONS[s.id - 1];
                    const active = activeStep === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveStep(s.id)}
                        className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all md:w-full ${
                          active
                            ? 'bg-gradient-to-r from-red-magic/25 to-blue-magic/25 text-white ring-1 ring-white/15'
                            : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            active
                              ? 'bg-gradient-to-br from-red-magic to-blue-magic text-white'
                              : 'bg-white/5 text-white/50'
                          }`}
                        >
                          {active ? <Icon className="h-3.5 w-3.5" strokeWidth={2} /> : s.id}
                        </span>
                        <span className="hidden sm:block">
                          <span className="block text-[10px] uppercase tracking-wider text-white/40">
                            Step {s.id}
                          </span>
                          <span className="block text-sm font-medium">{s.short}</span>
                        </span>
                        <span className="sm:hidden text-xs font-medium">{s.short}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Step content */}
                <div className="flex flex-col p-5 sm:p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mb-5"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <StepIcon className="h-4 w-4 text-fuchsia-300/80" strokeWidth={2} />
                        <h4 className="text-base font-medium text-white sm:text-lg">{step.title}</h4>
                      </div>
                      <p className="text-sm leading-relaxed text-white/60">{step.description}</p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-display uppercase tracking-[0.14em] text-white/35">
                        Example
                      </span>
                      <ChainToggle value={codeChain} onChange={setCodeChain} />
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activeStep}-${codeChain}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CodeBlock code={codeSample} chain={codeChain} filename={codeFile} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProvablyFairSection;
