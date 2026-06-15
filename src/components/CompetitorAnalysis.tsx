import React, { useState, useEffect } from "react";
import { 
  BarChart2, Users, ArrowUpRight, Search, Play, 
  Loader2, Sparkles, Check, AlertTriangle, HelpCircle, Info
} from "lucide-react";
import { Client, CompetitorAnalysis as ICompetitorAnalysis } from "../types";

interface CompetitorAnalysisProps {
  selectedClient: Client | null;
  onRunCompetitors: (clientId: string) => Promise<ICompetitorAnalysis | null>;
  onNavigate: (tab: string) => void;
}

export default function CompetitorAnalysis({ selectedClient, onRunCompetitors, onNavigate }: CompetitorAnalysisProps) {
  const [analysis, setAnalysis] = useState<ICompetitorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");

  // Load previous competitor logs if exist
  useEffect(() => {
    if (!selectedClient) return;
    setAnalysis(null);
    setErrorStatus("");

    fetch(`/api/competitors/${selectedClient.id}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No previous competitors evaluation found. Run first audit evaluation scan.");
      })
      .then(data => setAnalysis(data))
      .catch(err => setErrorStatus(err.message));
  }, [selectedClient]);

  const handleRunClick = async () => {
    if (!selectedClient) return;
    setIsLoading(true);
    setErrorStatus("");

    try {
      const data = await onRunCompetitors(selectedClient.id);
      if (data) {
        setAnalysis(data);
      } else {
        setErrorStatus("Could not fetch competition matrices. Fallback initialized.");
      }
    } catch (err: any) {
      setErrorStatus(err.message || "Failed running competitors scan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client to Scan</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Select a client first from the main Dashboard directory to trace competitors, discover content gaps, and analyze organic difficulty coefficients.
        </p>
        <button 
          onClick={() => onNavigate("dashboard")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl mt-2 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tab Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Competitor & Keyword Gaps</h1>
          <p className="text-slate-500 text-sm">
            Mapping keywords against domain leaders in <span className="font-semibold text-slate-800">{selectedClient.location}</span>
          </p>
        </div>
        <button
          onClick={handleRunClick}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-5 rounded-xl transition duration-150"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching organic landing positions...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Run Competitor Audit
            </>
          )}
        </button>
      </div>

      {errorStatus && !analysis && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs p-4 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">Competitors Evaluator Offline</p>
            <p className="mt-1">{errorStatus}</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-8">
          
          {/* Main Table Comparing Competitor Metrics */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Direct Competitor Grid Correlation</h2>
              <p className="text-xs text-slate-500">Measuring index metrics of the top ranking organic sites on target queries.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-sans font-bold border-b border-slate-100">
                    <th className="py-3 px-4">Ranking Target Competitor</th>
                    <th className="py-3 px-4 text-center">Avg Article Words</th>
                    <th className="py-3 px-4 text-center">Density %</th>
                    <th className="py-3 px-4 text-center">Backlink Count</th>
                    <th className="py-3 px-4 text-center">Speed (s)</th>
                    <th className="py-3 px-4 text-center">Meta Schema Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Our Client Row for comparison */}
                  <tr className="bg-indigo-50/20">
                    <td className="py-3.5 px-4 font-bold text-indigo-900">
                      <div>{selectedClient.name} <span className="text-[9px] bg-indigo-600 text-white font-bold ml-1.5 px-1 rounded">US</span></div>
                      <span className="text-[10px] text-indigo-600 font-mono italic block truncate mt-0.5">{selectedClient.url}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">750 max</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">1.1%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">Low baseline</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">3.4s</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-700">Mixed</td>
                  </tr>

                  {/* Competitor list */}
                  {analysis.competitors.map((com, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-950 flex items-center gap-1">
                          {com.name} <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block truncate mt-0.5">{com.url}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-700 font-semibold">{com.contentLength} words</td>
                      <td className="py-3.5 px-4 text-center text-slate-700">{com.keywordDensity}%</td>
                      <td className="py-3.5 px-4 text-center text-slate-800 font-bold">{com.backlinksCount} backlinks</td>
                      <td className="py-3.5 px-4 text-center text-slate-700">{com.speedSeconds}s</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-slate-100 py-0.5 px-2 rounded-md font-sans text-[10px] text-slate-700 font-semibold border border-slate-200">
                          {com.schemaType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Content Gap Analysis Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-md">AI Content Gaps Identified</h3>
                  <p className="text-[11px] text-slate-500">Core topic pages matching search queries competitors profit on, but we lack.</p>
                </div>
              </div>

              <div className="space-y-4">
                {analysis.contentGaps.map((gap, i) => (
                  <div key={i} className="border border-slate-100 bg-slate-50/30 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{gap.topic}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        gap.competitorStrength === "high" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        comp: {gap.competitorStrength} authority
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal font-sans font-medium">
                      Action Item: {gap.actionItem}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={() => onNavigate("writer")}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Launch Writer &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword Gap Report Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-md">Keyword Void Placements</h3>
                  <p className="text-[11px] text-slate-500">Lucrative long-tail queries. Capture these keywords to capture direct search traffic.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {analysis.keywordGaps.map((gap, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-b-0">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 text-xs">{gap.keyword}</span>
                      <div className="flex gap-4 text-[10px] text-slate-400">
                        <span>Search Volume: <strong>{gap.searchVolume}</strong>/mo</span>
                        <span>Comp Rank: <strong>#{gap.competitorRank}</strong></span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-slate-400 block font-normal">SEO Difficulty</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${gap.difficulty >= 50 ? 'text-amber-500' : 'text-green-600'}`}>
                          {gap.difficulty}%
                        </span>
                        <div className="w-12 bg-slate-100 rounded-full h-1">
                          <div 
                            className={`h-full rounded-full ${gap.difficulty >= 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${gap.difficulty}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
