import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper: Fetch games from Lidraughts API
async function fetchLidraughtsUserGames(username: string, max: number = 15): Promise<any[]> {
  const url = `https://lidraughts.org/api/games/user/${encodeURIComponent(username)}?max=${max}&moves=true&clocks=true&perfType=international`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/x-ndjson",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch games from Lidraughts: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.trim().split("\n").filter(line => line.trim() !== "");
  
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  }).filter(game => game !== null);
}

// Helper: Fetch single game from Lidraughts API
async function fetchLidraughtsGame(gameId: string): Promise<any> {
  const url = `https://lidraughts.org/api/game/export/${encodeURIComponent(gameId)}?moves=true&clocks=true`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch game ${gameId} from Lidraughts: ${response.statusText}`);
  }

  return await response.json();
}

// --- API ROUTES ---

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Proxy Lidraughts User Games
app.get("/api/lidraughts/user/:username", async (req, res) => {
  const { username } = req.params;
  const max = parseInt(req.query.max as string || "15", 10);

  try {
    const rawGames = await fetchLidraughtsUserGames(username, max);
    
    // Map raw Lidraughts NDJSON structures to our clean Game interface
    const formattedGames = rawGames.map((rg: any) => {
      // Map winner or result
      let result: "1-0" | "0-1" | "1/2-1/2" | "*" = "*";
      if (rg.status === "draw") {
        result = "1/2-1/2";
      } else if (rg.winner === "white") {
        result = "1-0";
      } else if (rg.winner === "black") {
        result = "0-1";
      }

      const moveString = rg.moves || "";
      const moves = moveString.split(" ").filter((m: string) => m.trim() !== "");

      // Normalize clocks (Lidraughts clocks are in centiseconds, divide by 100)
      const clocks = rg.clocks ? rg.clocks.map((c: number) => Math.round(c / 100)) : undefined;

      return {
        id: rg.id,
        date: rg.createdAt ? new Date(rg.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        white: rg.players?.white?.user?.name || "Anonymous White",
        black: rg.players?.black?.user?.name || "Anonymous Black",
        timeControl: rg.clock ? `${Math.round(rg.clock.initial / 60)}+${rg.clock.increment}` : "unlimited",
        moves,
        clocks,
        result
      };
    });

    res.json({ success: true, games: formattedGames });
  } catch (error: any) {
    console.error("Lidraughts Proxy Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch from Lidraughts" });
  }
});

// 3. Proxy Lidraughts Single Game
app.get("/api/lidraughts/game/:gameId", async (req, res) => {
  const { gameId } = req.params;

  try {
    const rg = await fetchLidraughtsGame(gameId);

    let result: "1-0" | "0-1" | "1/2-1/2" | "*" = "*";
    if (rg.status === "draw") {
      result = "1/2-1/2";
    } else if (rg.winner === "white") {
      result = "1-0";
    } else if (rg.winner === "black") {
      result = "0-1";
    }

    const moveString = rg.moves || "";
    const moves = moveString.split(" ").filter((m: string) => m.trim() !== "");
    const clocks = rg.clocks ? rg.clocks.map((c: number) => Math.round(c / 100)) : undefined;

    const game = {
      id: rg.id,
      date: rg.createdAt ? new Date(rg.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      white: rg.players?.white?.user?.name || "Anonymous White",
      black: rg.players?.black?.user?.name || "Anonymous Black",
      timeControl: rg.clock ? `${Math.round(rg.clock.initial / 60)}+${rg.clock.increment}` : "unlimited",
      moves,
      clocks,
      result
    };

    res.json({ success: true, game });
  } catch (error: any) {
    console.error("Single Game Proxy Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch single game" });
  }
});

// 4. Gemini Academic Report Generator
app.post("/api/gemini/report", async (req, res) => {
  const { summaries, zoningMethod, params } = req.body;

  if (!summaries) {
    return res.status(400).json({ success: false, error: "Missing summaries data" });
  }

  // Create formatted context from stats
  const formattedTC = Object.entries(summaries.byTimeControl || {})
    .map(([category, stats]: any) => {
      return `- **${category}**: ${stats.gameCount} games, ${stats.shifts} shifts, ${stats.mirrors} mirroring responses (${stats.rate.toFixed(1)}% rate), Avg reaction delay of ${stats.avgDelay.toFixed(1)} opponent moves.`;
    })
    .join("\n");

  const excludeCapturesStatus = params.excludeCaptures 
    ? "Enabled (All mandatory capture/jump moves are filtered out to isolate pure voluntary choice/instinct)" 
    : "Disabled (All moves, including forced captures, are included in the analysis)";

  const prompt = `
Write a formal, comprehensive Academic Research Paper analyzing whether playing position changes (shifts) influence opponent response in Liddraft checkers games.

Here is the exact empirical dataset analysis summary from our checkers/draughts research:
- Spatial Zoning Methodology: ${zoningMethod} (We map draughts square positions into custom board regions)
- Total Games Analyzed: ${summaries.totalGames}
- Total Move Transitions: ${summaries.totalMoves}
- Total Positional Shifts Detected: ${summaries.totalShifts} (A player suddenly switching the playing side after establishing a pattern of play)
- Total Opponent Mirroring Responses: ${summaries.totalMirrors} (The opponent following the shift and playing in the same new zone)
- Empirical Mirroring Rate: ${summaries.mirroringRate.toFixed(2)}%
- Empirical Average Reaction Delay: ${summaries.averageReactionDelay.toFixed(2)} moves
- Sliding Dominance Window: Last ${params.dominanceWindow} moves of the same player
- Mirroring Capture Window: Next ${params.mirrorWindow} opponent moves
- Mandatory Jump Filtering (Behavioral Instinct Isolation): ${excludeCapturesStatus}
- Research Null Hypothesis (H0): A player's position shift has no measurable effect on the opponent's next move patterns (i.e. the opponent's mirroring rate is no different from baseline/random choice).
- Research Alternative Hypothesis (H1): A player's position shift significantly increases the likelihood that the opponent will also shift play toward that same zone (mirroring).

Time Control Breakdown (Testing the Time Pressure Effect):
${formattedTC}

Structure the paper professionally with the following standard sections:
1. Title (Include a bold, scholarly academic title)
2. Abstract (Summarize the research objective, methodology, key quantitative results, statistical conclusion on the Null Hypothesis, and implications)
3. Introduction (Contextualize draughts/checkers spatial dynamics, playing styles, and why playing position shifts are tactically significant)
4. Methodology (Explain how the 10x10 board coordinates are mapped, details of the ${zoningMethod} zoning method, the mathematical parameters of the sliding window, the response tracking, and how filtering out mandatory jumps ensures we only analyze free-choice behavioral instinct instead of forced responses.)
5. Results (Present the findings clearly, discussing the "Time Pressure Effect" - compare faster time controls like Bullet and Blitz vs slower ones like Rapid and Classical. Reference our exact numbers)
6. Discussion (Interpret the psychological and tactical reasons behind opponent mirroring: attention hijacking, local defensive urgency, and lack of calculation time under high pressure. Highlight the critical methodological importance of filtering out forced/mandatory jumps, explaining how inclusion of mandatory jumps would inject severe game-theoretic noise and skew true psychological mirroring rates.)
7. Conclusion & Future Work (Summarize the main contribution and suggest future research paths, e.g. multi-quadrant modeling, neural network modeling of shift predictions)

Maintain a highly rigorous, scholarly, objective academic tone. Use Markdown formatting. Do not include any meta-text, salutations, or pleasantries. Return only the paper.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const reportMarkdown = response.text || "Failed to generate report text.";
    res.json({ success: true, report: reportMarkdown });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate academic report" });
  }
});

// --- VITE MIDDLEWARE AND PRODUCTION STATIC SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
