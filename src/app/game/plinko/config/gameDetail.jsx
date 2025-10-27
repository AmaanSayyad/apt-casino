export const gameData = {
  title: "Plinko",
  label: "INSTANT WIN GAME",
  image: "/images/games/plinko.png",
  youtube: "AbaVLveTcrM", // Plinko Game Tutorial Video ID
  paragraphs: [
    "Experience the thrill of Plinko, a classic game of chance where strategy meets luck. Drop your ball from the top and watch it bounce through a maze of pegs, creating an exciting journey to potential big wins.",
    
    "Our Plinko game features configurable risk levels and row counts from 8 to 16, allowing you to customize your gaming experience. Higher risk levels offer greater potential rewards, while more rows create more complex and engaging gameplay.",
    
    "The game uses provably fair technology powered by blockchain, ensuring complete transparency in every drop. Watch as the ball bounces unpredictably through the pegs, building anticipation until it finally lands in a multiplier slot.",
    
    "With multiple betting options and risk levels, Plinko offers something for every type of player. Whether you prefer conservative play or high-risk, high-reward excitement, you can adjust your strategy to match your comfort level."
  ],
};

export const bettingTableData = {
  title: "Betting Options",
  description: "Explore our comprehensive betting options and maximize your winning potential:",
  options: [
    {
      category: "Risk Levels",
      bets: [
        { name: "Low Risk", description: "Conservative betting with steady returns", payout: "0.2x - 5x" },
        { name: "Medium Risk", description: "Balanced risk and reward", payout: "0.1x - 10x" },
        { name: "High Risk", description: "High risk for maximum rewards", payout: "0.05x - 100x" }
      ]
    },
    {
      category: "Row Configurations",
      bets: [
        { name: "8 Rows", description: "Simpler gameplay, fewer interactions", payout: "Standard" },
        { name: "12 Rows", description: "Balanced complexity and engagement", payout: "Enhanced" },
        { name: "16 Rows", description: "Maximum complexity and excitement", payout: "Premium" }
      ]
    }
  ]
};
