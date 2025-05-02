"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useRef } from "react";
import { Chessboard } from "react-chessboard";
import * as engine from "@/components/chess/engine";
import type { AvailableBots, InitialisedBot } from "@/components/chess/bots";
import styles from "./styles.module.scss";
import { Button } from "../ui/button";
import { useAuthStore } from "@/stores";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type SelectedBot = {
  name: string;
  move: InitialisedBot;
} | null;

const BotSelector: React.FC<{
  playerName: string;
  availableBots: AvailableBots;
  selectedBot: SelectedBot;
  setSelectedBot: (bot: SelectedBot) => void;
  disabled: boolean;
}> = ({ playerName, availableBots, selectedBot, setSelectedBot, disabled }) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const name = e.target.value;
    if (name) {
      // Initialize the bot function properly
      const botFunction = availableBots[name];
      const initializedBot: InitialisedBot = (fen: string) => botFunction(fen);
      setSelectedBot({ name, move: initializedBot });
    } else {
      setSelectedBot(null);
    }
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

const History: React.FC<{ history: Array<engine.Move> }> = ({ history }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [history]);

  return (
    <pre className="bg-gray-800 text-white w-60 h-[425px] p-4 mt-[105px] overflow-y-auto rounded-lg">
      {history.map(({ color, piece, from, san }) => `${color}${piece}${from} ${san}`).join("\n")}
      <div ref={endRef} />
    </pre>
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
    (fen: engine.Fen, from: engine.Square, to: engine.Square): boolean => {
      const move = engine.move(fen, from, to);
      if (!move) return false;

      const [newFen, action] = move;

      if (engine.isGameOver(newFen)) {
        setTimeout(() => {
          onGameCompleted(engine.getGameWinner(newFen));
          newGame();
        }, 500);
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
      if (!bot) return;
      
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const { from, to } = await bot.move(fen);
        
        if (isBotMovePlayable) {
          const moveSucceeded = doMove(fen, from, to);
          if (!moveSucceeded) {
            console.error(`Bot ${bot.name} attempted invalid move: ${from} to ${to}`);
          }
        }
      } catch (error) {
        console.error("Error making bot move:", error);
      }
    };

    const isBotTurn =
      (whiteBot && engine.isWhiteTurn(fen)) ||
      (blackBot && engine.isBlackTurn(fen));

    if (isBotTurn) {
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
    <div className="h-screen w-full p-4 flex">
      <History history={history} />
      <div className="flex-1 flex flex-col items-center justify-center">
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
            customNotationStyle={{ color: "black", fontWeight: "bold" }}
            boardWidth={400}
          />
        </div>
        <div className="w-[400px] mt-2.5 text-left">
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={user?.profileImageUrl || "/placeholder.svg?height=40&width=40"}
                alt="User profile image"
              />
              <AvatarFallback>
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {user?.username || "Guest"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayWithBot;