'use client';
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function FeatureSection() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  const features = [
    {
      id: 1,
      title: "100% Transparent & Provably Fair",
      description: "Games use verifiable on-chain randomness on Solana and Aptos, ensuring complete transparency and fairness in every outcome.",
      icon: "🎲"
    },
    {
      id: 2,
      title: "Cross-Chain Liquidity",
      description: "Stake tokens across multiple chains to earn APTC tokens while playing your favorite games with minimal slippage.",
      icon: "⛓️"
    },
    {
      id: 3,
      title: "No Restrictions",
      description: "Enjoy flexible withdrawals, transparent bonus schemes, and full control over your assets through decentralized management.",
      icon: "🔓"
    }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute -top-40 left-20 w-80 h-80 rounded-full bg-red-magic/5 blur-[120px] z-0"></div>
      <div className="absolute bottom-0 right-10 w-80 h-80 rounded-full bg-blue-magic/5 blur-[120px] z-0"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center mb-12 justify-center">
          <div className="w-1 h-6 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mr-3"></div>
          <h2 className="text-2xl font-display font-bold text-white">Key Features of APT-Casino</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          {/* Casino Image */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-md h-[350px] rounded-xl overflow-hidden bg-gradient-to-br from-purple-800 to-blue-900">
              {!imageError ? (
                <Image
                  src="/images/casino-players.png"
                  alt="Two casino players enjoying a game of poker"
                  fill
                  className="object-cover rounded-xl"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="text-5xl mb-4">🎰</div>
                    <h3 className="text-xl font-medium text-white mb-2">APT Casino</h3>
                    <p className="text-white/70">Experience the future of decentralized gaming</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison section */}
          <div className="lg:col-span-7 p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl">
            <div className="bg-[#1A0015] rounded-xl p-6 md:p-8">
              <h3 className="text-white/70 text-sm uppercase tracking-wider mb-3">Traditional vs APT-Casino</h3>
              <h4 className="text-white text-2xl font-display font-medium mb-6">A New Era of Fair Gaming</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#250020] rounded-lg p-4 border-l-2 border-red-400/50">
                  <h5 className="text-red-magic font-medium mb-2">Traditional Casinos</h5>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Hidden RNG algorithms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Restrictive withdrawal policies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Unclear bonus terms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>Centralized control of funds</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#250020] rounded-lg p-4 border-l-2 border-blue-400/50">
                  <h5 className="text-blue-magic font-medium mb-2">APT-Casino</h5>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Verifiable on-chain randomness</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Stake and earn while playing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Transparent bonus system</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Self-custody of assets</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <p className="text-white/80 text-sm">
                APT-Casino runs on Solana and Aptos to provide a transparent, provably fair gaming
                experience with DeFi integration, allowing players to earn passive income through APTC staking.
              </p>
            </div>
          </div>
        </div>
        
        {/* Feature cards with improved design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0.6, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-[1px] bg-gradient-to-r from-red-magic/80 to-blue-magic/80 rounded-xl cursor-pointer hover:from-red-magic hover:to-blue-magic transition-all"
              onClick={() => setActiveFeature(index)}
            >
              <div className={`bg-[#1A0015] rounded-xl p-6 h-full flex flex-col ${
                activeFeature === index ? 'border-l-2 border-red-magic' : ''
              }`}>
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-magic/30 to-blue-magic/30 flex items-center justify-center text-2xl">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-white font-medium text-lg mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
                
                <div className="mt-auto pt-4">
                  <div className="h-1 w-12 magic-gradient rounded-full"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
