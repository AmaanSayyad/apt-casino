export const gameData = {
  title: "European Roulette",
  label: "CLASSIC CASINO GAME",
  image: "/images/games/roulette.png",
  youtube: "6nKBlWaRI8w", // European Roulette Tutorial Video ID
  paragraphs: [
    "Step into the world of European Roulette, where fortune favors the bold and every spin could change your fate. Our provably fair, blockchain-powered roulette game combines classic casino elegance with cutting-edge cryptocurrency technology.",
    
    "With a single zero and a house edge of just 2.70%, our European Roulette offers better odds than traditional casinos and American Roulette variants. The wheel features 37 pockets (numbers 0-36), creating the perfect balance of risk and reward for both beginners and seasoned players.",
    
    "Place your bets on individual numbers, colors, odds/evens, or dozens and watch as the wheel spins, the ball dances, and destiny unfolds. Will you play it safe with outside bets or chase the thrill of a 35:1 payout on a straight-up number?",
    
    "All bets are secured on the blockchain, ensuring complete transparency and fairness on every spin. Join thousands of players who've already experienced the exhilaration of crypto roulette - your winning streak begins now!"
  ],
};

export const bettingTableData = {
  title: "Betting Options",
  description: "Explore our comprehensive betting options and maximize your winning potential:",
  options: [
    {
      category: "Inside Bets",
      bets: [
        { name: "Straight Up", description: "Bet on a single number", payout: "35:1" },
        { name: "Split", description: "Bet on two adjacent numbers", payout: "17:1" },
        { name: "Street", description: "Bet on three numbers in a row", payout: "11:1" },
        { name: "Corner", description: "Bet on four numbers in a square", payout: "8:1" },
        { name: "Six Line", description: "Bet on six numbers in two rows", payout: "5:1" }
      ]
    },
    {
      category: "Outside Bets",
      bets: [
        { name: "Red/Black", description: "Bet on all red or black numbers", payout: "1:1" },
        { name: "Even/Odd", description: "Bet on all even or odd numbers", payout: "1:1" },
        { name: "High/Low", description: "Bet on 1-18 or 19-36", payout: "1:1" },
        { name: "Dozen", description: "Bet on 1-12, 13-24, or 25-36", payout: "2:1" },
        { name: "Column", description: "Bet on a vertical column of numbers", payout: "2:1" }
      ]
    }
  ]
}; 