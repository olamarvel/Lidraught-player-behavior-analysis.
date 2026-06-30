import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Crown } from "lucide-react";
import { BoardState, getBoardStateAtPly, getCapturedSquare, parseMovePath, squareToCoords } from "../utils/board";
import { MoveAnalysis, ZoningMethod } from "../types";

interface BoardViewerProps {
  gameId: string;
  whitePlayer: string;
  blackPlayer: string;
  moves: string[];
  analyzedMoves: MoveAnalysis[];
  zoningMethod: ZoningMethod;
}

export default function BoardViewer({
  gameId,
  whitePlayer,
  blackPlayer,
  moves,
  analyzedMoves,
  zoningMethod,
}: BoardViewerProps) {
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset ply when game changes
  useEffect(() => {
    setCurrentPly(0);
    setIsPlaying(false);
  }, [gameId]);

  // Autoplay handler
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentPly((prev) => {
          if (prev >= moves.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000); // 1 second per move
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, moves.length]);

  const boardState: BoardState = getBoardStateAtPly(moves, currentPly);

  // Extract information about the active move (if any)
  const activeMoveAnalysis = currentPly > 0 ? analyzedMoves[currentPly - 1] : null;
  const activeMoveString = currentPly > 0 ? moves[currentPly - 1] : "";
  const { path: activePath, isCapture: activeIsCapture } = parseMovePath(activeMoveString);

  const startSq = activePath.length > 0 ? activePath[0] : null;
  const endSq = activePath.length > 0 ? activePath[activePath.length - 1] : null;

  // Find intermediate captured squares to highlight
  const capturedSquares = new Set<number>();
  if (activeIsCapture && activePath.length >= 2) {
    for (let i = 0; i < activePath.length - 1; i++) {
      const cap = getCapturedSquare(activePath[i], activePath[i + 1]);
      if (cap) capturedSquares.add(cap);
    }
  }

  // Determine background styling of a square based on ZoningMethod
  const getSquareZoneColor = (r: number, c: number) => {
    const isDark = (r + c) % 2 === 1;
    if (!isDark) return "bg-[#faf9f6]"; // Warm off-white for light squares

    switch (zoningMethod) {
      case "vertical":
        // Left (0-4) vs Right (5-9)
        return c <= 4
          ? "bg-slate-100/90 border-slate-200"
          : "bg-amber-50/70 border-amber-100/50";

      case "quadrants":
        if (r <= 4 && c <= 4) return "bg-blue-50/70 border-blue-100/50"; // Top-Left
        if (r <= 4 && c >= 5) return "bg-emerald-50/70 border-emerald-100/50"; // Top-Right
        if (r >= 5 && c <= 4) return "bg-indigo-50/70 border-indigo-100/50"; // Bottom-Left
        return "bg-rose-50/70 border-rose-100/50"; // Bottom-Right

      case "centerEdge":
        const isCenter = r >= 2 && r <= 7 && c >= 2 && c <= 7;
        return isCenter
          ? "bg-teal-50/80 border-teal-100/50"
          : "bg-zinc-100/80 border-zinc-200/50";

      case "attackDefense":
        // White plays bottom-up, Black plays top-down. Let's color-code from White's perspective
        return r <= 4
          ? "bg-rose-50/60 border-rose-100/50" // White Attack / Black Defense
          : "bg-slate-100/80 border-slate-200/50"; // White Defense / Black Attack

      default:
        return "bg-[#dfd3c3] border-[#c7b198]";
    }
  };

  const getSquareBorderClass = (s: number) => {
    if (s === startSq) return "ring-4 ring-yellow-400 ring-inset";
    if (s === endSq) return "ring-4 ring-orange-500 ring-inset";
    if (capturedSquares.has(s)) return "ring-4 ring-red-500 ring-inset";
    return "";
  };

  return (
    <div id="board-viewer-container" className="flex flex-col xl:flex-row gap-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Visual board layout */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 text-sm font-sans">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-stone-800 border border-stone-600 block shadow-inner"></span>
            <span className="font-semibold text-slate-800">{blackPlayer}</span>
          </div>
          <div className="bg-slate-100 font-mono text-xs px-2.5 py-1 rounded-full text-slate-600">
            Ply {currentPly} / {moves.length}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#fcfcf9] border border-slate-300 block shadow-sm"></span>
            <span className="font-semibold text-slate-800">{whitePlayer}</span>
          </div>
        </div>

        {/* 10x10 grid */}
        <div className="aspect-square w-full max-w-[480px] border-4 border-slate-800 bg-slate-800 rounded-lg overflow-hidden grid grid-cols-10 shadow-lg relative">
          {Array.from({ length: 10 }).map((_, r) =>
            Array.from({ length: 10 }).map((_, c) => {
              const isDark = (r + c) % 2 === 1;
              let squareNumber: number | null = null;
              
              if (isDark) {
                // Formula derived:
                const idx = Math.floor(c / 2);
                squareNumber = r * 5 + idx + 1;
              }

              const piece = squareNumber ? boardState[squareNumber] : null;
              const bgClass = getSquareZoneColor(r, c);
              const ringClass = squareNumber ? getSquareBorderClass(squareNumber) : "";

              return (
                <div
                  key={`${r}-${c}`}
                  className={`relative flex items-center justify-center ${bgClass} ${ringClass} transition-all duration-200`}
                >
                  {/* Square number for reference (only on dark squares) */}
                  {squareNumber && (
                    <span className="absolute top-1 left-1 text-[9px] font-mono font-medium text-slate-400 select-none">
                      {squareNumber}
                    </span>
                  )}

                  {/* Piece element */}
                  {piece && (
                    <div
                      className={`w-4/5 h-4/5 rounded-full flex items-center justify-center shadow-md border transition-all duration-300 ${
                        piece === "b" || piece === "B"
                          ? "bg-stone-800 border-stone-900 text-stone-200"
                          : "bg-[#faf9f5] border-stone-300 text-stone-700"
                      } ${piece === "W" || piece === "B" ? "border-amber-400 border-2" : ""}`}
                    >
                      {(piece === "W" || piece === "B") && (
                        <Crown className="w-4 h-4 text-amber-400 drop-shadow-sm fill-amber-400" />
                      )}
                    </div>
                  )}

                  {/* Marker overlay for captures / landing */}
                  {squareNumber === endSq && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-orange-500 text-white font-mono text-[8px] rounded-sm uppercase tracking-wider font-bold">
                      Land
                    </span>
                  )}
                  {squareNumber === startSq && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-yellow-500 text-stone-800 font-mono text-[8px] rounded-sm uppercase tracking-wider font-bold">
                      Start
                    </span>
                  )}
                  {squareNumber && capturedSquares.has(squareNumber) && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-red-600 text-white font-mono text-[8px] rounded-sm uppercase tracking-wider font-bold">
                      Jump
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Playback Controls */}
        <div className="w-full max-w-[480px] mt-4 flex flex-col gap-3">
          {/* Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">0</span>
            <input
              id="ply-slider"
              type="range"
              min="0"
              max={moves.length}
              value={currentPly}
              onChange={(e) => setCurrentPly(parseInt(e.target.value, 10))}
              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
            />
            <span className="text-xs font-mono text-slate-500">{moves.length}</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1">
              <button
                id="reset-board-btn"
                onClick={() => setCurrentPly(0)}
                disabled={currentPly === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Reset game to start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                id="prev-ply-btn"
                onClick={() => setCurrentPly(prev => Math.max(0, prev - 1))}
                disabled={currentPly === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <button
              id="toggle-playback-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={moves.length === 0}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-2 text-xs font-medium shadow-sm transition"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" /> Auto Play
                </>
              )}
            </button>

            <button
              id="next-ply-btn"
              onClick={() => setCurrentPly(prev => Math.min(moves.length, prev + 1))}
              disabled={currentPly === moves.length}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Move list and active analysis summary */}
      <div className="w-full xl:w-72 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Move Notation List</h3>
          <div className="h-64 overflow-y-auto border border-slate-100 rounded-xl p-2.5 bg-slate-50/50 font-mono text-xs flex flex-col gap-1.5">
            {moves.map((move, index) => {
              const plyNum = index + 1;
              const moveNum = Math.floor(index / 2) + 1;
              const isWhite = index % 2 === 0;
              const isCurrent = plyNum === currentPly;

              // Check if this specific ply is an analyzed shift
              const analysis = analyzedMoves.find(am => am.ply === plyNum);
              const isShift = analysis?.isShift;
              const isMirrored = analysis?.mirrored;

              return (
                <div
                  key={index}
                  onClick={() => setCurrentPly(plyNum)}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition ${
                    isCurrent
                      ? "bg-slate-800 text-white font-semibold"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isWhite && <span className="text-slate-400 w-6">{moveNum}.</span>}
                    {!isWhite && <span className="w-6"></span>}
                    <span>{move}</span>
                  </div>

                  <div className="flex gap-1">
                    {isShift && (
                      <span className={`px-1.5 py-0.2 text-[8px] rounded uppercase font-bold tracking-wider ${
                        isCurrent 
                          ? "bg-yellow-400 text-slate-900" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        Shift
                      </span>
                    )}
                    {isShift && isMirrored && (
                      <span className={`px-1.5 py-0.2 text-[8px] rounded uppercase font-bold tracking-wider ${
                        isCurrent 
                          ? "bg-orange-400 text-white" 
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        Mirror
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic analysis panel based on current selection */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1 flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Live Position Tracking</h3>
          
          {activeMoveAnalysis ? (
            <div className="flex flex-col gap-2 font-sans text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-medium text-slate-400">Player Color:</span>
                <span className="font-semibold text-slate-800 capitalize">{activeMoveAnalysis.player}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-medium text-slate-400">Notation Played:</span>
                <span className="font-semibold text-slate-800 font-mono text-xs">{activeMoveAnalysis.notation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-medium text-slate-400">Landing Square:</span>
                <span className="font-semibold text-slate-800 font-mono text-xs">{activeMoveAnalysis.toSq} (Col {activeMoveAnalysis.c}, Row {activeMoveAnalysis.r})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-medium text-slate-400">Current Zone:</span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-200/60 text-slate-800">{activeMoveAnalysis.zone}</span>
              </div>
              
              {/* If it's a shift event, detail the previous state */}
              {activeMoveAnalysis.isShift ? (
                <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100/50 flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider">
                    Positional Shift Triggered!
                  </div>
                  <div className="text-slate-600 leading-relaxed">
                    Player suddenly abandoned the previous dominant zone <span className="font-semibold text-slate-800">"{activeMoveAnalysis.previousDominantZone}"</span> to play in <span className="font-semibold text-slate-800">"{activeMoveAnalysis.zone}"</span>.
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-yellow-200/60 text-[10px]">
                    <span className="font-medium text-yellow-700">Opponent Response:</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      activeMoveAnalysis.mirrored 
                        ? "bg-orange-500 text-white" 
                        : "bg-stone-300 text-stone-700"
                    }`}>
                      {activeMoveAnalysis.mirrored ? `Mirrored (In ${activeMoveAnalysis.reactionDelay} move${activeMoveAnalysis.reactionDelay === 1 ? "" : "s"})` : "No Mirror"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-4 italic text-[11px]">
                  No positional shift event active on this move.
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-center py-6 italic text-[11px]">
              Step forward or start Autoplay to track the live position coordinates and spatial shifts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
