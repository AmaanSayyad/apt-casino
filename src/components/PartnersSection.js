'use client';
import Image from 'next/image';

const PartnersSection = () => {
  const partners = [
    {
      category: 'Blockchain',
      items: [
        { id: 1, name: 'Solana', logo: '/logos/solana-sol-logo.png' },
        { id: 2, name: 'Aptos', logo: '/images/partners/aptos.svg' },
        { id: 3, name: 'Aptos Labs', logo: '/images/partners/aptos.svg' },
      ]
    },
    {
      category: 'Payment Providers',
      items: [
        { id: 5, name: 'Coinbase Pay', logo: '/images/partners/coinbase.svg' },
        { id: 6, name: 'Transak', logo: '/images/partners/transak.svg' },
        { id: 7, name: 'MoonPay', logo: '/images/partners/moonpay.svg' },
      ]
    },
    {
      category: 'Game Developers',
      items: [
        { id: 8, name: 'Pragmatic Play', logo: '/images/partners/pragmatic.svg' },
        { id: 9, name: 'Evolution Gaming', logo: '/images/partners/evolution.svg' },
        { id: 10, name: 'NetEnt', logo: '/images/partners/netent.svg' },
        { id: 11, name: 'Playtech', logo: '/images/partners/playtech.svg' },
      ]
    },
    {
      category: 'Security',
      items: [
        { id: 12, name: 'Certik', logo: '/images/partners/certik.svg' },
        { id: 13, name: 'PeckShield', logo: '/images/partners/peckshield.svg' },
        { id: 14, name: 'Hacken', logo: '/images/partners/hacken.svg' },
      ]
    }
  ];
  
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-12 justify-center">
          <div className="w-1 h-6 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mr-3"></div>
          <h2 className="text-2xl font-display font-bold text-white">Our Partners & Integrations</h2>
        </div>
        
        <div className="p-[1px] bg-gradient-to-r from-red-magic/60 to-blue-magic/60 rounded-xl">
          <div className="bg-[#1A0015] rounded-xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {partners.map((category) => (
                <div key={category.category}>
                  <h3 className="text-white font-medium mb-6 flex items-center">
                    <div className="w-1 h-4 magic-gradient rounded-full mr-2"></div>
                    {category.category}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {category.items.map((partner) => (
                      <div key={partner.id} className="bg-[#250020] rounded-lg p-4 flex flex-col items-center justify-center h-24 transition-transform hover:scale-105 hover:bg-[#300030]">
                        {/* This would be replaced with actual logos in production */}
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                          <span className="text-white font-bold">{partner.name.charAt(0)}</span>
                        </div>
                        <p className="text-white/80 text-xs text-center">{partner.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <div className="p-4 bg-gradient-to-r from-red-magic/20 to-blue-magic/20 rounded-lg inline-block">
                <h3 className="text-white font-medium mb-2">Interested in Partnering with Us?</h3>
                <p className="text-white/70 text-sm">
                  Join the APT Casino ecosystem and reach our growing player base on{' '}
                  <a
                    href="https://discord.gg/8dhBmbgMke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-white/80"
                  >
                    Discord
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection; 