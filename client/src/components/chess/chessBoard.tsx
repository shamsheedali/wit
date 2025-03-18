"use client";

import React, { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "../ui/button";

export const ChessBoard: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());

  //Handle piece movement
  const handleMove = (sourceSquare: string, targetSquare: string) => {
    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // Always promote to queen for simplicity
    });

    if (move) {
      setGame(newGame);

      //checking checkmate
      if (newGame.isCheckmate()) {
        alert("Checkmate! Game Over");
      }
    }
  };

  const handleGameRestart = () => {
    setGame(new Chess());
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center w-full h-full">
        <div>
          <Chessboard
            position={game.fen()}
            onPieceDrop={handleMove}
            customNotationStyle={{ color: "#000", fontWeight: "bold" }}
            boardWidth={400}
          />
        </div>
      <Button onClick={handleGameRestart}>Restart</Button>
      </div>

    </>
  );
};
