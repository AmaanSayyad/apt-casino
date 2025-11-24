"use client";

const WheelVideo = () => {
  return (
    <div className="relative isolate w-full">
      {/* Glow behind the player — sibling layer, not negative z-index inside the player */}
      <div
        className="pointer-events-none absolute -inset-1 z-0 rounded-2xl opacity-60 blur-lg"
        style={{
          background:
            'linear-gradient(45deg, #d82633, #681DDB, #14D854, #d82633)',
          backgroundSize: '400% 400%',
        }}
        aria-hidden
      />

      <div className="relative z-[1] w-full overflow-hidden rounded-2xl border-2 border-[#d82633]/40 bg-[#0A0009] shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        <div className="relative w-full pt-[56.25%]">
          <iframe
            className="absolute inset-0 h-full w-full rounded-xl border-0"
            src="https://www.youtube.com/embed/pBkqjnaWIeY?si=SXdkvmdSdjILinKH"
            title="Fortune Wheel Gameplay"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default WheelVideo;
