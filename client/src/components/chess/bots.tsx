import { ShortMove } from "./engine";

type UninitialisedBot = (fen: string) => Promise<ShortMove>;

export type InitialisedBot = (fen: string) => Promise<ShortMove>;

export type AvailableBots = {
  [key: string]: UninitialisedBot;
};


const uciWorker = (filePath: string, actions: Array<string>): UninitialisedBot => () => {
  // Check if window exists (for SSR compatibility)
  if (typeof window === 'undefined') {
    return Promise.reject("Cannot create Web Worker during server-side rendering");
  }

  // Ensure the worker URL is correctly formed with the proper subfolder path
  const workerUrl = `${window.location.origin}/bots/${filePath}`;
  const worker = new Worker(workerUrl, { type: "module" });
  
  // Add onerror handler directly on worker
  worker.onerror = (event) => {
    console.error("Worker error:", event);
    event.preventDefault();
  };

  let resolver: ((move: ShortMove) => void) | null = null;
  let rejecter: ((reason: any) => void) | null = null;
  let moveTimeout: number | null = null;

  worker.addEventListener("message", (e) => {
    console.log("Worker message:", e.data);
    const move = e.data.match(/^bestmove\s([a-h][1-8])([a-h][1-8])/);
    
    if (move && resolver) {
      if (moveTimeout) {
        clearTimeout(moveTimeout);
        moveTimeout = null;
      }
      
      resolver({ from: move[1], to: move[2] });
      resolver = null;
      rejecter = null;
    }
  });
  
  worker.addEventListener("error", (error) => {
    console.error("Worker event error:", error);
    if (rejecter) {
      if (moveTimeout) {
        clearTimeout(moveTimeout);
        moveTimeout = null;
      }
      
      rejecter(error);
      resolver = null;
      rejecter = null;
    } else if (resolver) {
      resolver({ from: "e2", to: "e4" }); // Fallback move
      resolver = null;
      rejecter = null;
    }
  });

  return (fen) =>
    new Promise((resolve, reject) => {
      if (resolver) {
        reject("Pending move is present");
        return;
      }

      resolver = resolve;
      rejecter = reject;
      
      // Set a timeout to prevent hanging
      moveTimeout = window.setTimeout(() => {
        console.warn("Engine timeout - using fallback move");
        if (resolver) {
          resolver({ from: "e2", to: "e4" }); // Fallback move on timeout
          resolver = null;
          rejecter = null;
        }
      }, 5000);

      worker.postMessage(`position fen ${fen}`);
      actions.forEach((action) => worker.postMessage(action));
    });
};

// Use the correct file paths that match your directory structure
const bots: AvailableBots = {
  Random: () => Promise.resolve({ from: "e2", to: "e4" }),
  "stockfish-l1": uciWorker("stockfish.js-10.0.2/stockfish.js", ["go depth 1"]),
  "stockfish-l20": uciWorker("stockfish.js-10.0.2/stockfish.js", ["go depth 20"]),
  "lozza-l1": uciWorker("lozza-1.18/lozza.js", ["go depth 1"]),
};

export default bots;