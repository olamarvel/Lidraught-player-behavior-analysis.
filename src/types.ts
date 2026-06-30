export type TimeControlCategory = "Bullet" | "Blitz" | "Rapid" | "Classical";

export interface Game {
  id: string;
  date: string;
  white: string;
  black: string;
  timeControl: string;
  timeControlCategory: TimeControlCategory;
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  moves: string[];
  clocks?: number[]; // time left in seconds after each ply
}

export interface MoveAnalysis {
  moveNumber: number; // 1, 2, 3...
  ply: number; // 1-indexed half-move: 1, 2, 3...
  player: "white" | "black";
  notation: string; // e.g. "32-28" or "28x19"
  fromSq: number;
  toSq: number;
  r: number; // row 0-9
  c: number; // col 0-9
  zone: string; // name of the zone
  timeSpent: number | null; // in seconds
  timeLeft: number | null; // remaining clock time
  isShift: boolean;
  previousDominantZone: string | null;
  mirrored: boolean; // did the opponent mirror this shift?
  reactionDelay: number | null; // 1 for immediate, 2 for delayed by 1 move (from opponent's view), etc.
}

export type ZoningMethod = "vertical" | "quadrants" | "centerEdge" | "attackDefense";

export interface AnalysisSummary {
  totalGames: number;
  totalMoves: number;
  totalShifts: number;
  totalMirrors: number;
  mirroringRate: number;
  averageReactionDelay: number;
  byTimeControl: {
    [key in TimeControlCategory]: {
      gameCount: number;
      movesCount: number;
      shifts: number;
      mirrors: number;
      rate: number;
      avgDelay: number;
    };
  };
  byZone: {
    [zoneName: string]: {
      count: number;
      shiftsFrom: number;
      shiftsTo: number;
    };
  };
}
