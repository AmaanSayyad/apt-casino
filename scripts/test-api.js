const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 TESTING BACKEND API');
    console.log('');

    // Test logging a game via API
    console.log('📝 Testing /api/log-game...');
    
    const logResponse = await fetch('http://localhost:3000/api/log-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'plinko',
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        betAmount: 50,
        result: '16rows_High_bin2_110x',
        payout: 5500,
      }),
    });

    const logData = await logResponse.json();
    
    if (logData.success) {
      console.log('✅ Game logged via API!');
      console.log('├── Transaction Hash:', logData.transactionHash);
      console.log('└── Explorer URL:', logData.explorerUrl);
    } else {
      console.log('❌ API log failed:', logData.error);
    }

    console.log('');

    // Test getting game history via API
    console.log('📖 Testing /api/game-history...');
    
    const historyResponse = await fetch('http://localhost:3000/api/game-history?limit=5');
    const historyData = await historyResponse.json();
    
    if (historyData.success) {
      console.log('✅ Game history retrieved via API!');
      console.log('├── Total games:', historyData.total);
      console.log('├── Returned games:', historyData.games.length);
      
      if (historyData.games.length > 0) {
        const lastGame = historyData.games[0];
        console.log('├── Latest game ID:', lastGame.game_id);
        console.log('├── Game type:', lastGame.game_type);
        console.log('├── Player:', lastGame.player_address);
        console.log('├── Bet amount:', lastGame.bet_amount);
        console.log('├── Result:', lastGame.result);
        console.log('├── Payout:', lastGame.payout);
        console.log('└── Random seed:', lastGame.random_seed);
      }
    } else {
      console.log('❌ API history failed:', historyData.error);
    }

    console.log('');
    console.log('🎉 API TESTS COMPLETED!');

  } catch (error) {
    console.error('❌ API TEST FAILED:', error.message);
  }
}

testAPI();