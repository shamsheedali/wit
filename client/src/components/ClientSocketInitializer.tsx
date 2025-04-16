"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { useGameStore } from "@/stores/useGameStore";
import { Button } from "./ui/button";
import { getGameType, timeToSeconds } from "@/lib/utils";
import { saveGame } from "@/lib/api/game";
import { ChessMove } from "@/types/game";

export default function ClientSocketInitializer() {
  const { user, logout } = useAuthStore();
  const { initializeSocket } = useFriendStore();
  const { setGameDetails, addMove, resetGame } = useGameStore();
  const router = useRouter();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();
      if (socket) {
        socket.emit("join", user._id);

        socket.on("userBanned", (data) => {
          if (data.userId === user._id) {
            toast.error("You have been banned by an admin.");
            logout();
            router.push("/login");
          }
        });

        socket.on("playRequestReceived", (data) => {
          toast(`Game request from ${data.senderName} (${data.time})`, {
            description: (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info("Play request declined")}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!socket || !user?._id) return;
                    const newGameId = `${data.senderId}-${
                      user._id
                    }-${Date.now()}`;
                    socket.emit("acceptPlayRequest", {
                      senderId: data.senderId,
                      receiverId: user._id,
                      senderName: data.senderName,
                      gameId: newGameId,
                      time: data.time,
                    });
                    socket.emit("joinGame", { gameId: newGameId });

                    const gameType = getGameType(data.time);
                    const savedGame = await saveGame(
                      data.senderId,
                      user._id,
                      "w",
                      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                      gameType,
                      data.time
                    );

                    setGameDetails({
                      gameId: newGameId,
                      dbGameId: savedGame?._id,
                      opponentId: data.senderId,
                      opponentName: data.senderName,
                      opponentProfilePicture: data.senderPfp,
                      playerColor: "b",
                      whiteTime: timeToSeconds(data.time),
                      blackTime: timeToSeconds(data.time),
                      gameStarted: true,
                      activePlayer: "w",
                      gameStartTime: Date.now(),
                      moves: [],
                    });

                    toast.success(`Game started with ${data.senderName}`);
                    router.push("/play/friend");
                  }}
                >
                  Accept
                </Button>
              </div>
            ),
            duration: 10000,
          });
        });

        socket.on("playRequestAccepted", (data) => {
          setGameDetails({
            gameId: data.gameId,
            opponentId: data.opponentId,
            opponentName: data.opponentName,
            playerColor: "w",
            whiteTime: timeToSeconds(data.time),
            blackTime: timeToSeconds(data.time),
            gameStarted: true,
            activePlayer: "w",
            gameStartTime: Date.now(),
            moves: [],
          });
          socket.emit("joinGame", { gameId: data.gameId });
          toast.success(`Game started with ${data.opponentName}`);
        });

        socket.on(
          "moveMade",
          (data: {
            gameId: string;
            move: ChessMove;
            playerId: string;
            fen: string;
          }) => {
            if (
              data.gameId === useGameStore.getState().gameId &&
              data.playerId !== user._id
            ) {
              addMove(data.move);
              useGameStore.setState({
                activePlayer: data.move.color === "w" ? "b" : "w",
              });
            }
          }
        );

        socket.on("gameTerminated", () => {
          toast.info("This game has been terminated by an admin.");
          resetGame();
          router.push("/play");
        });

        socket.on("opponentBanned", () => {
          toast.info("Admin banned your opponent.");
          resetGame();
          router.push("/");
        });

        return () => {
          socket.off("userBanned");
          socket.off("playRequestReceived");
          socket.off("playRequestAccepted");
          socket.off("moveMade");
          socket.off("gameTerminated");
          socket.off("opponentBanned");
        };
      }
    }
  }, [
    user?._id,
    initializeSocket,
    router,
    logout,
    setGameDetails,
    addMove,
    resetGame,
  ]);

  return null;
}
