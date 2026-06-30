export interface Coords {
  r: number; // 0-9
  c: number; // 0-9
}

export const squareToCoords = new Map<number, Coords>();
export const coordsToSquare = new Map<string, number>();

// Initialize 10x10 draughts board coordinate maps
for (let s = 1; s <= 50; s++) {
  const r = Math.floor((s - 1) / 5);
  const idx = (s - 1) % 5;
  const c = r % 2 === 0 ? 2 * idx + 1 : 2 * idx;
  squareToCoords.set(s, { r, c });
  coordsToSquare.set(`${r},${c}`, s);
}

export function getSquareCoords(s: number): Coords | null {
  return squareToCoords.get(s) || null;
}

export function getCapturedSquare(fromSq: number, toSq: number): number | null {
  const from = squareToCoords.get(fromSq);
  const to = squareToCoords.get(toSq);
  if (!from || !to) return null;
  
  const midR = (from.r + to.r) / 2;
  const midC = (from.c + to.c) / 2;
  
  if (Number.isInteger(midR) && Number.isInteger(midC)) {
    return coordsToSquare.get(`${midR},${midC}`) || null;
  }
  return null;
}

export type PieceType = "w" | "b" | "W" | "B"; // w/b for standard, W/B for kings
export type BoardState = Record<number, PieceType | null>;

export function getInitialBoard(): BoardState {
  const board: BoardState = {};
  for (let s = 1; s <= 50; s++) {
    if (s <= 20) {
      board[s] = "b";
    } else if (s >= 31) {
      board[s] = "w";
    } else {
      board[s] = null;
    }
  }
  return board;
}

/**
 * Parses a move notation (e.g. "32-28", "28x19" or multi-capture "32x21x10")
 * and returns the list of squares in order.
 */
export function parseMovePath(notation: string): { path: number[]; isCapture: boolean } {
  if (!notation || typeof notation !== "string") {
    return { path: [], isCapture: false };
  }
  const isCapture = notation.includes("x");
  const separators = isCapture ? "x" : "-";
  const path = notation.split(separators).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
  return { path, isCapture };
}

/**
 * Computes the board state at a specific ply (0-indexed, where 0 is start of game).
 */
export function getBoardStateAtPly(moves: string[], targetPly: number): BoardState {
  const board = getInitialBoard();
  const limit = Math.min(targetPly, moves.length);

  for (let p = 0; p < limit; p++) {
    const moveStr = moves[p].trim();
    if (!moveStr) continue;

    const { path, isCapture } = parseMovePath(moveStr);
    if (path.length < 2) continue;

    const startSq = path[0];
    const endSq = path[path.length - 1];
    const movingPiece = board[startSq];

    if (!movingPiece) continue;

    // Clear starting square
    board[startSq] = null;

    if (isCapture) {
      // Clear captured pieces along the path
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const cap = getCapturedSquare(from, to);
        if (cap) {
          board[cap] = null;
        }
      }
    }

    // Place piece at final square, checking for king promotion
    let finalPiece = movingPiece;
    if (movingPiece === "w" && endSq <= 5) {
      finalPiece = "W"; // White King
    } else if (movingPiece === "b" && endSq >= 46) {
      finalPiece = "B"; // Black King
    }

    board[endSq] = finalPiece;
  }

  return board;
}
