import React, { useState, useEffect } from "react";
import { 
  TrendingUp, BarChart2, Star, Trophy, Clock, 
  ArrowUp, ArrowDown, HelpCircle, Info, Loader2, Signal, Compass,
  Search, Plus, Check, FileText, CheckCircle, ArrowUpRight, Activity, Globe, ShoppingCart, Sparkles
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Client, KeywordRankHistory } from "../types";

interface RankTrackerProps {
  selectedClient: Client | null;
  onNavigate: (tab: string) => void;
}

export default function RankTracker({ selectedClient, onNavigate }: RankTrackerProps) {
  const [keywordHistory, setKeywordHistory] = useState<KeywordRankHistory[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");

  // Sub-tabs controllers
  const [activeSubTab, setActiveSubTab] = useState<"tracking" | "research">("tracking");
  const [researchInput, setResearchInput] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [researchData, setResearchData] = useState<any | null>(null);
  const [trackingInProgress, setTrackingInProgress] = useState<Record<string, boolean>>({});
  const [trackedSuccessSet, setTrackedSuccessSet] = useState<Set<string>>(new Set());

  const fetchRankings = () => {
    if (!selectedClient) return;
    setIsLoading(true);
    setErrorStatus("");

    fetch(`/api/rankings/${selectedClient.id}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No positions initialized. Run onboarding first.");
      })
      .then(data => {
        setKeywordHistory(data);
        if (data.length > 0 && !selectedKeywordId) {
          setSelectedKeywordId(data[0].id);
        }
      })
      .catch(err => {
        setErrorStatus(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!selectedClient) return;
    setKeywordHistory([]);
    setSelectedKeywordId(null);
    setResearchData(null);
    setResearchInput("");
    setResearchError("");
    fetchRankings();
  }, [selectedClient]);

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <TrendingUp className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client to Track Rankings</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Please select a client from the portfolio workspace first to evaluate position trajectories on Google SERPs.
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

  const activeHistoryObj = keywordHistory.find(k => k.id === selectedKeywordId);

  const chartData = activeHistoryObj?.history.map(pt => ({
    date: pt.date,
    "Google Desktop": pt.rank,
    "Google Mobile": pt.mobileRank,
    "Local Maps Placement": pt.localRank
  })) || [];

  const handleResearchSubmit = async (e: React.FormEvent, keywordOverride?: string) => {
    if (e) e.preventDefault();
    const query = (keywordOverride || researchInput).trim();
    if (!query) return;

    setIsResearching(true);
    setResearchError("");
    setResearchData(null);
    setTrackedSuccessSet(new Set());

    try {
      const response = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClient.id, keyword: query }),
      });

      if (!response.ok) {
        throw new Error("Unable to complete research. Please try another phrase.");
      }

      const data = await response.json();
      setResearchData(data);
      setResearchInput(query);
    } catch (err: any) {
      setResearchError(err.message || "Failed running Keyword Discovery.");
    } finally {
      setIsResearching(false);
    }
  };

  const handleTrackKeyword = async (keyword: string, volume: number) => {
    if (!selectedClient) return;

    setTrackingInProgress(prev => ({ ...prev, [keyword]: true }));

    try {
      const response = await fetch("/api/keywords/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClient.id, keyword, volume }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add keyword.");
      }

      setTrackedSuccessSet(prev => {
        const next = new Set(prev);
        next.add(keyword.toLowerCase());
        return next;
      });

      fetchRankings();
    } catch (err: any) {
      alert(err.message || "Keyword is already being tracked.");
    } finally {
      setTrackingInProgress(prev => ({ ...prev, [keyword]: false }));
    }
  };

  const handleSendToWriter = (keyword: string, intent: string) => {
    const prefill = {
      keyword,
      intent,
      type: "blog"
    };
    sessionStorage.setItem("seo_copilot_prefill", JSON.stringify(prefill));
    onNavigate("writer");
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Top Header Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Keyword Hub & Positions</h1>
          <p className="text-slate-500 text-sm">
            SEO intelligence tracker and developer console for <span className="font-semibold text-slate-800">{selectedClient.name}</span>.
          </p>
        </div>

        {/* Global visibility counters */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Visibility Index</span>
            <span className="text-lg font-extrabold text-indigo-600">{selectedClient.visibilityScore}%</span>
          </div>
          <div className="text-right border-l border-slate-200 pl-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ranks Monitored</span>
            <span className="text-lg font-bold text-slate-800">{keywordHistory.length} query terms</span>
          </div>
        </div>
      </div>

      {/* Segmented Controller Tab Selector */}
      <div className="flex bg-slate-900 text-slate-400 p-1.5 rounded-xl w-full sm:w-fit border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveSubTab("tracking")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "tracking"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/50"
              : "hover:text-white hover:bg-slate-800/40"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>SERP Position Tracks</span>
        </button>
        <button
          onClick={() => setActiveSubTab("research")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
            activeSubTab === "research"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/50"
              : "hover:text-white hover:bg-slate-800/40"
          }`}
        >
          <Search className="w-4 h-4 text-indigo-400" />
          <span>Keyword Discovery & Semantics</span>
        </button>
      </div>

      {/* Subtab Output Views */}
      {activeSubTab === "tracking" && (
        <>
          {isLoading && keywordHistory.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Updating position registers on server DB...</p>
            </div>
          )}

          {errorStatus && !isLoading && (
            <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs p-4 rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>{errorStatus}</span>
            </div>
          )}

          {!isLoading && keywordHistory.length === 0 && !errorStatus && (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl space-y-4 max-w-lg mx-auto bg-white p-6">
              <HelpCircle className="w-8 h-8 text-indigo-500 mx-auto" />
              <p className="text-sm text-slate-650 font-medium">No keyword tracking triggers recorded for this client yet.</p>
              <button 
                onClick={() => setActiveSubTab("research")}
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" /> Start Keyword Discovery &rarr;
              </button>
            </div>
          )}

          {keywordHistory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left panel: List of keywords with active placements */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Monitored Core Phrases</h2>
                
                <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {keywordHistory.map((kw) => {
                    const isActive = kw.id === selectedKeywordId;
                    const progressDiff = kw.previousRank - kw.currentRank; // subtraction because lower is better rank!

                    return (
                      <div 
                        key={kw.id}
                        onClick={() => setSelectedKeywordId(kw.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-4 ${
                          isActive 
                            ? 'border-indigo-600 bg-indigo-50/20' 
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <span className="font-bold text-slate-800 block truncate text-xs sm:text-sm">{kw.keyword}</span>
                          <span className="text-[10px] text-slate-400 font-sans block">Volume: {kw.volume}/mo search</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-center">
                            <span className="text-[10px] text-slate-400 block uppercase font-sans">Rank</span>
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">#{kw.currentRank}</span>
                          </div>
                          
                          <div className="w-10">
                            {progressDiff > 0 ? (
                              <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5 font-sans justify-end bg-green-50 border border-green-100/50 px-1.5 py-0.5 rounded">
                                <ArrowUp className="w-2.5 h-2.5" /> {progressDiff}
                              </span>
                            ) : progressDiff < 0 ? (
                              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 font-sans justify-end bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded">
                                <ArrowDown className="w-2.5 h-2.5" /> {Math.abs(progressDiff)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 block text-right font-mono">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right panel: Live Recharts visualizer representing the trend */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 lg:col-span-2">
                {activeHistoryObj ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                      <div className="space-y-1">
                        <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Signal className="w-3.5 h-3.5 animate-pulse" /> High Precision Tracking Index
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{activeHistoryObj.keyword}</h2>
                      </div>

                      {/* Summary coordinates badges */}
                      <div className="flex gap-4">
                        <div className="text-center bg-slate-50 rounded-lg p-2 min-w-[70px]">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans font-semibold">Google Desktop</span>
                          <span className="text-sm font-extrabold text-slate-800">#{activeHistoryObj.currentRank}</span>
                        </div>
                        <div className="text-center bg-slate-50 rounded-lg p-2 min-w-[70px]">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans font-semibold">Google Mobile</span>
                          <span className="text-sm font-extrabold text-slate-800">
                            #{activeHistoryObj.history[activeHistoryObj.history.length - 1]?.mobileRank || "—"}
                          </span>
                        </div>
                        <div className="text-center bg-slate-50 rounded-lg p-2 min-w-[70px]">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans font-semibold">Local Business Maps</span>
                          <span className="text-sm font-extrabold text-slate-800">
                            #{activeHistoryObj.history[activeHistoryObj.history.length - 1]?.localRank || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Line graph. Reverse y to place premium status #1 at top peak. */}
                    <div className="w-full h-80 pt-4 font-sans text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" tickSize={4} style={{ fontSize: 10 }} />
                          <YAxis reversed={true} domain={[1, 'auto']} stroke="#94a3b8" style={{ fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                            itemStyle={{ fontSize: 11, padding: 0 }}
                          />
                          <Legend style={{ fontSize: 11 }} />
                          <Line 
                            type="monotone" 
                            dataKey="Google Desktop" 
                            stroke="#4f46e5" 
                            strokeWidth={2.5} 
                            activeDot={{ r: 6 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Google Mobile" 
                            stroke="#06b6d4" 
                            strokeWidth={2} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Local Maps Placement" 
                            stroke="#f59e0b" 
                            strokeWidth={1.5} 
                            strokeDasharray="4 4"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex items-start gap-2.5">
                      <Compass className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        This chart maps position fluctuations on Google search indices. Consistent upward trajectories correspond to solid optimization fixes deployed using the <strong>AI Writer</strong> or the <strong>SEO Automations box</strong>.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-24 text-slate-400 space-y-2">
                    <p className="text-xs">Select any monitored keyword on the left core timeline to render historical position trajectory maps.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      )}

      {activeSubTab === "research" && (
        <div className="space-y-6">
          {/* Main search selector panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-y-[-10%] translate-x-[10%] opacity-10">
              <Search className="w-64 h-64 text-indigo-400" />
            </div>

            <div className="space-y-4 relative z-10 max-w-2xl">
              <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-extrabold uppercase px-2 py-0.5 rounded tracking-widest leading-none border border-indigo-500/20">
                SEO Deep Research Module
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Explore Keyword Volume, Difficulty & LSI Semantics</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-normal">
                Analyze and evaluate keyword difficulty indexes. Discover rich tail variations, intent categories, LSI semantic queries and actionable blueprints using the <strong>Gemini 3.5 Flash</strong> neural engine.
              </p>

              <form onSubmit={(e) => handleResearchSubmit(e)} className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Enter seed phrase (e.g. rain garden portland, lawn care services)..."
                  value={researchInput}
                  onChange={(e) => setResearchInput(e.target.value)}
                  className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 text-white font-medium"
                  required
                  disabled={isResearching}
                />
                <button
                  type="submit"
                  disabled={isResearching}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition shrink-0 cursor-pointer disabled:bg-indigo-850"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-white" />
                      <span>Run Discovery</span>
                    </>
                  )}
                </button>
              </form>

              {/* Seed suggestion chips representing client keywords */}
              {selectedClient.keywords && selectedClient.keywords.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-2 font-semibold">Quick analysis from client profile keywords:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.keywords.map((kw, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleResearchSubmit(e, kw)}
                        disabled={isResearching}
                        className="bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white hover:border-slate-500 rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Researching loading blocks */}
          {isResearching && (
            <div className="space-y-5 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-slate-50 border border-slate-100 rounded-xl h-24"></div>
                ))}
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl h-64"></div>
            </div>
          )}

          {/* Error Banner */}
          {researchError && !isResearching && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-4 rounded-xl flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Neural Discovery Failure</p>
                <p className="text-slate-600 mt-0.5">{researchError}</p>
              </div>
            </div>
          )}

          {/* Research Results output */}
          {researchData && !isResearching && (
            <div className="space-y-8 animate-fade-in text-xs sm:text-sm">
              
              {/* Core metrics visual headers (4 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                
                {/* 1. Keyword search volume */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block tracking-wider mb-2">Monthly searches</span>
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{researchData.volume.toLocaleString()}</span>
                    <span className="text-slate-400 text-[10px] block font-medium mt-1">Estimated organic volume</span>
                  </div>
                </div>

                {/* 2. Keyword Difficulty Index */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block tracking-wider mb-2">Keyword Difficulty</span>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{researchData.difficulty}%</span>
                      
                      {researchData.difficulty < 40 ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Easy</span>
                      ) : researchData.difficulty < 70 ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Moderate</span>
                      ) : (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Hard</span>
                      )}
                    </div>
                    
                    {/* Visual bar meter */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full rounded-full ${
                          researchData.difficulty < 40 ? 'bg-emerald-500' : researchData.difficulty < 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${researchData.difficulty}%` }}
                      ></div>
                    </div>
                    
                    <span className="text-slate-400 text-[10px] block font-medium mt-1.5">
                      {researchData.difficulty < 40 
                        ? 'Low competition. Immediate target.' 
                        : researchData.difficulty < 70 
                          ? 'Optimized SEO clustering required.' 
                          : 'High authority backlink signals needed.'}
                    </span>
                  </div>
                </div>

                {/* 3. Cost-per-click (CPC) value */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block tracking-wider mb-2">Financial Valuation CPC</span>
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">${researchData.cpc.toFixed(2)}</span>
                    <span className="text-slate-400 text-[10px] block font-medium mt-1">Average commercial valuation</span>
                  </div>
                </div>

                {/* 4. Search Intent categorization */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block tracking-wider mb-2">Searcher Intent</span>
                  <div>
                    <div className="flex items-center gap-1.5 text-indigo-705 font-bold">
                      {researchData.intent === "Transactional" && <ShoppingCart className="w-4 h-4 text-emerald-500" />}
                      {researchData.intent === "Commercial" && <Compass className="w-4 h-4 text-amber-500" />}
                      {researchData.intent === "Informational" && <Info className="w-4 h-4 text-indigo-505 text-indigo-600" />}
                      {researchData.intent === "Navigational" && <Globe className="w-4 h-4 text-rose-500" />}
                      
                      <span className="text-lg font-extrabold text-slate-800">{researchData.intent}</span>
                    </div>
                    <span className="text-slate-400 text-[10px] block font-medium mt-1.5">
                      {researchData.intent === "Transactional" && "Searcher is ready to place a purchase command."}
                      {researchData.intent === "Commercial" && "Evaluating and comparing solution providers."}
                      {researchData.intent === "Informational" && "Investigating deep guides and general knowledge."}
                      {researchData.intent === "Navigational" && "Seeking direct brand-level reference access."}
                    </span>
                  </div>
                </div>

              </div>

              {/* Intent Diagnostic Text */}
              <div className="bg-indigo-50/40 border border-indigo-100/50 p-4 rounded-2xl flex gap-3">
                <Activity className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 col-span-3">
                  <span className="font-bold text-slate-900 block text-xs">Search Intent Sentiment Diagnostic</span>
                  <p className="text-slate-600 text-xs leading-relaxed">{researchData.description}</p>
                </div>
              </div>

              {/* Related Long Tail Keywords & Semantic Gap Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Related Long Tails (Col-span-2) */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 animate-fade-in">
                      <span>Discovered Long-Tail Phrases</span>
                      <span className="bg-indigo-105 text-indigo-850 text-indigo-605 bg-indigo-50 text-indigo-805 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {researchData.relatedKeywords?.length || 0} discovered
                      </span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                          <th className="p-3.5 pl-4">Phrase query</th>
                          <th className="p-3.5">Intent</th>
                          <th className="p-3.5">Vol/mo</th>
                          <th className="p-3.5 text-center">Difficulty (KD)</th>
                          <th className="p-3.5 text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                        {researchData.relatedKeywords?.map((item: any, idx: number) => {
                          const isAlreadyTracked = keywordHistory.some(h => h.keyword.toLowerCase() === item.keyword.toLowerCase());
                          const isTrackedSuccess = trackedSuccessSet.has(item.keyword.toLowerCase());
                          const isAdding = trackingInProgress[item.keyword];

                          return (
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="p-3.5 pl-4 font-bold text-slate-900 truncate max-w-[170px]" title={item.keyword}>
                                {item.keyword}
                              </td>
                              <td className="p-3.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  item.intent === "Transactional" 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : item.intent === "Commercial" 
                                      ? "bg-amber-50 text-amber-700" 
                                      : "bg-indigo-105 bg-indigo-50 text-indigo-700"
                                }`}>
                                  {item.intent}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-700 font-sans">{item.volume.toLocaleString()}</td>
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="font-sans font-bold text-slate-850">{item.difficulty}%</span>
                                  <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        item.difficulty < 40 ? 'bg-emerald-500' : item.difficulty < 70 ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${item.difficulty}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 text-right pr-4 space-x-2">
                                {/* Track placement Button */}
                                {isAlreadyTracked || isTrackedSuccess ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-green-650 bg-green-50 border border-green-100 rounded px-2.5 py-1.5 font-bold">
                                    <Check className="w-3.5 h-3.5" /> Monitored
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleTrackKeyword(item.keyword, item.volume)}
                                    disabled={isAdding}
                                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 border border-indigo-200 hover:bg-indigo-50 bg-white rounded px-2.5 py-1.5 cursor-pointer font-bold select-none transition"
                                  >
                                    {isAdding ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" /> Track pos
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* Send to Writer button */}
                                <button
                                  onClick={() => handleSendToWriter(item.keyword, item.intent)}
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-650 border border-slate-200 bg-white hover:bg-slate-50 rounded px-2.5 py-1.5 font-bold cursor-pointer transition"
                                  title="Prefill title, intent, and keyword and redirect to AI Writer page."
                                >
                                  <FileText className="w-3.5 h-3.5" /> Draft outline
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Semantic Variations & Entity Synonyms (Col-span-1) */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-1 border-t">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>LSI Semantic Synonyms</span>
                  </h3>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {researchData.semanticVariations?.map((variant: any, idx: number) => (
                      <div key={idx} className="p-3 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50/40 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-900 tracking-tight">{variant.phrase}</span>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50/80 font-bold px-1.5 py-0.5 rounded">
                            {variant.relevanceScore}% match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          <strong className="text-slate-700">Implementation:</strong> {variant.contextSuggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* AI strategic outline blueprint card */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3.5">
                  <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[11px] text-indigo-305 text-indigo-305 text-indigo-300">
                    Neural Content Planner Blueprint
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-4xl">
                  {researchData.contentStrategy}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                    <span>Thematic density clustering: Ideal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span>Core Web Vitals relevance: Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>Anchor backlink distribution: Essential</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
