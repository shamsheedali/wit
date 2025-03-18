"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Chessboard } from "react-chessboard";
import * as engine from "@/components/chess/engine";
import type { AvailableBots, InitialisedBot } from "@/components/chess/bots";
import styles from "./styles.module.scss";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useAuthStore } from "@/stores";

type SelectedBot = {
  name: string;
  move: InitialisedBot;
} | null;

type BoardMove = {
  sourceSquare: engine.Square;
  targetSquare: engine.Square;
};

const BotSelector: React.FC<{
  playerName: string;
  availableBots: AvailableBots;
  selectedBot: SelectedBot;
  setSelectedBot: (bot: SelectedBot) => void;
  disabled: boolean;
}> = ({ playerName, availableBots, selectedBot, setSelectedBot, disabled }) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const name = e.target.value;
    setSelectedBot(name ? { name, move: availableBots[name]() } : null);
  };

  return (
    <div className={styles.BotSelector}>
      <label>{playerName}</label>
      <select
        value={selectedBot?.name || ""}
        onChange={handleChange}
        disabled={disabled}
        className="text-black"
      >
        <option value="">User</option>
        {Object.keys(availableBots).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

const PlayWithBot: React.FC<{
  bots: AvailableBots;
  onGameCompleted: (winner: engine.GameWinner) => void;
}> = ({ bots, onGameCompleted }) => {
  const { user } = useAuthStore();

  const [isPlaying, setPlaying] = useState(false);
  const [fen, setFen] = useState<engine.Fen>(engine.newGame);
  const [history, setHistory] = useState<Array<engine.Move>>([]);
  const [whiteBot, setWhiteBot] = useState<SelectedBot>(null);
  const [blackBot, setBlackBot] = useState<SelectedBot>(null);

  const newGame = useCallback(() => {
    setPlaying(false);
    setFen(engine.newGame);
    setHistory([]);
  }, []);

  const doMove = useCallback(
    (fen: engine.Fen, from: engine.Square, to: engine.Square) => {
      const move = engine.move(fen, from, to);
      if (!move) return false; // Return false if move is invalid

      const [newFen, action] = move;

      // Add debug logging
      console.log("Move made:", from, "to", to);
      console.log("New FEN:", newFen);
      console.log("Game over check:", engine.isGameOver(newFen));

      if (engine.isGameOver(newFen)) {
        // Add a slight delay before showing game over to ensure UI updates
        setTimeout(() => {
          onGameCompleted(engine.getGameWinner(newFen));
          newGame();
        }, 500);

        // Still update the UI with the final position
        setFen(newFen);
        setHistory((prev) => [...prev, action]);
        return true;
      }

      setFen(newFen);
      setHistory((prev) => [...prev, action]);
      return true;
    },
    [onGameCompleted, newGame]
  );

  useEffect(() => {
    if (!isPlaying) return;

    let isBotMovePlayable = true;

    const playBotMove = async (bot: SelectedBot) => {
      if (bot) {
        try {
          // Add a small delay to prevent too-rapid moves
          await new Promise((resolve) => setTimeout(resolve, 300));

          const { from, to } = await bot.move(fen);
          console.log(`Bot ${bot.name} wants to move from ${from} to ${to}`);

          if (isBotMovePlayable) {
            const moveSucceeded = doMove(fen, from, to);
            if (!moveSucceeded) {
              console.error(
                `Bot ${bot.name} attempted invalid move: ${from} to ${to}`
              );
            }
          }
        } catch (error) {
          console.error("Error making bot move:", error);
        }
      }
    };

    // Ensure we're only triggering bot moves when appropriate
    const isBotTurn =
      (whiteBot && engine.isWhiteTurn(fen)) ||
      (blackBot && engine.isBlackTurn(fen));

    if (isBotTurn) {
      // Use requestAnimationFrame to ensure UI has updated
      requestAnimationFrame(() => {
        if (whiteBot && engine.isWhiteTurn(fen)) playBotMove(whiteBot);
        if (blackBot && engine.isBlackTurn(fen)) playBotMove(blackBot);
      });
    }

    return () => {
      isBotMovePlayable = false;
    };
  }, [isPlaying, fen, whiteBot, blackBot, doMove]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="flex gap-4">
        <BotSelector
          playerName="White"
          availableBots={bots}
          selectedBot={whiteBot}
          setSelectedBot={setWhiteBot}
          disabled={isPlaying}
        />
        <BotSelector
          playerName="Black"
          availableBots={bots}
          selectedBot={blackBot}
          setSelectedBot={setBlackBot}
          disabled={isPlaying}
        />
        <Button onClick={() => setPlaying(!isPlaying)}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button onClick={newGame}>Reset</Button>
      </div>
      <div>
        <Chessboard
          position={fen}
          onPieceDrop={(from, to) => doMove(fen, from, to)}
          customNotationStyle={{color: 'black', fontWeight: 'bold'}}
          boardWidth={400}
        />
      </div>
    </div>
  );
};

export default PlayWithBot;
