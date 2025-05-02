"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useFriendStore } from "@/stores/useFriendStore";
import { ChessMove, GameResult } from "@/types/game";

interface ChessBoardProps {
  gameId?: string;
  playerColor: "w" | "b";
  opponentId?: string;
  viewMode?: boolean;
  position?: string;
  onMove?: (move: ChessMove, fen: string) => void;
  onGameEnd?: (result: GameResult, lossType: LossType, fen: string) => void;
}

type LossType =
  | "checkmate"
  | "resignation"
  | "timeout"
  | "stalemate"
  | "insufficientMaterial"
  | "threefoldRepetition";

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

      socket.on(
        "moveMade",
        (data: {
          gameId: string;
          playerId: string;
          fen: string;
          move: ChessMove;
        }) => {
          if (data.gameId === gameId && data.playerId !== opponentId) {
            const newGame = new Chess(data.fen);
            setGame(newGame);
            if (onMove) {
              onMove(data.move, data.fen);
            }
            checkGameEnd(newGame);
          }
        }
      );

      return () => {
        socket.off("moveMade");
      };
    }
  }, [gameId, opponentId, initializeSocket, onMove]);

  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    if (viewMode || game.turn() !== playerColor) {
      return false;
    }

    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      setGame(newGame);

      const moveData: ChessMove = {
        from: move.from,
        to: move.to,
        piece: move.piece,
        san: move.san,
        color: move.color,
        timestamp: new Date().toISOString(),
      };

      const socket = initializeSocket();
      if (socket && gameId) {
        socket.emit("makeMove", {
          gameId,
          playerId: opponentId,
          fen: newGame.fen(),
          move: moveData,
        });
      }

      if (onMove) {
        onMove(moveData, newGame.fen());
      }

      checkGameEnd(newGame);
      return true;
    } catch (error) {
      console.error("Move error:", error);
      return false;
    }
  };

  const checkGameEnd = (currentGame: Chess) => {
    if (!onGameEnd) return;

    if (currentGame.isCheckmate()) {
      const result: GameResult =
        currentGame.turn() === "w" ? "blackWin" : "whiteWin";
      onGameEnd(result, "checkmate", currentGame.fen());
    } else if (currentGame.isDraw()) {
      let lossType: LossType = "stalemate";
      if (currentGame.isStalemate()) lossType = "stalemate";
      else if (currentGame.isThreefoldRepetition())
        lossType = "threefoldRepetition";
      else if (currentGame.isInsufficientMaterial())
        lossType = "insufficientMaterial";

      onGameEnd("draw", lossType, currentGame.fen());
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
        position={game.fen()}
        onPieceDrop={handleMove}
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
