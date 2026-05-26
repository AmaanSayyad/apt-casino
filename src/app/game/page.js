import HeaderText from "@/components/HeaderText";
import GameCarousel from "@/components/GameCarousel";
import MostPlayed from "@/components/MostPlayed";
import GameStats from "@/components/GameStats";

export default function Page() {
  return (
    <div className="site-game-page min-h-[100dvh] bg-gradient-to-b from-sharp-black to-[#150012] text-white md:min-h-screen">
      <div className="site-page-top site-page-pad-x container mx-auto pb-10 md:pb-16">
        
        <div className="mb-6 md:mb-10 hidden md:block">
          <GameCarousel />
        </div>

        <MostPlayed />
      </div>
    </div>
  );
}
