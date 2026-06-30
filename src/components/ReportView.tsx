import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { BookOpen, Sparkles, Printer, FileText, Loader2 } from "lucide-react";
import { AnalysisSummary, ZoningMethod } from "../types";

interface ReportViewProps {
  summaries: AnalysisSummary;
  zoningMethod: ZoningMethod;
  dominanceWindow: number;
  mirrorWindow: number;
  excludeCaptures?: boolean;
}

const LOADING_STEPS = [
  "Aggregating 10x10 spatial coordinate matrices...",
  "Running one-sample Z-tests on position proportions...",
  "Isolating Bullet/Blitz vs. Rapid/Classical play phases...",
  "Calculating empirical reaction delay distributions...",
  "Drafting Abstract and statistical findings...",
  "Synthesizing psychological discussion on attention hijacking...",
  "Structuring bibliography and formatting layout..."
];

export default function ReportView({
  summaries,
  zoningMethod,
  dominanceWindow,
  mirrorWindow,
  excludeCaptures,
}: ReportViewProps) {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Rotate loading steps for visual feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setLoadingStep(0);
    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaries,
          zoningMethod,
          params: { dominanceWindow, mirrorWindow, excludeCaptures }
        }),
      });

      const data = await response.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setReport(`## Generation Failed\n\nError: ${data.error || "The server could not process the request."}`);
      }
    } catch (err: any) {
      setReport(`## Generation Error\n\nFailed to reach server. ${err.message || "Please check connection."}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Liddraft Position Shift Research Paper</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1f2937;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 24pt; font-weight: bold; margin-bottom: 20px; text-align: center; color: #111827; }
            h2 { font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; color: #1f2937; }
            h3 { font-size: 12pt; font-weight: bold; margin-top: 20px; color: #374151; }
            p { margin-bottom: 15px; text-align: justify; }
            ul, ol { margin-bottom: 15px; padding-left: 20px; }
            li { margin-bottom: 5px; }
            blockquote { border-left: 4px solid #d1d5db; padding-left: 15px; color: #4b5563; font-style: italic; margin-bottom: 15px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="content">
            ${document.getElementById("report-paper-body")?.innerHTML || ""}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="report-view-root" className="font-sans max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* 1. Header description */}
      {!report && !loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center gap-4 py-12">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-700 shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Generate Academic Research Paper</h2>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed">
            Synthesize your empirical results into a full, publication-ready research paper. Our server uses the Gemini AI engine to analyze your spatial zone maps, mirroring rates, and time control factors to draft standard academic modules (Abstract, Methodology, Results, and Discussion).
          </p>
          <button
            id="compile-paper-btn"
            onClick={handleGenerateReport}
            className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-white" /> Compile Scholarly Paper
          </button>
        </div>
      )}

      {/* 2. Loading State */}
      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center gap-6 py-24 min-h-[400px]">
          <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-slate-800">Compiling Empirical Data...</h3>
            <p className="text-xs font-mono text-slate-400 max-w-sm animate-pulse h-8">
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 transition-all duration-1000" style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}></div>
          </div>
        </div>
      )}

      {/* 3. Paper Rendered State */}
      {report && !loading && (
        <div className="flex flex-col gap-4">
          
          {/* Action Ribbon */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <FileText className="w-4 h-4" /> Academic Format (Standard Markdown)
            </div>
            
            <div className="flex gap-2">
              <button
                id="recompile-paper-btn"
                onClick={handleGenerateReport}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Recompile
              </button>
              <button
                id="print-paper-btn"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Export PDF
              </button>
            </div>
          </div>

          {/* Academic Paper Card */}
          <div className="bg-white px-8 py-12 rounded-2xl border border-slate-200/60 shadow-md">
            <div id="report-paper-body" className="markdown-body">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
