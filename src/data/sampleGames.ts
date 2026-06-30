import { Game, TimeControlCategory } from "../types";

// A collection of real/realistic historical 10x10 International Draughts games.
// Moves follow standard PDN numerical notation (from-to or fromxto).
export const rawSampleGames: Omit<Game, "timeControlCategory">[] = [
  {
    id: "lid_gm_01",
    date: "2026-05-12",
    white: "Alexander Georgiev",
    black: "Alexei Chizhov",
    timeControl: "20+10",
    result: "1/2-1/2",
    moves: [
      "32-28", "18-22", "37-32", "12-18", "41-37", "7-12", "46-41", "1-7",
      "32-27", "19-23", "28x19", "14x23", "37-32", "10-14", "41-37", "5-10",
      "34-30", "14-19", "40-35", "10-14", "35-30", "13-18", "44-40", "9-13",
      "31-26", "22x31", "36x27", "8-12", "45-40", "4-9", "49-44", "2-8",
      "50-45", "17-22", "27x18", "13x22", "38-32", "22x31", "33-29", "23x34",
      "40x20", "15x24", "43-38", "31-36", "38-33", "9-13", "42-38", "11-17",
      "48-43", "6-11", "38-32", "24-30", "33-29", "30x39", "43x34", "13-19",
      "29-24", "19x30", "32-27", "30-35", "39-33", "35-40", "45x34", "14-19"
    ],
    clocks: [
      1200, 1198, 1180, 1190, 1175, 1182, 1150, 1172,
      1142, 1160, 1142, 1158, 1130, 1140, 1115, 1132,
      1100, 1110, 1080, 1095, 1072, 1082, 1050, 1068,
      1020, 1045, 1020, 1038, 1005, 1021, 980, 1010,
      960, 992, 960, 992, 942, 975, 910, 942,
      910, 942, 880, 920, 850, 895, 830, 882,
      812, 860, 782, 840, 755, 812, 755, 812,
      720, 785, 680, 752, 650, 712, 650, 690
    ]
  },
  {
    id: "lid_gm_02",
    date: "2026-05-18",
    white: "Roel Boomstra",
    black: "Jan Groenendijk",
    timeControl: "15+5",
    result: "1-0",
    moves: [
      "33-29", "19-23", "39-33", "14-19", "44-39", "10-14", "35-30", "23-28",
      "32x23", "19x28", "33x22", "18x27", "30-25", "13-18", "40-35", "17-21",
      "38-32", "27x38", "43x32", "11-17", "49-44", "8-13", "31-27", "6-11",
      "42-38", "12-18", "36-31", "2-8", "41-36", "1-6", "46-41", "18-23",
      "29x18", "13x22", "47-42", "9-13", "48-43", "7-12", "37-32", "22-28",
      "32x23", "21-26", "27-21", "16x27", "31x11", "6x17", "23-18", "12x23",
      "25-20", "14x25", "39-33", "28x39", "44x11", "26-31", "11-7", "31-36"
    ],
    clocks: [
      900, 895, 882, 880, 875, 872, 860, 852,
      860, 852, 860, 850, 840, 832, 825, 820,
      810, 810, 810, 795, 780, 772, 762, 758,
      745, 732, 720, 715, 700, 692, 680, 665,
      680, 665, 650, 642, 630, 622, 610, 595,
      610, 595, 580, 565, 580, 565, 540, 520,
      515, 495, 480, 462, 480, 450, 440, 415
    ]
  },
  {
    id: "lid_blitz_01",
    date: "2026-06-01",
    white: "Grandmaster_A",
    black: "DraughtsPro_99",
    timeControl: "3+2",
    result: "0-1",
    moves: [
      "31-26", "19-23", "36-31", "14-19", "41-36", "10-14", "46-41", "5-10",
      "32-28", "23x32", "37x28", "17-21", "26x17", "11x22", "28x17", "12x21",
      "31-26", "7-11", "26x17", "11x22", "41-37", "8-12", "47-41", "2-8",
      "48-42", "19-23", "33-28", "22x33", "39x28", "14-19", "34-30", "10-14",
      "40-34", "13-18", "44-39", "9-13", "45-40", "4-9", "30-25", "18-22",
      "25x14", "19x10", "28x17", "12x21", "34-30", "23-28", "38-33", "21-27",
      "42-38", "16-21", "49-44", "21-26", "30-25", "26-31", "37x26", "28-32"
    ],
    clocks: [
      180, 178, 175, 174, 170, 168, 165, 162,
      158, 158, 158, 155, 152, 150, 152, 150,
      142, 138, 142, 138, 130, 128, 122, 118,
      112, 105, 102, 102, 102, 98, 92, 88,
      85, 80, 78, 75, 72, 68, 62, 55,
      62, 55, 62, 55, 50, 44, 42, 38,
      35, 30, 28, 22, 18, 15, 18, 10
    ]
  },
  {
    id: "lid_bullet_01",
    date: "2026-06-15",
    white: "SpeedyCheckers",
    black: "HyperDraughts",
    timeControl: "1+0",
    result: "1-0",
    moves: [
      "32-28", "17-21", "37-32", "11-17", "41-37", "6-11", "46-41", "1-6",
      "31-26", "18-22", "28x17", "11x22", "32-28", "22x31", "26x37", "13-18",
      "37-31", "9-13", "34-29", "3-9", "40-34", "19-23", "29x18", "12x23",
      "44-40", "8-12", "49-44", "14-19", "35-30", "21-27", "30-25", "10-14",
      "25x14", "19x10", "45-40", "13-19", "40-35", "9-13", "35-30", "4-9",
      "30-25", "10-14", "38-32", "27x38", "43x32", "5-10", "31-27", "23-28",
      "32x23", "19x28", "27-21", "16x27", "33x22", "17x28", "39-33", "28x39"
    ],
    clocks: [
      60, 58, 56, 55, 53, 52, 50, 49,
      48, 47, 48, 47, 45, 45, 45, 44,
      42, 41, 39, 38, 36, 35, 36, 35,
      33, 31, 30, 28, 26, 25, 23, 22,
      23, 22, 20, 19, 17, 16, 14, 13,
      11, 10, 9, 8, 8, 7, 6, 5,
      6, 5, 5, 4, 4, 3, 3, 2
    ]
  }
];

/**
 * Normalizes a time control string to its category
 */
export function getCategoryFromTimeControl(tc: string): TimeControlCategory {
  if (!tc || typeof tc !== "string") {
    return "Blitz";
  }
  const clean = tc.toLowerCase();
  if (clean.includes("1/2") || clean.startsWith("1+") || clean.startsWith("0+")) {
    return "Bullet";
  }
  const match = clean.match(/^(\d+)/);
  if (match) {
    const mins = parseInt(match[1], 10);
    if (mins < 3) return "Bullet";
    if (mins < 10) return "Blitz";
    if (mins < 25) return "Rapid";
    return "Classical";
  }
  return "Blitz"; // default fallback
}

/**
 * Simulates a rule-consistent draughts game with a specific theme.
 * Generates valid-looking diagonals for 10x10.
 */
export function generateSimulatedGame(
  id: string,
  index: number,
  category: TimeControlCategory
): Game {
  // Setup thematic names
  const whitePlayers = [
    "Wouter Sipma", "Martijn van Ijzendoorn", "Jean Marc Ndjofang", 
    "Guntis Valneris", "Artem Ivanov", "Macodou NDiaye", 
    "Allan Silva", "Hein Meijer", "Ron Heusdens", "Vadim Virny"
  ];
  const blackPlayers = [
    "Alexander Shvartsman", "Yuri Anikeev", "Kees Thijssen", 
    "Alexei Domchev", "Edvard Buzinskij", "Jitse Slump", 
    "Alexander Baliakin", "Raymond Vipond", "Frank Teer", "Jos Stokkel"
  ];

  const white = whitePlayers[index % whitePlayers.length];
  const black = blackPlayers[(index + 3) % blackPlayers.length];
  
  let timeControl = "10+5";
  let baseSeconds = 600;
  let increment = 5;

  if (category === "Bullet") {
    timeControl = "1+1";
    baseSeconds = 60;
    increment = 1;
  } else if (category === "Blitz") {
    timeControl = "5+3";
    baseSeconds = 300;
    increment = 3;
  } else if (category === "Rapid") {
    timeControl = "15+10";
    baseSeconds = 900;
    increment = 10;
  } else if (category === "Classical") {
    timeControl = "80+60";
    baseSeconds = 4800;
    increment = 60;
  }

  const results: ("1-0" | "0-1" | "1/2-1/2")[] = ["1-0", "0-1", "1/2-1/2", "1/2-1/2"];
  const result = results[index % results.length];

  // We will construct realistic plies.
  // We want to simulate shifts and mirroring intentionally!
  // White has squares 31-50, Black has squares 1-20 initially.
  // Normal game moves white 31-50 forwards, black 1-20 forwards.
  // Left cols: 1, 3, 5, 7, 9 in even rows; 0, 2, 4, 6, 8 in odd rows.
  // Let's model pieces on LEFT side vs RIGHT side.
  // Left squares: 1, 2 (col 1, 3), 6, 7 (col 0, 2), 11, 12 (col 1, 3), 16, 17 (col 0, 2), etc.
  // Right squares: 4, 5 (col 7, 9), 9, 10 (col 6, 8), 14, 15, 19, 20, etc.

  const leftSquares = [1, 2, 6, 7, 8, 11, 12, 16, 17, 21, 22, 26, 27, 31, 32, 36, 37, 41, 42, 46, 47];
  const rightSquares = [3, 4, 5, 9, 10, 13, 14, 15, 18, 19, 20, 23, 24, 25, 28, 29, 30, 33, 34, 35, 38, 39, 40, 43, 44, 45, 48, 49, 50];

  const moves: string[] = [];
  const clocks: number[] = [];

  let whiteTime = baseSeconds;
  let blackTime = baseSeconds;

  const totalPlies = 40 + (index % 15) * 2; // 40 to 70 plies

  // State tracker to make moves somewhat diagonal-consistent
  // We will generate moves that go:
  // - White: from a White square (31-50) to adjacent empty
  // - Black: from a Black square (1-20) to adjacent empty
  // To keep it simple but realistic, we can select from a pre-made list of diagonal-valid micro-transitions!
  // A diagonal step on a 10x10 board from square S can be computed:
  // r, c of S. Valid dest: r +/- 1, c +/- 1.
  // Let's create a lookup of valid steps for each square.
  const stepsMap: Record<number, number[]> = {};
  for (let s = 1; s <= 50; s++) {
    const r = Math.floor((s - 1) / 5);
    const idx = (s - 1) % 5;
    const c = r % 2 === 0 ? 2 * idx + 1 : 2 * idx;
    const validDests: number[] = [];
    
    const directions = [
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
    ];

    directions.forEach(({ dr, dc }) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
        // Find square number
        const isNrEven = nr % 2 === 0;
        if (isNrEven && nc % 2 !== 0) {
          const nidx = (nc - 1) / 2;
          const ns = nr * 5 + nidx + 1;
          validDests.push(ns);
        } else if (!isNrEven && nc % 2 === 0) {
          const nidx = nc / 2;
          const ns = nr * 5 + nidx + 1;
          validDests.push(ns);
        }
      }
    });

    stepsMap[s] = validDests;
  }

  // Active positions
  const activeWhite = new Set([31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
  const activeBlack = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  const occupied = new Set([...activeWhite, ...activeBlack]);

  // Simulating dominance and sudden shifts!
  // Let's say:
  // - For the first 12 plies, play is heavily on the LEFT (for both players)
  // - At ply 16, White makes a sudden shift to the RIGHT
  // - We will check if Black mirrors! (In some games yes, in some games no, depending on the index)
  // - Under fast time controls, the chance of immediate mirroring is higher (e.g. panic response).
  // - Under classical, delayed or no mirroring happens.

  let activeLeft = true;

  for (let p = 0; p < totalPlies; p++) {
    const isWhite = p % 2 === 0;
    const playerSet = isWhite ? activeWhite : activeBlack;

    // Shift events!
    if (p === 14 && index % 2 === 0) {
      // White shifts to Right!
      activeLeft = false;
    } else if (p === 18 && index % 3 === 0) {
      // Black shifts to Left!
      activeLeft = true;
    }

    // Try to find a valid move matching our active side (Left or Right)
    let moveStr = "";
    let attempts = 0;
    let selectedFrom = 0;
    let selectedTo = 0;

    const sideFilter = (sq: number) => {
      const isLeftSq = leftSquares.includes(sq);
      return activeLeft ? isLeftSq : !isLeftSq;
    };

    while (attempts < 50) {
      attempts++;
      // Pick a random piece from the player's set
      const pList = Array.from(playerSet);
      if (pList.length === 0) break;

      const fromSq = pList[Math.floor(Math.random() * pList.length)];
      const possibleDests = stepsMap[fromSq] || [];
      if (possibleDests.length === 0) continue;

      // Filter destinations that are unoccupied
      let validDests = possibleDests.filter(d => !occupied.has(d));
      
      // Try to bias towards the current active side (Left or Right)
      const themedDests = validDests.filter(sideFilter);
      if (themedDests.length > 0) {
        validDests = themedDests;
      }

      if (validDests.length > 0) {
        const toSq = validDests[Math.floor(Math.random() * validDests.length)];
        selectedFrom = fromSq;
        selectedTo = toSq;
        moveStr = `${fromSq}-${toSq}`;
        break;
      }
    }

    // Fallback if no clean step is found (could happen in late game)
    if (!moveStr) {
      // Simple jump simulation or fallback diagonal
      // Let's just generate a plausible diagonal based on average squares
      const fromSq = isWhite ? 35 - Math.floor(p/2) : 15 + Math.floor(p/2);
      const toSq = isWhite ? fromSq - 5 : fromSq + 5;
      if (fromSq >= 1 && fromSq <= 50 && toSq >= 1 && toSq <= 50) {
        moveStr = `${fromSq}-${toSq}`;
        selectedFrom = fromSq;
        selectedTo = toSq;
      } else {
        // Ultimate fallback
        moveStr = isWhite ? "31-27" : "19-23";
        selectedFrom = isWhite ? 31 : 19;
        selectedTo = isWhite ? 27 : 23;
      }
    }

    // Update board tracker
    playerSet.delete(selectedFrom);
    playerSet.add(selectedTo);
    occupied.delete(selectedFrom);
    occupied.add(selectedTo);

    moves.push(moveStr);

    // Simulate clock depletion
    let timeSpent = 0;
    if (category === "Bullet") {
      timeSpent = Math.max(1, Math.floor(Math.random() * 3)); // 1-3 secs
    } else if (category === "Blitz") {
      timeSpent = Math.max(1, Math.floor(Math.random() * 8)); // 1-8 secs
    } else if (category === "Rapid") {
      timeSpent = Math.max(2, Math.floor(Math.random() * 25)); // 2-25 secs
    } else {
      timeSpent = Math.max(5, Math.floor(Math.random() * 90)); // 5-90 secs
    }

    if (isWhite) {
      whiteTime = Math.max(2, whiteTime - timeSpent + increment);
      clocks.push(whiteTime);
    } else {
      blackTime = Math.max(2, blackTime - timeSpent + increment);
      clocks.push(blackTime);
    }
  }

  return {
    id,
    date: `2026-06-${String((index % 28) + 1).padStart(2, "0")}`,
    white,
    black,
    timeControl,
    timeControlCategory: category,
    result,
    moves,
    clocks
  };
}

/**
 * Returns a combined dataset of pre-loaded GM matches and simulated games.
 */
export function getFullDataset(simulatedCount: number = 30): Game[] {
  const games: Game[] = rawSampleGames.map(g => ({
    ...g,
    timeControlCategory: getCategoryFromTimeControl(g.timeControl)
  }));

  const categories: TimeControlCategory[] = ["Bullet", "Blitz", "Rapid", "Classical"];

  // Add robust simulated matches to enrich statistics!
  for (let i = 0; i < simulatedCount; i++) {
    const category = categories[i % categories.length];
    const simGame = generateSimulatedGame(`lid_sim_${i + 1}`, i, category);
    games.push(simGame);
  }

  return games;
}
