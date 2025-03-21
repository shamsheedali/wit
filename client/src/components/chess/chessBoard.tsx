"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

interface ChessBoardProps {
  maxWidth?: number; // Desired physical width in pixels at 100% zoom
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ maxWidth = 550 }) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(maxWidth);

  // Handle piece movement
  const handleMove = (sourceSquare: string, targetSquare: string) => {
    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move) {
      setGame(newGame);
      if (newGame.isCheckmate()) {
        alert("Checkmate! Game Over");
      }
    }
  };

  // Adjust size based on zoom level
  useEffect(() => {
    const updateSize = () => {
      // Get the device pixel ratio and zoom level
      const zoomLevel = window.devicePixelRatio || 1;
      // Calculate the base size adjusted for zoom
      const adjustedSize = maxWidth / zoomLevel;

      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        // Ensure it fits container but doesn't exceed adjusted size
        const newSize = Math.min(containerWidth, containerHeight, adjustedSize);
        setBoardSize(newSize);
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Listen to window resize and zoom changes
    window.addEventListener("resize", updateSize);
    updateSize(); // Initial size

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener("resize", updateSize);
    };
  }, [maxWidth]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex justify-center items-center"
      style={{
        maxWidth: `${maxWidth}px`,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: `${boardSize}px`,
          height: `${boardSize}px`,
        }}
      >
        <Chessboard
          position={game.fen()}
          onPieceDrop={handleMove}
          customNotationStyle={{ color: "#000", fontWeight: "bold" }}
          boardWidth={boardSize}
        />
      </div>
    </div>
  );
};