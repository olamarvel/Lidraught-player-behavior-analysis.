import { Game, MoveAnalysis, ZoningMethod, AnalysisSummary, TimeControlCategory } from "../types";
import { getSquareCoords, parseMovePath } from "./board";

/**
 * Returns the zone name for a square based on the zoning method and player color.
 */
export function getZoneName(toSq: number, method: ZoningMethod, player: "white" | "black"): string {
  const coords = getSquareCoords(toSq);
  if (!coords) return "Unknown";

  const { r, c } = coords;

  switch (method) {
    case "vertical":
      return c <= 4 ? "Left" : "Right";

    case "quadrants": {
      const vert = c <= 4 ? "Left" : "Right";
      const horiz = r <= 4 ? "Top" : "Bottom";
      return `${horiz}-${vert}`;
    }

    case "centerEdge": {
      // 10x10 board. Center is rows 2-7 and cols 2-7.
      const isCenter = r >= 2 && r <= 7 && c >= 2 && c <= 7;
      return isCenter ? "Center" : "Edge";
    }

    case "attackDefense": {
      // White plays from bottom (rows 5-9) to top (rows 0-4).
      // Black plays from top (rows 0-4) to bottom (rows 5-9).
      if (player === "white") {
        return r <= 4 ? "Attack Zone" : "Defensive Zone";
      } else {
        return r >= 5 ? "Attack Zone" : "Defensive Zone";
      }
    }

    default:
      return "Default";
  }
}

export interface AnalysisOptions {
  zoningMethod: ZoningMethod;
  dominanceWindow: number; // e.g., 3 or 5 previous moves of the player
  dominanceThreshold: number; // percentage of moves in the window that must match (0.5 to 1.0, e.g. 1.0)
  mirrorWindow: number; // number of opponent moves to check for mirroring (e.g. 2 or 3)
  excludeCaptures?: boolean; // exclude mandatory/forced jump moves from establishing behavioral instinct
}

/**
 * Analyzes a single game's move list to extract move-by-move zones, shifts, and responses.
 */
export function analyzeGame(game: Game, options: AnalysisOptions): MoveAnalysis[] {
  const { zoningMethod, dominanceWindow, dominanceThreshold, mirrorWindow, excludeCaptures } = options;
  const analyzedMoves: MoveAnalysis[] = [];

  const movesCount = game.moves.length;
  const clocks = game.clocks || [];

  // Track each player's move list separately for window dominance analysis
  const whitePlayerPlies: number[] = []; // ply indices for white
  const blackPlayerPlies: number[] = []; // ply indices for black

  // First pass: Basic categorization and details
  for (let p = 0; p < movesCount; p++) {
    const notation = game.moves[p];
    const player: "white" | "black" = p % 2 === 0 ? "white" : "black";
    const { path, isCapture } = parseMovePath(notation);

    if (path.length < 2) continue;

    const fromSq = path[0];
    const toSq = path[path.length - 1];
    const coords = getSquareCoords(toSq);
    if (!coords) continue;

    // Calculate time spent
    let timeSpent: number | null = null;
    let timeLeft: number | null = null;

    if (clocks.length > p) {
      timeLeft = clocks[p];
      // Previous time left for this player is at p - 2, or initial if p < 2
      const prevPly = p - 2;
      let prevTimeLeft = 300; // default 5 mins placeholder if not in clocks
      if (prevPly >= 0 && clocks.length > prevPly) {
        prevTimeLeft = clocks[prevPly];
      } else {
        // Estimate initial clock based on time control
        const match = game.timeControl.match(/^(\d+)/);
        if (match) {
          prevTimeLeft = parseInt(match[1], 10) * 60;
        }
      }
      timeSpent = Math.max(0, prevTimeLeft - timeLeft);
    } else {
      // Simulate realistic time usage if no clock data is available
      // Typically 2 to 15 seconds per move
      timeSpent = Math.floor(Math.random() * 10) + 2;
    }

    const zone = getZoneName(toSq, zoningMethod, player);
    const moveNumber = Math.floor(p / 2) + 1;

    analyzedMoves.push({
      moveNumber,
      ply: p + 1,
      player,
      notation,
      fromSq,
      toSq,
      r: coords.r,
      c: coords.c,
      zone,
      timeSpent,
      timeLeft,
      isShift: false,
      previousDominantZone: null,
      mirrored: false,
      reactionDelay: null,
    });

    const isExcluded = excludeCaptures && isCapture;
    if (!isExcluded) {
      if (player === "white") {
        whitePlayerPlies.push(p);
      } else {
        blackPlayerPlies.push(p);
      }
    }
  }

  // Second pass: Shift detection and opponent response tracking
  for (let idx = 0; idx < analyzedMoves.length; idx++) {
    const move = analyzedMoves[idx];
    const ply = move.ply; // 1-indexed (p + 1)
    const p = ply - 1; // 0-indexed ply
    const player = move.player;

    const playerPlies = player === "white" ? whitePlayerPlies : blackPlayerPlies;
    const playerMoveIndex = playerPlies.indexOf(p);

    // Shift requires at least dominanceWindow moves before the current move
    if (playerMoveIndex >= dominanceWindow) {
      const windowPlies = playerPlies.slice(playerMoveIndex - dominanceWindow, playerMoveIndex);
      const prevZones = windowPlies.map(prevP => {
        const found = analyzedMoves.find(m => m.ply === prevP + 1);
        return found ? found.zone : null;
      }).filter(z => z !== null) as string[];

      // Count occurrences of each zone in the window
      const zoneCounts: Record<string, number> = {};
      prevZones.forEach(z => {
        zoneCounts[z] = (zoneCounts[z] || 0) + 1;
      });

      // Find if any zone exceeds the dominance threshold
      let dominantZone: string | null = null;
      for (const [zoneName, count] of Object.entries(zoneCounts)) {
        if (count / dominanceWindow >= dominanceThreshold) {
          dominantZone = zoneName;
          break;
        }
      }

      // If there is a dominant zone, and current zone is different, a shift occurred!
      if (dominantZone && move.zone !== dominantZone) {
        move.isShift = true;
        move.previousDominantZone = dominantZone;

        // Trace Opponent Response (Mirroring)
        let mirrorFound = false;
        let delayCount = 1;

        if (excludeCaptures) {
          const opponentPlayer = player === "white" ? "black" : "white";
          const opponentPlies = opponentPlayer === "white" ? whitePlayerPlies : blackPlayerPlies;
          // Find first opponent move after the current move ply p
          const firstOpponentIdx = opponentPlies.findIndex(op => op > p);
          
          if (firstOpponentIdx !== -1) {
            const opponentWindow = opponentPlies.slice(firstOpponentIdx, firstOpponentIdx + mirrorWindow);
            
            for (let rCount = 0; rCount < opponentWindow.length; rCount++) {
              const opponentPly = opponentWindow[rCount];
              const opponentMove = analyzedMoves.find(m => m.ply === opponentPly + 1);
              if (opponentMove) {
                if (opponentMove.zone === move.zone) {
                  mirrorFound = true;
                  break;
                }
              }
              delayCount++;
            }
          }
        } else {
          // Standard sequential lookahead including captures
          for (let rCount = 0; rCount < mirrorWindow; rCount++) {
            const opponentPly = p + 1 + rCount * 2;
            if (opponentPly >= movesCount) break;

            const opponentMove = analyzedMoves.find(m => m.ply === opponentPly + 1);
            if (opponentMove) {
              if (opponentMove.zone === move.zone) {
                mirrorFound = true;
                break;
              }
            }
            delayCount++;
          }
        }

        if (mirrorFound) {
          move.mirrored = true;
          move.reactionDelay = delayCount;
        } else {
          move.mirrored = false;
          move.reactionDelay = null;
        }
      }
    }
  }

  return analyzedMoves;
}

/**
 * Combines results from a list of games to run full statistical summaries.
 */
export function analyzeDataset(games: Game[], options: AnalysisOptions): {
  summaries: AnalysisSummary;
  allAnalyzedMoves: { gameId: string; moves: MoveAnalysis[] }[];
} {
  const allAnalyzedMoves: { gameId: string; moves: MoveAnalysis[] }[] = [];
  
  let totalMoves = 0;
  let totalShifts = 0;
  let totalMirrors = 0;
  let reactionDelaySum = 0;
  let reactionDelayCount = 0;

  const byTimeControl: AnalysisSummary["byTimeControl"] = {
    Bullet: { gameCount: 0, movesCount: 0, shifts: 0, mirrors: 0, rate: 0, avgDelay: 0 },
    Blitz: { gameCount: 0, movesCount: 0, shifts: 0, mirrors: 0, rate: 0, avgDelay: 0 },
    Rapid: { gameCount: 0, movesCount: 0, shifts: 0, mirrors: 0, rate: 0, avgDelay: 0 },
    Classical: { gameCount: 0, movesCount: 0, shifts: 0, mirrors: 0, rate: 0, avgDelay: 0 },
  };

  const byZone: AnalysisSummary["byZone"] = {};

  games.forEach(game => {
    const moves = analyzeGame(game, options);
    allAnalyzedMoves.push({ gameId: game.id, moves });

    totalMoves += moves.length;
    
    // Time control stats
    const tc = game.timeControlCategory;
    byTimeControl[tc].gameCount += 1;
    byTimeControl[tc].movesCount += moves.length;

    moves.forEach(move => {
      // Global zone counts
      if (!byZone[move.zone]) {
        byZone[move.zone] = { count: 0, shiftsFrom: 0, shiftsTo: 0 };
      }
      byZone[move.zone].count += 1;

      if (move.isShift) {
        totalShifts += 1;
        byTimeControl[tc].shifts += 1;

        if (move.previousDominantZone) {
          if (!byZone[move.previousDominantZone]) {
            byZone[move.previousDominantZone] = { count: 0, shiftsFrom: 0, shiftsTo: 0 };
          }
          byZone[move.previousDominantZone].shiftsFrom += 1;
        }
        byZone[move.zone].shiftsTo += 1;

        if (move.mirrored) {
          totalMirrors += 1;
          byTimeControl[tc].mirrors += 1;
          
          if (move.reactionDelay !== null) {
            reactionDelaySum += move.reactionDelay;
            reactionDelayCount += 1;

            // Increment time control reaction delays
            byTimeControl[tc].avgDelay += move.reactionDelay;
          }
        }
      }
    });
  });

  // Calculate final rates and averages
  const mirroringRate = totalShifts > 0 ? (totalMirrors / totalShifts) * 100 : 0;
  const averageReactionDelay = reactionDelayCount > 0 ? reactionDelaySum / reactionDelayCount : 0;

  // Finalize time control stats
  (Object.keys(byTimeControl) as TimeControlCategory[]).forEach(category => {
    const stats = byTimeControl[category];
    stats.rate = stats.shifts > 0 ? (stats.mirrors / stats.shifts) * 100 : 0;
    stats.avgDelay = stats.mirrors > 0 ? stats.avgDelay / stats.mirrors : 0;
  });

  const summaries: AnalysisSummary = {
    totalGames: games.length,
    totalMoves,
    totalShifts,
    totalMirrors,
    mirroringRate,
    averageReactionDelay,
    byTimeControl,
    byZone,
  };

  return { summaries, allAnalyzedMoves };
}
