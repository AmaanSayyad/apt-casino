"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import PlayChainIcon from "@/components/play/PlayChainIcon";
import { usePlayCurrency } from "@/hooks/usePlayCurrency";

const GameHistory = ({ gameHistory }) => {
  const { chain } = usePlayCurrency();
  const [activeTab, setActiveTab] = useState("my-bet");
  const [entriesShown, setEntriesShown] = useState(10);
  
  return (
    <div className="bg-[#070005] w-full rounded-xl overflow-hidden mt-0">
      <div className="flex flex-row justify-between items-center">

        <div className="flex mb-4 w-[70%] md:w-[30%] bg-[#120521] border border-[#333947] rounded-3xl p-2 gap-2 overflow-hidden">
          <div className={cn("w-1/2", activeTab === "my-bet" && "gradient-borderb")}>
            <button
              className={cn(
                "flex-1 py-0 md:py-3 px-4 w-full h-full text-center rounded-2xl transition-colors",
                activeTab === "my-bet" ? "bg-[#290023] text-white" : "text-[#333947]"
              )}
              onClick={() => setActiveTab("my-bet")}
            >
              My Bet
            </button>
          </div>
          <div className={cn("w-1/2", activeTab === "game-description" && "gradient-borderb")}>
            <button
              className={cn(
                "flex-1 py-0 md:py-3 px-4 w-full h-full text-center rounded-2xl transition-colors",
                activeTab === "game-description" ? "bg-[#290023] text-white" : "text-[#333947]"
              )}
              onClick={() => setActiveTab("game-description")}
            >
              Game Description
            </button>
          </div>
        </div>

        <div className="flex gradient-border mb-5 md:mb-0">
          <div className="flex space-x-4">
            <select 
              className="bg-[#120521] text-white text-md p-3 px-2 md:px-6 rounded border border-purple-900/30"
              value={entriesShown}
              onChange={(e) => setEntriesShown(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

      </div>

      
      {activeTab === "my-bet" && (
        <div className="overflow-x-auto">
          <table className="w-full mt-4 text-md">
            <thead className=" text-left">
              <tr>
                <th className="py-6 px-4 font-medium">Game</th>
                <th className="py-6 px-4 font-medium">Time</th>
                <th className="py-6 px-4 font-medium">Bet amount</th>
                <th className="py-6 px-4 font-medium">Multiplier</th>
                <th className="py-6 px-4 font-medium">Payout</th>
                <th className="py-6 px-4 font-medium">TX</th>
              </tr>
            </thead>
            <tbody>
              {gameHistory.length > 0 ? (
                gameHistory.slice(0, entriesShown).map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-[#290023]" : ""}
                  >
                    <td className="py-6 px-4">{item.game}</td>
                    <td className="py-6 px-4">{item.time}</td>
                    <td className="py-6 px-4">
                      <span className="flex items-center">
                        {item.betAmount.toFixed(10)}
                        <PlayChainIcon chain={chain} size={20} className="ml-1" />  
                      </span>
                    </td>
                    <td className="py-6 px-4">{item.multiplier}</td>
                    <td className="py-6 px-4">
                      <span className="flex items-center">
                        {item.payout.toFixed(10)}
                        <PlayChainIcon chain={chain} size={20} className="ml-1" />  
                      </span>
                    </td>
                    <td className="py-6 px-4">
                      {item.txHash ? (
                        <a 
                          href={`https://explorer.aptoslabs.com/txn/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline text-sm font-mono"
                        >
                          {item.txHash.slice(0, 8)}...
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No game history yet. Place your first bet!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === "game-description" && (
        <div className="p-4 text-sm text-gray-300">
          <h3 className="font-medium mb-2">Crazy Times</h3>
          <p>
            Crazy Times is an exciting game of chance where you place bets on a spinning wheel. 
            Select your bet amount, risk level, and the number of segments on the wheel.
            The wheel will spin and land on a multiplier, which determines your payout.
            Higher risk levels can lead to higher multipliers but may be less likely to hit.
          </p>
          <h4 className="font-medium mt-4 mb-2">How to play:</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Enter your bet amount</li>
            <li>Select your risk level (Low, Medium, High)</li>
            <li>Choose the number of segments for the wheel</li>
            <li>Click the &quot;Bet&quot; button to spin the wheel</li>
            <li>If the wheel lands on a multiplier, your bet amount will be multiplied accordingly</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default GameHistory;