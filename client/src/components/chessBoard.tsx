"use client"

import React, { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export const ChessBoard: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());

  // Function to handle piece movement
  const handleMove = (sourceSquare: string, targetSquare: string) => {
    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // Always promote to queen for simplicity
    });

    if (move) {
      setGame(newGame);


      //checking checkmate or not
      if(newGame.isCheckmate()) {
        alert("Checkmate! Game Over");
      }
    }
  };

  return (
      <Chessboard 
        position={game.fen()} 
        onPieceDrop={handleMove} 
        boardWidth={500} 
      />
  );
};

