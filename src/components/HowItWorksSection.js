'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GradientBorderButton from './GradientBorderButton';
import PlayWalletButton from './PlayWalletButton';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { CHAINS_SHORT, FUND_PLAY_COPY } from '@/lib/copy/siteChains';
import { getAptcTradeLinks } from '@/lib/config/tokenomics';

const DEXSCREENER_HREF =
  getAptcTradeLinks().find((l) => l.id === 'dexscreener')?.href ?? 'https://dexscreener.com/solana';
const EARN_REWARDS_HREF = 'https://x.com/AptCasinofun/status/2064351575708209531?s=20';

const AUTO_ROTATE_MS = 7000;
const PAUSE_AFTER_MANUAL_MS = 15000;

const HowItWorksSection = () => {
  const play = usePlayWallet();
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [animating, setAnimating] = useState(false);
  const resumeAutoAt = useRef(0);

  // Auto-rotate (pauses briefly after the user picks a step so clicks feel responsive)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() < resumeAutoAt.current) return;
      setAnimating(true);
      setTimeout(() => {
        setActiveStep((current) => (current < 4 ? current + 1 : 1));
        setTimeout(() => setAnimating(false), 300);
      }, 300);
    }, AUTO_ROTATE_MS);

    return () => clearInterval(interval);
  }, []);
  
  const steps = [
    {
      id: 1,
      title: 'Connect Your Wallet',
      description: `Connect Phantom, Petra, or keyless login on ${CHAINS_SHORT}. Switch chains anytime from the navbar.`,
      emoji: '👛'
    },
    {
      id: 2,
      title: 'Get APTC Tokens',
      description: FUND_PLAY_COPY,
      emoji: '💰'
    },
    {
      id: 3,
      title: 'Start Playing',
      description: 'Dive into our expanding library of provably fair games including Roulette, Plinko, Mines and Spin Wheel. Every game provides real-time stats and detailed history.',
      emoji: '🎮'
    },
    {
      id: 4,
      title: 'Earn Rewards',
      description:
        'Earn APTC through referrals, staking, and platform rewards. Track balances and activity on your Profile.',
      emoji: '🏆'
    },
  ];
  
  const handleStepChange = (stepId) => {
    if (stepId === activeStep) return;
    resumeAutoAt.current = Date.now() + PAUSE_AFTER_MANUAL_MS;
    setAnimating(true);
    setTimeout(() => {
      setActiveStep(stepId);
      setTimeout(() => setAnimating(false), 300);
    }, 300);
  };
  
  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-blue-magic/5 blur-[120px] z-0"></div>
      <div className="absolute top-20 -left-40 w-80 h-80 rounded-full bg-red-magic/5 blur-[120px] z-0"></div>
      
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-1 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mb-5"></div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">How APT Casino Works</h2>
          <p className="text-white/70 max-w-2xl text-lg">Experience the future of decentralized gaming in four seamless steps</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Steps Navigation */}
          <div className="p-[1px] bg-gradient-to-r from-red-magic via-purple-500 to-blue-magic rounded-xl shadow-xl">
            <div className="relative z-10 bg-[#1A0015]/70 backdrop-blur-sm rounded-xl p-5">
              {steps.map((step) => (
                <button
                  type="button"
                  key={step.id}
                  className={`mb-4 w-full rounded-lg p-4 text-left transition-all duration-300 transform ${
                    activeStep === step.id 
                      ? 'bg-gradient-to-r from-[#250020] to-[#1A0015] border-l-2 border-red-magic scale-[1.02]' 
                      : 'hover:bg-[#250020]/50 hover:scale-[1.01]'
                  } ${step.id < activeStep ? 'opacity-90' : 'opacity-100'}`}
                  onClick={() => handleStepChange(step.id)}
                >
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shadow-lg transform transition-all duration-300 ${
                      activeStep === step.id 
                        ? 'bg-gradient-to-r from-red-magic to-blue-magic scale-110' 
                        : 'bg-[#250020]'
                    }`}>
                      <span className="text-white text-lg">{step.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium text-lg transition-all duration-300 ${activeStep === step.id ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic' : 'text-white'}`}>
                        {step.title}
                      </h3>
                      <p className={`mt-2 text-sm leading-relaxed ${activeStep === step.id ? 'text-white/90' : 'text-white/60'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              
              {mounted && play.connected && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <PlayWalletButton />
                </div>
              )}

              <div className="mt-6 flex justify-center lg:justify-start">
                {activeStep === 1 && (!mounted || !play.connected) ? (
                  <div className="relative z-10">
                    <PlayWalletButton variant="cta" label="Connect Wallet" />
                  </div>
                ) : activeStep === 2 ? (
                  <a
                    href={DEXSCREENER_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <GradientBorderButton className="transform transition-transform hover:scale-105">
                      Get APTC Tokens
                    </GradientBorderButton>
                  </a>
                ) : activeStep === 3 ? (
                  <Link href="/game" className="inline-block">
                    <GradientBorderButton className="transform transition-transform hover:scale-105">
                      Browse Games
                    </GradientBorderButton>
                  </Link>
                ) : (
                  <a
                    href={EARN_REWARDS_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <GradientBorderButton className="transform transition-transform hover:scale-105">
                      View Rewards
                    </GradientBorderButton>
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Illustration Area */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="relative w-full max-w-xl h-[400px]">
              {/* Progress indicator */}
              <div className="absolute -top-10 left-1/2 z-30 flex -translate-x-1/2 transform space-x-2">
                {steps.map((step) => (
                  <button
                    type="button"
                    key={step.id}
                    className={`h-2 w-6 rounded-full transition-all duration-300 ${
                      activeStep === step.id 
                        ? 'w-10 bg-gradient-to-r from-red-magic to-blue-magic' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    onClick={() => handleStepChange(step.id)}
                    aria-label={`Go to step ${step.id}`}
                  />
                ))}
              </div>
              
              {/* Animated background elements (no pointer hit-testing) */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                <div className="h-72 w-72 animate-pulse rounded-full bg-gradient-to-r from-red-magic/10 to-blue-magic/10" />
                <div className="absolute h-80 w-80 animate-spin-slow rounded-full border border-white/5" />
              </div>
              
              {/* Main illustration card */}
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="p-[1px] bg-gradient-to-r from-red-magic via-purple-500 to-blue-magic rounded-2xl shadow-2xl">
                  <div className="relative flex h-[380px] w-[380px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#1A0015]/70 p-10 backdrop-blur-sm transition-transform duration-500 hover:scale-105">
                    {/* Animated glow effect */}
                    <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-red-magic to-blue-magic opacity-75 blur-2xl transition duration-1000" aria-hidden />
                    
                    {/* Step indicator - moved to top right corner */}
                    <div className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-gradient-to-r from-red-magic to-blue-magic text-base font-bold text-white shadow-lg">
                      {activeStep}/4
                    </div>
                    
                    <div className={`relative z-10 flex flex-col items-center px-4 text-center transition-all duration-500 transform ${animating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
                      <div className="w-28 h-28 rounded-full bg-gradient-to-r from-red-magic to-blue-magic p-1 flex items-center justify-center mb-8 shadow-lg transform hover:rotate-6 transition-transform relative">
                        <div className="absolute inset-0 rounded-full bg-[#250020] opacity-40"></div>
                        <div className="relative z-10 transform hover:scale-110 transition-transform">
                          <span className="text-6xl">{steps[activeStep-1].emoji}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-white text-2xl font-semibold mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        {steps[activeStep-1].title}
                      </h3>
                      <p className="text-white/80 leading-relaxed text-base max-w-xs">
                        {steps[activeStep-1].description}
                      </p>
                    </div>
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

export default HowItWorksSection; 