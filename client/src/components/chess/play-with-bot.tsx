"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import * as engine from "@/components/chess/engine";
import type { AvailableBots, InitialisedBot } from "@/components/chess/bots";
import { Button } from "../ui/button";
import { useAuthStore } from "@/stores";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

type SelectedBot = {
  name: string;
  move: InitialisedBot;
} | null;

type Difficulty = "trivial" | "easy" | "medium" | "hard";
type GameMode = "bullet" | "blitz" | "rapid" | "classical";
type PlayerColor = "white" | "black" | "random";

interface GameModeConfig {
  whiteTime: number; // in seconds
  blackTime: number;
}

const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  bullet: { whiteTime: 60, blackTime: 60 },
  blitz: { whiteTime: 300, blackTime: 300 },
  rapid: { whiteTime: 600, blackTime: 600 },
  classical: { whiteTime: 3600, blackTime: 3600 },
};

const DIFFICULTY_CONFIG: Record<Difficulty, string> = {
  trivial: "random",
  easy: "stockfish-l1",
  medium: "stockfish-l10",
  hard: "stockfish-l20",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  trivial: "Trivial (Random Moves)",
  easy: "Easy (Level 1)",
  medium: "Medium (Level 10)",
  hard: "Hard (Level 20)",
};

const SetupScreen: React.FC<{
  difficulty: Difficulty;
  playerColor: PlayerColor;
  gameMode: GameMode;
  onDifficultyChange: (d: Difficulty) => void;
  onColorChange: (c: PlayerColor) => void;
  onGameModeChange: (m: GameMode) => void;
  onStart: () => void;
}> = ({
  difficulty,
  playerColor,
  gameMode,
  onDifficultyChange,
  onColorChange,
  onGameModeChange,
  onStart,
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-clashDisplay text-center">
            Play vs Computer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Difficulty Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium uppercase tracking-wider text-muted-foreground">
              Difficulty Level
            </Label>
            <RadioGroup value={difficulty} onValueChange={(v) => onDifficultyChange(v as Difficulty)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trivial" id="trivial" />
                <Label htmlFor="trivial" className="font-normal cursor-pointer">
                  Trivial (Random Moves)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="font-normal cursor-pointer">
                  Easy (Level 1)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">
                  Medium (Level 10)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="font-normal cursor-pointer">
                  Hard (Level 20)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Game Mode Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium uppercase tracking-wider text-muted-foreground">
              Game Mode
            </Label>
            <RadioGroup value={gameMode} onValueChange={(v) => onGameModeChange(v as GameMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bullet" id="bullet" />
                <Label htmlFor="bullet" className="font-normal cursor-pointer">
                  Bullet (1 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blitz" id="blitz" />
                <Label htmlFor="blitz" className="font-normal cursor-pointer">
                  Blitz (5 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rapid" id="rapid" />
                <Label htmlFor="rapid" className="font-normal cursor-pointer">
                  Rapid (10 min)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="classical" id="classical" />
                <Label htmlFor="classical" className="font-normal cursor-pointer">
                  Classical (1 hour)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Player Color Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium uppercase tracking-wider text-muted-foreground">
              Play as
            </Label>
            <RadioGroup value={playerColor} onValueChange={(v) => onColorChange(v as PlayerColor)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="white" id="white" />
                <Label htmlFor="white" className="font-normal cursor-pointer">
                  White
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="black" id="black" />
                <Label htmlFor="black" className="font-normal cursor-pointer">
                  Black
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="random" id="random" />
                <Label htmlFor="random" className="font-normal cursor-pointer">
                  Random
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Start Button */}
          <Button
            onClick={onStart}
            className="w-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors py-2 h-auto"
          >
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Timer: React.FC<{ timeRemaining: number; isActive: boolean }> = ({ timeRemaining, isActive }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div
      className={`text-lg font-mono font-bold px-4 py-2 rounded-lg ${
        isActive ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};

const MoveHistory: React.FC<{ history: Array<engine.Move>; actualPlayerColor: "w" | "b" }> = ({ history, actualPlayerColor }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [history]);

  // Group moves into pairs
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i],
      black: history[i + 1],
    });
  }

  const labelMove = (color: "w" | "b", san: string) => {
    const isPlayerMove = color === actualPlayerColor;
    return isPlayerMove ? `You: ${san}` : `Bot: ${san}`;
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 text-foreground w-72 max-h-[500px] p-4 rounded-2xl overflow-y-auto custom-scrollbar">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Move History
      </h3>
      <div className="space-y-2">
        {movePairs.map((pair, idx) => (
          <div key={idx} className="text-xs font-mono leading-relaxed">
            <div className="text-muted-foreground">{idx + 1}.</div>
            {pair.white && (
              <div className="ml-3 text-foreground">
                {labelMove("w", pair.white.san)}
              </div>
            )}
            {pair.black && (
              <div className="ml-3 text-foreground">
                {labelMove("b", pair.black.san)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div ref={endRef} />
    </div>
  );
};

const PlayWithBot: React.FC<{
  bots: AvailableBots;
  onGameCompleted: (winner: engine.GameWinner) => void;
}> = ({ bots, onGameCompleted }) => {
  const { user } = useAuthStore();

  // Setup state
  const [gameSetup, setGameSetup] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [gameMode, setGameMode] = useState<GameMode>("blitz");

  // Game state
  const [fen, setFen] = useState<engine.Fen>(engine.newGame);
  const [history, setHistory] = useState<Array<engine.Move>>([]);
  const [botToPlay, setBotToPlay] = useState<SelectedBot>(null);
  const [whiteTimeRemaining, setWhiteTimeRemaining] = useState(600);
  const [blackTimeRemaining, setBlackTimeRemaining] = useState(600);
  const [gameEnded, setGameEnded] = useState(false);
  const [actualPlayerColor, setActualPlayerColor] = useState<"w" | "b">("w");
  const [boardWidth, setBoardWidth] = useState(400);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const actualBotColor = actualPlayerColor === "w" ? ("b" as const) : ("w" as const);

  // Initialize bot when game starts
  useEffect(() => {
    if (!gameSetup) return;

    const botName = DIFFICULTY_CONFIG[difficulty];
    const botFunction = bots[botName];
    if (botFunction) {
      const initializedBot: InitialisedBot = (fen: string) => botFunction(fen);
      setBotToPlay({ name: botName, move: initializedBot });
    }

    const chosenColor =
      playerColor === "random"
        ? Math.random() < 0.5
          ? "w"
          : "b"
        : playerColor === "white"
        ? "w"
        : "b";
    setActualPlayerColor(chosenColor);

    // Set initial time
    const config = GAME_MODE_CONFIG[gameMode];
    setWhiteTimeRemaining(config.whiteTime);
    setBlackTimeRemaining(config.blackTime);
  }, [gameSetup, difficulty, gameMode, bots, playerColor]);

  useEffect(() => {
    const updateBoardWidth = () => {
      const containerWidth = boardContainerRef.current?.clientWidth ?? 0;
      const computedWidth = Math.min(Math.max(containerWidth - 32, 320), 460);
      setBoardWidth(computedWidth);
    };

    updateBoardWidth();
    window.addEventListener("resize", updateBoardWidth);
    return () => window.removeEventListener("resize", updateBoardWidth);
  }, []);

  // Timer logic
  useEffect(() => {
    if (!gameSetup || gameEnded) return;

    const interval = setInterval(() => {
      if (engine.isWhiteTurn(fen)) {
        setWhiteTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameEnded(true);
            onGameCompleted(actualPlayerColor === "w" ? "b" : "w");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameEnded(true);
            onGameCompleted(actualPlayerColor === "b" ? "w" : "b");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameSetup, fen, gameEnded, onGameCompleted, actualPlayerColor]);

  const newGame = useCallback(() => {
    setGameSetup(false);
    setFen(engine.newGame);
    setHistory([]);
    setGameEnded(false);
    setWhiteTimeRemaining(GAME_MODE_CONFIG[gameMode].whiteTime);
    setBlackTimeRemaining(GAME_MODE_CONFIG[gameMode].blackTime);
  }, [gameMode]);

  const handleResign = useCallback(() => {
    setGameEnded(true);
    const winner = actualPlayerColor === "w" ? "b" : "w";
    onGameCompleted(winner);
  }, [actualPlayerColor, onGameCompleted]);

  const doMove = useCallback(
    (fromSquare: engine.Square, toSquare: engine.Square): boolean => {
      // Prevent moves if game is over
      if (gameEnded) return false;

      // Check if it's the player's turn
      const isPlayerTurn = 
        (actualPlayerColor === "w" && engine.isWhiteTurn(fen)) ||
        (actualPlayerColor === "b" && engine.isBlackTurn(fen));

      if (!isPlayerTurn) return false;

      const move = engine.move(fen, fromSquare, toSquare);
      if (!move) return false;

      const [newFen, action] = move;

      if (engine.isGameOver(newFen)) {
        setGameEnded(true);
        setTimeout(() => {
          onGameCompleted(engine.getGameWinner(newFen));
          newGame();
        }, 500);
      }

      setFen(newFen);
      setHistory((prev) => [...prev, action]);
      return true;
    },
    [fen, actualPlayerColor, gameEnded, onGameCompleted, newGame]
  );

  // Bot move logic
  useEffect(() => {
    if (!gameSetup || gameEnded || !botToPlay) return;

    const isBotTurn =
      (actualBotColor === "w" && engine.isWhiteTurn(fen)) ||
      (actualBotColor === "b" && engine.isBlackTurn(fen));

    if (!isBotTurn) return;

    let isBotMovePlayable = true;

    const playBotMove = async () => {
      if (!botToPlay) return;

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const { from, to } = await botToPlay.move(fen);

        if (isBotMovePlayable) {
          const move = engine.move(fen, from, to);
          if (!move) {
            console.error(`Bot ${botToPlay.name} attempted invalid move: ${from} to ${to}`);
            return;
          }

          const [newFen, action] = move;

          if (engine.isGameOver(newFen)) {
            setGameEnded(true);
            setTimeout(() => {
              onGameCompleted(engine.getGameWinner(newFen));
              newGame();
            }, 500);
          }

          setFen(newFen);
          setHistory((prev) => [...prev, action]);
        }
      } catch (error) {
        console.error("Error making bot move:", error);
      }
    };

    requestAnimationFrame(() => {
      playBotMove();
    });

    return () => {
      isBotMovePlayable = false;
    };
  }, [gameSetup, fen, botToPlay, actualBotColor, gameEnded, onGameCompleted, newGame]);

  // Show setup screen if game not started
  if (!gameSetup) {
    return (
      <SetupScreen
        difficulty={difficulty}
        playerColor={playerColor}
        gameMode={gameMode}
        onDifficultyChange={setDifficulty}
        onColorChange={setPlayerColor}
        onGameModeChange={setGameMode}
        onStart={() => setGameSetup(true)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Navbar spacer */}
      <div className="h-[120px]" />

      {/* Main scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-clashDisplay font-bold text-foreground mb-1">
                Play vs Computer
              </h1>
              <p className="text-sm text-muted-foreground">
                {DIFFICULTY_LABELS[difficulty]} • {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
              </p>
            </div>
            <Button onClick={newGame} variant="outline">
              ← Back to Menu
            </Button>
          </div>

          {/* Game Container */}
          <div className="flex gap-6 flex-wrap lg:flex-nowrap">
            {/* Move History - Left sidebar */}
            <div className="w-full lg:w-80 order-3 lg:order-1 min-h-0">
              <MoveHistory history={history} actualPlayerColor={actualPlayerColor} />
            </div>

            {/* Board and Controls - Center */}
            <div className="flex-1 flex flex-col items-center justify-center order-2 min-w-0 mt-6 lg:mt-0">
              {/* Bot Info */}
              <div className="w-full max-w-md text-center bg-card/50 backdrop-blur-sm border border-border/50 px-4 py-3 rounded-2xl mb-4 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Opponent:</span>
                <span className="text-sm font-semibold text-foreground">Computer</span>
              </div>

              {/* Timers */}
              <div className="flex gap-4 mb-4 w-full max-w-md justify-between px-4">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {actualBotColor === "w" ? "Computer" : "You"}
                  </span>
                  <Timer 
                    timeRemaining={whiteTimeRemaining} 
                    isActive={engine.isWhiteTurn(fen) && !gameEnded}
                  />
                  <span className="text-xs text-muted-foreground">White</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {actualBotColor === "b" ? "Computer" : "You"}
                  </span>
                  <Timer 
                    timeRemaining={blackTimeRemaining} 
                    isActive={engine.isBlackTurn(fen) && !gameEnded}
                  />
                  <span className="text-xs text-muted-foreground">Black</span>
                </div>
              </div>

              {/* Chessboard */}
              <div ref={boardContainerRef} className="mb-4 flex justify-center w-full">
                <Chessboard
                  position={fen}
                  onPieceDrop={(from, to) => doMove(from, to)}
                  customNotationStyle={{ color: "black", fontWeight: "bold" }}
                  boardWidth={boardWidth}
                  boardOrientation={actualPlayerColor === "w" ? "white" : "black"}
                />
              </div>

              {/* Your Info */}
              <div className="w-full max-w-md text-left bg-card/50 backdrop-blur-sm border border-border/50 px-4 py-3 rounded-2xl flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage
                      src={user?.profileImageUrl || "/placeholder.svg?height=40&width=40"}
                      alt="User profile image"
                    />
                    <AvatarFallback className="bg-secondary text-foreground">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {user?.username || "Guest"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {actualPlayerColor === "w" ? "White" : "Black"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resign Button */}
              {!gameEnded && (
                <Button 
                  onClick={handleResign}
                  variant="destructive"
                  className="w-full max-w-md"
                >
                  Resign Game
                </Button>
              )}
            </div>
          </div>

          {/* Game Over Modal */}
          {gameEnded && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-clashDisplay">
                    {(() => {
                      if (whiteTimeRemaining === 0 || blackTimeRemaining === 0) {
                        return "Time's Up!";
                      }
                      return "Game Over";
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                  <div>
                    <p className="text-muted-foreground mb-2">Result</p>
                    <p className="text-xl font-semibold text-accent">
                      {(() => {
                        if (whiteTimeRemaining === 0) {
                          return actualPlayerColor === "w" ? "You Lost" : "You Won!";
                        }
                        if (blackTimeRemaining === 0) {
                          return actualPlayerColor === "b" ? "You Lost" : "You Won!";
                        }
                        return "Game Ended";
                      })()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={newGame} className="w-full bg-accent hover:bg-accent/90">
                      Play Again
                    </Button>
                    <Button onClick={newGame} variant="outline" className="w-full">
                      Back to Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayWithBot;