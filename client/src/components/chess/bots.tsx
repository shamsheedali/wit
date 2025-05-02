import { ShortMove } from "./engine";

type UninitialisedBot = (fen: string) => Promise<ShortMove>;
export type InitialisedBot = (fen: string) => Promise<ShortMove>;
export type AvailableBots = {
  [key: string]: UninitialisedBot;
};

const uciWorker = (filePath: string, actions: string[]): UninitialisedBot => {
  return (fen: string) => {
    // Check if window exists (for SSR compatibility)
    if (typeof window === "undefined") {
      return Promise.reject(
        new Error("Cannot create Web Worker during server-side rendering")
      );
    }

    return new Promise<ShortMove>((resolve, reject) => {
      // Ensure the worker URL is correctly formed with the proper subfolder path
      const workerUrl = `${window.location.origin}/bots/${filePath}`;
      const worker = new Worker(workerUrl, { type: "module" });

      let moveTimeout: number | null = null;

      // Cleanup function
      const cleanup = () => {
        if (moveTimeout) {
          clearTimeout(moveTimeout);
        }
        worker.terminate();
      };

      // Set a timeout to prevent hanging
      moveTimeout = window.setTimeout(() => {
        console.warn("Engine timeout - using fallback move");
        cleanup();
        resolve({ from: "e2", to: "e4" }); // Fallback move on timeout
      }, 5000);

      // Add error handlers
      worker.onerror = (event) => {
        console.error("Worker error:", event);
        cleanup();
        reject(new Error(`Worker error: ${event.message}`));
      };

      worker.addEventListener("error", (error) => {
        console.error("Worker event error:", error);
        cleanup();
        reject(new Error(`Worker error: ${error.message}`));
      });

      worker.addEventListener("message", (e) => {
        console.log("Worker message:", e.data);
        const move = e.data.match(/^bestmove\s([a-h][1-8])([a-h][1-8])/);

        if (move) {
          cleanup();
          resolve({ from: move[1], to: move[2] });
        }
      });

      // Initialize the worker
      worker.postMessage(`position fen ${fen}`);
      actions.forEach((action) => worker.postMessage(action));
    });
  };
};

// Use the correct file paths that match your directory structure
const bots: AvailableBots = {
  "stockfish-l1": uciWorker("stockfish.js-10.0.2/stockfish.js", ["go depth 1"]),
  "stockfish-l20": uciWorker("stockfish.js-10.0.2/stockfish.js", [
    "go depth 20",
  ]),
  "lozza-l1": uciWorker("lozza-1.18/lozza.js", ["go depth 1"]),
};

export default bots;
