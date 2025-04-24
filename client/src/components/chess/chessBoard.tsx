"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useFriendStore } from "@/stores/useFriendStore";

interface ChessBoardProps {
  gameId?: string;
  playerColor: "w" | "b";
  opponentId?: string;
  viewMode?: boolean;
  position?: string;
  onMove?: (move: any, fen: string) => void;
  onGameEnd?: (
    result: "whiteWin" | "blackWin" | "draw",
    lossType: "checkmate" | "resignation" | "timeout",
    fen: string
  ) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  gameId,
  playerColor,
  opponentId,
  viewMode = false,
  position,
  onMove,
  onGameEnd,
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(500);
  const { initializeSocket } = useFriendStore();

  // Update game state when position prop changes
  useEffect(() => {
    try {
      if (position) {
        const newGame = new Chess(position);
        setGame(newGame);
      } else {
        // Handle reset case when position is undefined
        setGame(new Chess());
      }
    } catch (e) {
      console.error("Error setting chess position:", e);
      setGame(new Chess());
    }
  }, [position]);

  useEffect(() => {
    const socket = initializeSocket();
    if (socket && gameId) {
      socket.emit("joinGame", { gameId });

      socket.on("moveMade", (data) => {
        if (data.gameId === gameId && data.playerId !== opponentId) {
          const newGame = new Chess(data.fen);
          setGame(newGame);
          if (onMove) {
            onMove(data.move, data.fen);
          }
          checkGameEnd(newGame);
        }
      });

      return () => {
        socket.off("moveMade");
      };
    }
  }, [gameId, opponentId, initializeSocket, onMove]);

  const handleMove = (sourceSquare: string, targetSquare: string) => {
    // Prevent moves in view mode
    if (viewMode) {
      return false;
    }

    if (game.turn() !== playerColor) {
      return false;
    }

    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move) {
      setGame(newGame);
      const socket = initializeSocket();
      if (socket && gameId) {
        const moveData = {
          from: move.from,
          to: move.to,
          piece: move.piece,
          san: move.san,
          timestamp: new Date().toISOString(),
        };
        socket.emit("makeMove", {
          gameId,
          playerId: opponentId,
          fen: newGame.fen(),
          move: moveData,
        });
        if (onMove) {
          onMove(moveData, newGame.fen());
        }
      }
      checkGameEnd(newGame);
      return true;
    }
    return false;
  };

  const checkGameEnd = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      const result = currentGame.turn() === "w" ? "blackWin" : "whiteWin";
      alert("Checkmate! Game Over");
      if (onGameEnd) {
        onGameEnd(result, "checkmate", currentGame.fen());
      }
    } else if (currentGame.isDraw()) {
      alert("Draw! Game Over");
      if (onGameEnd) {
        onGameEnd("draw", "checkmate", currentGame.fen()); // Using "checkmate" as placeholder; could refine for stalemate
      }
    } else if (currentGame.isCheck()) {
      alert("Check!");
    }
  };

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
    <div
      ref={boardContainerRef}
      className="flex justify-center items-center w-full h-full"
    >
      <Chessboard
        position={game.fen()} // This will now update when position prop changes
        onPieceDrop={(sourceSquare, targetSquare) =>
          handleMove(sourceSquare, targetSquare)
        }
        customBoardStyle={{ borderRadius: "4px" }}
        customNotationStyle={{ color: "black", fontWeight: "bold" }}
        customDarkSquareStyle={{ backgroundColor: "#779952" }}
        customLightSquareStyle={{ backgroundColor: "#edeed1" }}
        boardWidth={boardSize}
        boardOrientation={playerColor === "w" ? "white" : "black"}
      />
    </div>
  );
};
