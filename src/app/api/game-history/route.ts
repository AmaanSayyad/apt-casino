import { NextRequest, NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(config);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const treasuryAddress = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS!;

    if (gameId) {
      // Get specific game
      const gameData = await aptos.view({
        payload: {
          function: `${treasuryAddress}::game_logger::get_game`,
          functionArguments: [treasuryAddress, gameId],
        },
      });

      return NextResponse.json({
        success: true,
        game: gameData[0],
      });
    } else {
      // Get game history
      const historyData = await aptos.view({
        payload: {
          function: `${treasuryAddress}::game_logger::get_game_history`,
          functionArguments: [treasuryAddress],
        },
      });

      const games = (historyData[0] as any[]) || [];
      const limitedGames = games.slice(-limit).reverse(); // Get latest games

      return NextResponse.json({
        success: true,
        games: limitedGames,
        total: games.length,
      });
    }

  } catch (error) {
    console.error('Error fetching game history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game history' },
      { status: 500 }
    );
  }
}