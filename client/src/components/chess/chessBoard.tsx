"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useFriendStore } from "@/stores/useFriendStore";

interface ChessBoardProps {
  gameId?: string; // Unique identifier for the game
  playerColor: "w" | "b"; // "w" for white, "b" for black
  opponentId?: string; // ID of the opponent
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ gameId, playerColor, opponentId }) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(500);
  const { initializeSocket } = useFriendStore();

  useEffect(() => {
    const socket = initializeSocket();
    if (socket && gameId) {
      // Join the game room
      socket.emit("joinGame", { gameId });

      // Listen for opponent moves
      socket.on("moveMade", (data) => {
        if (data.gameId === gameId && data.playerId !== opponentId) {
          const newGame = new Chess(data.fen);
          setGame(newGame);
          if (newGame.isCheckmate()) {
            alert("Checkmate! Game Over");
          } else if (newGame.isCheck()) {
            alert("Check!");
          }
        }
      });

      return () => {
        socket.off("moveMade");
      };
    }
  }, [gameId, opponentId, initializeSocket]);

  // Handle local player moves
  const handleMove = (sourceSquare: string, targetSquare: string) => {
    if (game.turn() !== playerColor) {
      return false; // Prevent move if not player's turn
    }

    const newGame = new Chess(game.fen());
    const move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: "q" });

    if (move) {
      setGame(newGame);
      const socket = initializeSocket();
      if (socket && gameId) {
        socket.emit("makeMove", {
          gameId,
          playerId: opponentId,
          fen: newGame.fen(),
        });
      }
      if (newGame.isCheckmate()) {
        alert("Checkmate! Game Over");
      } else if (newGame.isCheck()) {
        alert("Check!");
      }
      return true;
    }
    return false;
  };

  // Dynamically resize the board
  useEffect(() => {
    const updateSize = () => {
      if (boardContainerRef.current) {
        const containerSize = boardContainerRef.current.clientWidth;
        const newSize = Math.min(containerSize * 0.95, 600);
        setBoardSize(newSize);
      }
    };

    window.addEventListener("resize", updateSize);
    updateSize();

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <div ref={boardContainerRef} className="flex justify-center items-center w-full h-full">
      <Chessboard
        position={game.fen()}
        onPieceDrop={handleMove}
        customBoardStyle={{ borderRadius: "4px" }}
        customDarkSquareStyle={{ backgroundColor: "#779952" }}
        customLightSquareStyle={{ backgroundColor: "#edeed1" }}
        boardWidth={boardSize}
        boardOrientation={playerColor === "w" ? "white" : "black"}
      />
    </div>
  );
};