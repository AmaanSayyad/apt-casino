'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const GameCategoriesGrid = () => {
  const categories = [
    { 
      id: 1, 
      name: 'Roulette', 
      description: 'European, American and special roulette types', 
      icon: '/images/games/roulette-icon.png', 
      background: '/images/games/roulette-bg.jpg',
      gameCount: 8
    },
    { 
      id: 2, 
      name: 'Mines', 
      description: 'Navigate through the minefield and collect gems', 
      icon: '/images/games/mines.png', 
      background: '/images/games/mines.png',
      gameCount: 5
    },
    { 
      id: 3, 
      name: 'Spin Wheel', 
      description: 'Spin the wheel of fortune for amazing prizes', 
      icon: '/images/games/spin_the_wheel.png', 
      background: '/images/games/spin_the_wheel.png',
      gameCount: 6
    },
    { 
      id: 4, 
      name: 'Plinko', 
      description: 'Drop the ball and watch it bounce to fortune', 
      icon: '/images/games/plinko.png', 
      background: '/images/games/plinko.png',
      gameCount: 3
    },
  ];
  
  const [hoveredId, setHoveredId] = useState(null);
  
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <div className="w-1 h-6 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mr-3"></div>
          <h2 className="text-2xl font-display font-bold text-white">Game Categories</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <Link href={`/game/${category.name.toLowerCase().replace(/\s+/g, '-')}`} key={category.id}>
              <div 
                className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl h-full cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
                onMouseEnter={() => setHoveredId(category.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="bg-[#1A0015] rounded-xl h-full overflow-hidden relative">
                  {/* Placeholder for background image */}
                  <div className="absolute inset-0 bg-[#300030] opacity-40"></div>
                  
                  {/* Category content */}
                  <div className="relative p-6 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white text-xl font-display font-medium">{category.name}</h3>
                        <p className="text-white/70 text-sm mt-1">{category.description}</p>
                      </div>
                      
                      {/* Placeholder for category icon */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-magic/80 to-blue-magic/80 flex items-center justify-center">
                        <span className="text-white font-medium">{category.name.charAt(0)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <span className="text-white/60 text-sm">{category.gameCount} Games</span>
                      <span className={`text-white/90 flex items-center transform transition-all duration-300 ${
                        hoveredId === category.id ? 'translate-x-1' : ''
                      }`}>
                        Play Now 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Link href="/game">
            <div className="inline-block">
              <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-md inline-block">
                <button className="bg-[#1A0015] hover:bg-[#250020] transition-colors text-white font-display px-8 py-3 rounded-md flex items-center">
                  View All Games
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GameCategoriesGrid; 