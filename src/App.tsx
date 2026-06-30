import React, { useState, useMemo } from "react";
import { 
  Database, 
  Search, 
  Sliders, 
  BookOpen, 
  BarChart2, 
  Layers, 
  Clock, 
  AlertCircle, 
  Download, 
  FileCode, 
  Info, 
  Loader2,
  ListFilter
} from "lucide-react";
import { getFullDataset, getCategoryFromTimeControl } from "./data/sampleGames";
import { analyzeDataset, AnalysisOptions } from "./utils/analysis";
import { Game, ZoningMethod, TimeControlCategory } from "./types";
import BoardViewer from "./components/BoardViewer";
import Dashboard from "./components/Dashboard";
import ReportView from "./components/ReportView";

export default function App() {
  // Research parameters
  const [zoningMethod, setZoningMethod] = useState<ZoningMethod>("vertical");
  const [dominanceWindow, setDominanceWindow] = useState<number>(3);
  const [dominanceThreshold, setDominanceThreshold] = useState<number>(1.0); // 1.0 = strict dominance
  const [mirrorWindow, setMirrorWindow] = useState<number>(2);
  const [excludeCaptures, setExcludeCaptures] = useState<boolean>(true);

  // Active dataset state
  const [simulatedCount, setSimulatedCount] = useState<number>(15);
  const [customGames, setCustomGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer" | "report">("dashboard");

  // Fetch from Lidraughts API state
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [gameIdInput, setGameIdInput] = useState<string>("");
  const [pdnInput, setPdnInput] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  
  // Custom PDN modal or panel state
  const [showPdnTextarea, setShowPdnTextarea] = useState<boolean>(false);

  // Memoized dataset compilation (merges raw preset games + simulated games + fetched custom games)
  const gamesDataset = useMemo(() => {
    // If we have custom games (fetched or pasted), we analyze those exclusively or prefix them
    if (customGames.length > 0) {
      return customGames;
    }
    // Otherwise fallback to pre-loaded dataset
    return getFullDataset(simulatedCount);
  }, [simulatedCount, customGames]);

  // Run full analysis on the active dataset
  const analysisOptions: AnalysisOptions = useMemo(() => ({
    zoningMethod,
    dominanceWindow,
    dominanceThreshold,
    mirrorWindow,
    excludeCaptures,
  }), [zoningMethod, dominanceWindow, dominanceThreshold, mirrorWindow, excludeCaptures]);

  const { summaries, allAnalyzedMoves } = useMemo(() => {
    return analyzeDataset(gamesDataset, analysisOptions);
  }, [gamesDataset, analysisOptions]);

  // Game selection state for the interactive explorer
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  
  const activeGame = useMemo(() => {
    if (gamesDataset.length === 0) return null;
    const found = gamesDataset.find(g => g.id === selectedGameId);
    return found || gamesDataset[0];
  }, [gamesDataset, selectedGameId]);

  const activeGameMovesAnalysis = useMemo(() => {
    if (!activeGame) return [];
    const foundAnalysis = allAnalyzedMoves.find(a => a.gameId === activeGame.id);
    return foundAnalysis ? foundAnalysis.moves : [];
  }, [activeGame, allAnalyzedMoves]);

  // Reset custom games to preloaded cohort
  const handleResetToPreloaded = () => {
    setCustomGames([]);
    setApiError(null);
    setUsernameInput("");
    setGameIdInput("");
  };

  // FETCH GAMES FOR A USER (Real Lidraughts API proxy call)
  const handleFetchUserGames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setApiLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`/api/lidraughts/user/${encodeURIComponent(usernameInput.trim())}?max=15`);
      const data = await response.json();

      if (data.success && data.games && data.games.length > 0) {
        // Map time control category
        const gamesWithCategory = data.games.map((g: any) => ({
          ...g,
          timeControlCategory: getCategoryFromTimeControl(g.timeControl)
        }));
        setCustomGames(gamesWithCategory);
        setSelectedGameId(gamesWithCategory[0].id);
        setActiveTab("dashboard");
      } else {
        setApiError(data.error || `No recent International Draughts games found for user "${usernameInput}".`);
      }
    } catch (err: any) {
      setApiError(`Failed to fetch: ${err.message || "Network error"}`);
    } finally {
      setApiLoading(false);
    }
  };

  // FETCH SPECIFIC GAME BY ID (Real Lidraughts API proxy call)
  const handleFetchSingleGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameIdInput.trim()) return;

    setApiLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`/api/lidraughts/game/${encodeURIComponent(gameIdInput.trim())}`);
      const data = await response.json();

      if (data.success && data.game) {
        const gameWithCategory = {
          ...data.game,
          timeControlCategory: getCategoryFromTimeControl(data.game.timeControl)
        };
        setCustomGames([gameWithCategory]);
        setSelectedGameId(gameWithCategory.id);
        setActiveTab("explorer");
      } else {
        setApiError(data.error || `Could not retrieve Lidraughts match ID "${gameIdInput}".`);
      }
    } catch (err: any) {
      setApiError(`Failed to fetch: ${err.message || "Network error"}`);
    } finally {
      setApiLoading(false);
    }
  };

  // PARSE CUSTOM PDN TEXT INPUT
  const handleParsePdn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdnInput.trim()) return;

    try {
      // Very basic robust PDN move list extraction
      // Extracts sequences like "32-28", "28x19" or numbers separated by - / x
      const moveRegex = /\d+[-x]\d+(?:[-x]\d+)*/g;
      const moves = pdnInput.match(moveRegex) || [];

      if (moves.length === 0) {
        throw new Error("No readable draughts moves found. Make sure moves are in 'from-to' or 'fromxto' format (e.g. 32-28, 28x19).");
      }

      const parsedGame: Game = {
        id: `custom_pdn_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        white: "Researcher White",
        black: "Researcher Black",
        timeControl: "unlimited",
        timeControlCategory: "Classical",
        result: "*",
        moves: moves,
      };

      setCustomGames([parsedGame]);
      setSelectedGameId(parsedGame.id);
      setShowPdnTextarea(false);
      setPdnInput("");
      setApiError(null);
      setActiveTab("explorer");
    } catch (err: any) {
      setApiError(err.message || "Failed to parse PDN text.");
    }
  };

  return (
    <div id="liddraft-analyzer-root" className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      
      {/* Top Professional Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm px-6 py-4 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 rounded-lg text-white font-mono font-bold text-xs shadow-inner">LID</span>
              <h1 className="text-lg font-bold tracking-tight">Liddraft Position Shift Analyzer</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-medium">
              Objective: Analyzing whether sudden playing position changes influence opponent response in Liddraft checkers games.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded text-slate-300">
              Active Cohort: <b>{gamesDataset.length}</b> games
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Research Controls (1 Column) */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          
          {/* Section 1: Data Acquisition Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Data Acquisition</h2>
            </div>

            {/* Fetch User Recent Games */}
            <form onSubmit={handleFetchUserGames} className="flex flex-col gap-1.5">
              <label htmlFor="user-games-input" className="text-[10px] font-bold text-slate-400 uppercase">Lidraughts Username</label>
              <div className="flex gap-2">
                <input
                  id="user-games-input"
                  type="text"
                  placeholder="e.g. ianfab"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
                />
                <button
                  id="fetch-user-btn"
                  type="submit"
                  disabled={apiLoading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition shrink-0 flex items-center justify-center disabled:opacity-40"
                >
                  {apiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>

            {/* Fetch Specific Game ID */}
            <form onSubmit={handleFetchSingleGame} className="flex flex-col gap-1.5">
              <label htmlFor="game-id-input" className="text-[10px] font-bold text-slate-400 uppercase">Lidraughts Match ID</label>
              <div className="flex gap-2">
                <input
                  id="game-id-input"
                  type="text"
                  placeholder="e.g. gD7AunXw"
                  value={gameIdInput}
                  onChange={(e) => setGameIdInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
                />
                <button
                  id="fetch-game-btn"
                  type="submit"
                  disabled={apiLoading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition shrink-0 flex items-center justify-center disabled:opacity-40"
                >
                  {apiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>

            {/* Toggle PDN Pasting */}
            <div>
              <button
                id="toggle-pdn-btn"
                onClick={() => setShowPdnTextarea(!showPdnTextarea)}
                className="w-full py-1.5 border border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-600 transition flex items-center justify-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5" /> Paste Custom PDN
              </button>

              {showPdnTextarea && (
                <form onSubmit={handleParsePdn} className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                  <textarea
                    id="pdn-textarea"
                    placeholder="Paste game moves e.g.: 1. 32-28 18-22 2. 37-32 12-18..."
                    value={pdnInput}
                    onChange={(e) => setPdnInput(e.target.value)}
                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
                  />
                  <div className="flex gap-2">
                    <button
                      id="parse-pdn-btn"
                      type="submit"
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition"
                    >
                      Parse Moves
                    </button>
                    <button
                      id="cancel-pdn-btn"
                      type="button"
                      onClick={() => setShowPdnTextarea(false)}
                      className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Simulated Dataset Count Loader */}
            {customGames.length === 0 && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="simulated-count-select" className="text-[10px] font-bold text-slate-400 uppercase">Pre-loaded Dataset Size</label>
                <select
                  id="simulated-count-select"
                  value={simulatedCount}
                  onChange={(e) => setSimulatedCount(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition cursor-pointer"
                >
                  <option value={5}>Minimal Sample (5 games)</option>
                  <option value={15}>Default Cohort (15 games)</option>
                  <option value={50}>Enriched Collection (50 games)</option>
                  <option value={100}>Grand Dataset Run (100 games)</option>
                </select>
              </div>
            )}

            {/* Error notifications */}
            {apiError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-start gap-1.5 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Reset custom dataset button */}
            {customGames.length > 0 && (
              <button
                id="reset-dataset-btn"
                onClick={handleResetToPreloaded}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Reset to Pre-loaded Cohort
              </button>
            )}

          </div>

          {/* Section 2: Mathematical Research Parameters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Research Parameters</h2>
            </div>

            {/* Zoning Methodology Selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="zoning-method-select" className="text-[10px] font-bold text-slate-400 uppercase">Zoning Methodology</label>
              <select
                id="zoning-method-select"
                value={zoningMethod}
                onChange={(e) => setZoningMethod(e.target.value as ZoningMethod)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition cursor-pointer"
              >
                <option value="vertical">Vertical (Left / Right Half)</option>
                <option value="quadrants">Four Quadrants (Top-Left, etc)</option>
                <option value="centerEdge">Center vs. Edge Zones</option>
                <option value="attackDefense">Attack vs. Defense (Relative)</option>
              </select>
            </div>

            {/* Sliding Dominance Window */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <label htmlFor="dominance-window-slider" className="text-slate-400">Dominance Window</label>
                <span className="text-slate-600 font-mono">{dominanceWindow} moves</span>
              </div>
              <input
                id="dominance-window-slider"
                type="range"
                min="2"
                max="7"
                value={dominanceWindow}
                onChange={(e) => setDominanceWindow(parseInt(e.target.value, 10))}
                className="h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
              <span className="text-[9px] text-slate-400 leading-relaxed mt-0.5">
                Number of previous moves tracked to establish a player's spatial pattern.
              </span>
            </div>

            {/* Strictness threshold */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dominance-threshold-select" className="text-[10px] font-bold text-slate-400 uppercase">Dominance Strictness</label>
              <select
                id="dominance-threshold-select"
                value={dominanceThreshold}
                onChange={(e) => setDominanceThreshold(parseFloat(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition cursor-pointer"
              >
                <option value={1.0}>Strict (100% in same zone)</option>
                <option value={0.7}>Majority (70% or more)</option>
                <option value={0.5}>Plurality (50% or more)</option>
              </select>
            </div>

            {/* Mirroring response window */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <label htmlFor="mirror-window-slider" className="text-slate-400">Response Capture Window</label>
                <span className="text-slate-600 font-mono">{mirrorWindow} moves</span>
              </div>
              <input
                id="mirror-window-slider"
                type="range"
                min="1"
                max="5"
                value={mirrorWindow}
                onChange={(e) => setMirrorWindow(parseInt(e.target.value, 10))}
                className="h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
              <span className="text-[9px] text-slate-400 leading-relaxed mt-0.5">
                Moves allowed for opponent to mirror the shift before registering as "ignored".
              </span>
            </div>

            {/* Exclude Mandatory Jumps (Captures) */}
            <div className="flex items-start gap-2.5 pt-3.5 border-t border-slate-100">
              <input
                id="exclude-captures-checkbox"
                type="checkbox"
                checked={excludeCaptures}
                onChange={(e) => setExcludeCaptures(e.target.checked)}
                className="w-4 h-4 mt-0.5 border-slate-300 rounded text-slate-800 focus:ring-slate-500 cursor-pointer accent-slate-800"
              />
              <div className="flex flex-col gap-0.5 select-none">
                <label htmlFor="exclude-captures-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Exclude Mandatory Jumps
                </label>
                <span className="text-[9px] text-slate-400 leading-relaxed">
                  Ignore forced captures to ensure shifts and mirroring represent true free-choice behavioral instinct.
                </span>
              </div>
            </div>

          </div>

          {/* Theoretical explanation note */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2 text-slate-500 text-xs leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <div>
              <span className="font-bold text-slate-600 block">Definition of Shift & Mirror</span>
              A <b>Positional Shift</b> occurs when a player's previous window of moves has been strictly concentrated in Zone A, but their current move lands in Zone B. 
              <br className="mb-1" />
              An <b>Opponent Mirror</b> is triggered when the opponent's subsequent moves land in Zone B within the response capture window.
            </div>
          </div>

        </div>

        {/* Right Side: Main Workstation Tab Panels (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Tab Selection Ribbon */}
          <div className="bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm flex gap-2">
            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === "dashboard"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Empirical Dashboard
            </button>
            <button
              id="tab-explorer-btn"
              onClick={() => setActiveTab("explorer")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === "explorer"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4" /> Game Board Explorer
            </button>
            <button
              id="tab-report-btn"
              onClick={() => setActiveTab("report")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === "report"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Compiled Scholarly Paper
            </button>
          </div>

          {/* TAB 1: EMPIRICAL DASHBOARD */}
          {activeTab === "dashboard" && (
            <Dashboard
              summaries={summaries}
              zoningMethod={zoningMethod}
              dominanceWindow={dominanceWindow}
            />
          )}

          {/* TAB 2: GAME BOARD EXPLORER */}
          {activeTab === "explorer" && (
            <div id="explorer-view-container" className="flex flex-col gap-6">
              
              {/* Game selection bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Game Selection</span>
                </div>
                <select
                  id="active-game-select"
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none cursor-pointer min-w-[240px]"
                >
                  {gamesDataset.map((g, index) => (
                    <option key={g.id} value={g.id}>
                      {index + 1}. {g.white} vs. {g.black} ({g.timeControl}, {g.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Board Viewer Component */}
              {activeGame ? (
                <BoardViewer
                  gameId={activeGame.id}
                  whitePlayer={activeGame.white}
                  blackPlayer={activeGame.black}
                  moves={activeGame.moves}
                  analyzedMoves={activeGameMovesAnalysis}
                  zoningMethod={zoningMethod}
                />
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm italic text-slate-400">
                  Select a game from the active dataset.
                </div>
              )}

            </div>
          )}

          {/* TAB 3: ACADEMIC REPORT */}
          {activeTab === "report" && (
            <ReportView
              summaries={summaries}
              zoningMethod={zoningMethod}
              dominanceWindow={dominanceWindow}
              mirrorWindow={mirrorWindow}
              excludeCaptures={excludeCaptures}
            />
          )}

        </div>

      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-100 px-6 py-4 mt-auto text-center text-xs text-slate-400 font-mono">
        Liddraft Position Shift Research Portal &bull; Academic Workspace &bull; UTC: 2026-06-30
      </footer>

    </div>
  );
}
