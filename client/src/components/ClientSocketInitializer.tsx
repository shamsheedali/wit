"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { useGameStore } from "@/stores/useGameStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { Button } from "./ui/button";
import { getGameType, timeToSeconds } from "@/lib/utils";
import { saveGame } from "@/lib/api/game";

export default function ClientSocketInitializer() {
  const { user, logout } = useAuthStore();
  const { initializeSocket } = useFriendStore();
  const { setGameState, addMove, resetGame } = useGameStore();
  const { addNotification } = useNotificationStore();
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
          if (data.tournamentId) return;
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
                    const gameType = getGameType(data.time);
                    const savedGame = await saveGame(
                      data.senderId,
                      user._id,
                      "w",
                      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                      gameType,
                      data.time
                    );

                    if (!savedGame?._id) {
                      toast.error("Failed to create game");
                      return;
                    }

                    socket.emit("acceptPlayRequest", {
                      senderId: data.senderId,
                      receiverId: user._id,
                      senderName: data.senderName,
                      gameId: newGameId,
                      dbGameId: savedGame._id,
                      time: data.time,
                    });
                    socket.emit("joinGame", { gameId: newGameId });

                    setGameState({
                      gameId: newGameId,
                      dbGameId: savedGame._id,
                      opponentId: data.senderId,
                      opponentName: data.senderName,
                      opponentProfilePicture: data.senderPfp,
                      opponentEloRating: data.senderEloRating,
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
          if (data.tournamentId) return;
          setGameState({
            gameId: data.gameId,
            dbGameId: data.dbGameId,
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
          router.push("/play/friend");
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

        // socket.on("opponentResigned", (data) => {
        //   toast.success(`Game ended: ${data.result}`);
        //   resetGame();
        // });

        socket.on("opponentDrawRequestReceived", (data) => {
          if (data.opponentId === user?._id) {
            toast(`Draw match request from ${data.senderName}`, {
              description: (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Draw request declined")}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!socket || !user?._id) return;
                      socket.emit("drawRequestAccepted", {
                        playerOne: user._id,
                        playerTwo: data.senderId,
                      });
                    }}
                  >
                    Accept
                  </Button>
                </div>
              ),
              duration: 10000,
            });
          }
        });

        socket.on("tournamentPlayRequestReceived", (data) => {
          if (data.receiverId === user?._id) {
            toast(`Tournament match request from ${data.senderName}`, {
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
                      const gameType = getGameType(data.time);
                      const savedGame = await saveGame(
                        data.senderId,
                        user._id,
                        Math.random() > 0.5 ? "w" : "b",
                        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                        gameType,
                        data.time
                      );

                      if (!savedGame?._id) {
                        toast.error("Failed to create game");
                        return;
                      }

                      socket.emit("tournamentPlayRequestAccepted", {
                        senderId: user._id,
                        receiverId: data.senderId,
                        senderName: user.username,
                        senderPfp: user.profileImageUrl || "",
                        senderEloRating: user.eloRating,
                        gameId: newGameId,
                        dbGameId: savedGame._id,
                        time: data.time,
                        tournamentId: data.tournamentId,
                        matchId: data.matchId,
                      });
                      socket.emit("joinGame", { gameId: newGameId });

                      setGameState({
                        gameId: newGameId,
                        dbGameId: savedGame._id,
                        opponentId: data.senderId,
                        opponentName: data.senderName,
                        opponentProfilePicture: data.senderPfp,
                        opponentEloRating: data.senderEloRating,
                        playerColor: "b",
                        whiteTime: timeToSeconds(data.time),
                        blackTime: timeToSeconds(data.time),
                        gameStarted: true,
                        activePlayer: "w",
                        gameStartTime: Date.now(),
                        moves: [],
                        isTournamentGame: true,
                        tournamentId: data.tournamentId,
                        matchId: data.matchId,
                      });

                      router.push("/play/tournament");
                    }}
                  >
                    Accept
                  </Button>
                </div>
              ),
              duration: 10000,
            });
          }
        });

        socket.on("tournamentPlayRequestAccepted", (data) => {
          if (data.receiverId === user?._id) {
            setGameState({
              gameId: data.gameId,
              dbGameId: data.dbGameId,
              opponentId:
                data.senderId === user?._id ? data.receiverId : data.senderId,
              opponentName: data.senderName,
              opponentProfilePicture: data.senderPfp,
              opponentEloRating: data.senderEloRating,
              playerColor: "w",
              whiteTime: timeToSeconds(data.time),
              blackTime: timeToSeconds(data.time),
              gameStarted: true,
              activePlayer: "w",
              gameStartTime: Date.now(),
              moves: [],
              isTournamentGame: true,
              tournamentId: data.tournamentId,
              matchId: data.matchId,
            });
            socket.emit("joinGame", { gameId: data.gameId });
            router.push("/play/tournament");
          }
        });

        socket.on("tournamentStarted", (data) => {
          if (data.tournamentId && data.players.includes(user?._id)) {
            toast.info(`Tournament "${data.tournamentName}" has started!`);
          }
        });

        socket.on("notification", (data) => {
          addNotification({
            _id: `${data.senderId}-${data.timestamp}`,
            type: "message",
            senderId: data.senderId,
            content: data.content,
            timestamp: data.timestamp,
          });
        });

        return () => {
          socket.off("userBanned");
          socket.off("playRequestReceived");
          socket.off("playRequestAccepted");
          socket.off("moveMade");
          socket.off("gameTerminated");
          socket.off("opponentBanned");
          socket.off("opponentResigned");
          socket.off("tournamentPlayRequestReceived");
          socket.off("tournamentPlayRequestAccepted");
          socket.off("tournamentStarted");
          socket.off("notification");
        };
      }
    }
  }, [
    user?._id,
    user?.username,
    initializeSocket,
    router,
    logout,
    setGameState,
    addMove,
    resetGame,
    addNotification,
  ]);

  return null;
}
