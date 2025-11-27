import HeaderText from "@/components/HeaderText";
import GameCarousel from "@/components/GameCarousel";
import MostPlayed from "@/components/MostPlayed";
import GameStats from "@/components/GameStats";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sharp-black to-[#150012] text-white">
      <div className="site-page-top container mx-auto px-3 sm:px-4 lg:px-8 pb-10 md:pb-16">
        
        <div className="mb-6 md:mb-10 hidden md:block">
          <GameCarousel />
        </div>

        <MostPlayed />
      </div>
    </div>
  );
}
