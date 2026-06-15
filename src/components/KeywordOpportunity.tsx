import React, { useState, useEffect } from "react";
import { 
  Key, Search, Loader2, ArrowUpDown, Plus, HelpCircle, 
  BookOpen, Sparkles, AlertTriangle, Check, ArrowRight, Trash2, 
  Clock, TrendingUp, DollarSign, BarChart
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip
} from "recharts";
import { Client } from "../types";

interface KeywordOpportunityProps {
  selectedClient: Client | null;
  onNavigate: (tab: string) => void;
}

interface MonthlyTrend {
  month: string;
  volume: number;
}

interface SemanticVariation {
  phrase: string;
  volume: number;
  cpc: number;
  relevance: number;
  difficulty: number;
  intent: string;
}

interface LongTailQuestion {
  question: string;
  difficulty: number;
  volume: number;
  contentAngle: string;
}

interface OpportunityResult {
  seedKeyword: string;
  competitiveDifficulty: string;
  semanticVariations: SemanticVariation[];
  questions: LongTailQuestion[];
  monthlyTrends: MonthlyTrend[];
}

export default function KeywordOpportunity({ selectedClient, onNavigate }: KeywordOpportunityProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OpportunityResult | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [trackedKeywords, setTrackedKeywords] = useState<Record<string, boolean>>({});
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  
  // Sorting states
  const [sortBy, setSortBy] = useState<keyof SemanticVariation>("volume");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Filtering states
  const [searchFilter, setSearchFilter] = useState("");
  const [intentFilter, setIntentFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  // History State
  const [history, setHistory] = useState<string[]>([]);

  // Messages shown while loading
  const loaderMessages = [
    "Analyzing searcher keyword intent indexes...",
    "Querying Google Search indexing guidelines...",
    "Clustering latent semantic variations (LSI)...",
    "Running semantic difficulty estimations...",
    "Generating actionable Content Strategy alignments..."
  ];
  const [loaderMessageIndex, setLoaderMessageIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoaderMessageIndex((prev) => (prev + 1) % loaderMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load History from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("seo_keyword_search_history");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Local history load failure:", e);
    }
  }, []);

  // Pre-fill input if client has keywords
  useEffect(() => {
    if (selectedClient && selectedClient.keywords && selectedClient.keywords.length > 0 && !keywordInput) {
      setKeywordInput(selectedClient.keywords[0]);
    }
  }, [selectedClient]);

  // Handle saving search keywords to history list
  const saveToHistory = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    try {
      const filtered = history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("seo_keyword_search_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Fail saving search history:", e);
    }
  };

  // Run Keyword Opportunities API
  const handleGenerateOpportunities = async (kwValue?: string) => {
    const queryKeyword = (kwValue || keywordInput).trim();
    if (!queryKeyword) {
      setErrorStatus("Please enter or select a valid seed keyword phrase.");
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    setLoaderMessageIndex(0);

    try {
      const res = await fetch("/api/keywords/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: queryKeyword,
          clientId: selectedClient?.id || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Opportunities server request returned non-200 state.");
      }

      const data = await res.json();
      setResult(data);
      saveToHistory(queryKeyword);
    } catch (err: any) {
      setErrorStatus(err.message || "Failed to retrieve opportunities from Gemini.");
    } finally {
      setLoading(false);
    }
  };

  // Remove single history item
  const handleRemoveHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    try {
      const updated = history.filter((h) => h !== item);
      setHistory(updated);
      localStorage.setItem("seo_keyword_search_history", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all search history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("seo_keyword_search_history");
  };

  // Track keyword into client tracking matrix
  const handleTrackKeyword = async (phrase: string, volumeEstimate: number) => {
    if (!selectedClient) {
      setErrorStatus("Please select or onboard a client workspace to track keywords.");
      return;
    }

    setAddingTrackId(phrase);
    try {
      const res = await fetch("/api/keywords/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          keyword: phrase,
          volume: volumeEstimate
        }),
      });

      if (res.ok) {
        setTrackedKeywords((prev) => ({ ...prev, [phrase]: true }));
      } else {
        const errObj = await res.json();
        setErrorStatus(errObj.error || "Failed to add search track.");
      }
    } catch (err) {
      console.error(err);
      setErrorStatus("Connection fail while requesting tracker entry.");
    } finally {
      setAddingTrackId(null);
    }
  };

  // Redirect to Content Writer with preallocated focus parameters
  const handleWriteArticleDirectly = (keyword: string, intent: string) => {
    const prefill = {
      keyword: keyword,
      intent: intent || "Informational",
      type: intent === "Transactional" || intent === "Commercial" ? "service" : "blog"
    };
    sessionStorage.setItem("seo_copilot_prefill", JSON.stringify(prefill));
    onNavigate("writer");
  };

  // Sorting controller
  const handleSort = (field: keyof SemanticVariation) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  // Apply filtering and sorting to variations block
  const getProcessedVariations = () => {
    if (!result || !result.semanticVariations) return [];

    return result.semanticVariations
      .filter((v) => {
        // Search Filter
        const matchesSearch = v.phrase.toLowerCase().includes(searchFilter.toLowerCase());
        
        // Intent filter
        const matchesIntent = intentFilter === "All" || v.intent === intentFilter;

        // Difficulty filter
        let matchesDifficulty = true;
        if (difficultyFilter === "Easy") matchesDifficulty = v.difficulty <= 35;
        else if (difficultyFilter === "Moderate") matchesDifficulty = v.difficulty > 35 && v.difficulty <= 65;
        else if (difficultyFilter === "Hard") matchesDifficulty = v.difficulty > 65;

        return matchesSearch && matchesIntent && matchesDifficulty;
      })
      .sort((a, b) => {
        let valueA = a[sortBy];
        let valueB = b[sortBy];

        if (typeof valueA === "string" && typeof valueB === "string") {
          return sortDirection === "asc" 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else {
          return sortDirection === "asc" 
            ? (valueA as number) - (valueB as number)
            : (valueB as number) - (valueA as number);
        }
      });
  };

  const processedVariations = getProcessedVariations();

  // Get difficulty progress bar color
  const getDifficultyPercentColor = (diff: number) => {
    if (diff <= 35) return "bg-emerald-500";
    if (diff <= 65) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getDifficultyTextColor = (diff: number) => {
    if (diff <= 35) return "text-emerald-700 bg-emerald-50 border-emerald-100";
    if (diff <= 65) return "text-amber-700 bg-amber-50 border-amber-100";
    return "text-rose-700 bg-rose-50 border-rose-100";
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="keyword-opportunity-container">
      
      {/* Upper Meta Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Key className="w-8 h-8 text-indigo-600 shrink-0" />
            <span>Keyword Opportunity Finder</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Discover latent search volumes, structural difficulty margins, and content optimization pathways with client-aware AI strategy.
          </p>
        </div>
        
        {selectedClient && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Client Integration Active</span>
              <span className="font-extrabold text-slate-800">{selectedClient.name}</span>
            </div>
          </div>
        )}
      </div>

      {errorStatus && (
        <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 flex gap-3 text-sm text-rose-800 items-start">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-rose-950">Investigation Notice</span>
            <p className="text-rose-900 mt-0.5">{errorStatus}</p>
          </div>
        </div>
      )}

      {/* Main Grid Layout containing Search Controls, History, Result Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Input Panel + History List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block font-mono">Seed Definition</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">Root Word/Keyword:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., green home builder, coffee beans portland"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl pl-9 pr-4 py-3 outline-none font-medium transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerateOpportunities();
                  }}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {selectedClient && selectedClient.keywords && selectedClient.keywords.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Quick Pick client terms:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedClient.keywords.slice(0, 4).map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setKeywordInput(kw);
                        handleGenerateOpportunities(kw);
                      }}
                      className="bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg px-2 py-1 text-[10px] font-semibold transition"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => handleGenerateOpportunities()}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-indigo-950 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:bg-slate-400 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Discover Opportunities</span>
                </>
              )}
            </button>
          </div>

          {/* Search History Sidebar Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block font-mono">Recent Searches</h2>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-4 text-slate-450 text-[11px] italic">
                No recent searches. Enter keyword seed queries above.
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button
                    key={`${h}-${i}`}
                    onClick={() => {
                      setKeywordInput(h);
                      handleGenerateOpportunities(h);
                    }}
                    className="w-full group flex items-center justify-between bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-950 text-left px-3 py-2.5 rounded-xl border border-slate-100 text-xs font-medium text-slate-700 transition"
                  >
                    <span className="truncate pr-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {h}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 shrink-0 transition">
                      Run <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Result Panel or States */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          
          {/* Default Empty State */}
          {!result && !loading && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
              <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                <CompassIcon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Define Your Organic Landing Matrix</h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                  Provide a primary seed term relevant to your client's industry. The AI strategy engine will query Google indices to estimate volumes, difficulties, transactional semantic variations, and high-impact long-tails.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2 font-mono">POPULAR SEED EXAMPLES</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {["plumber chicago", "tax advisor near me", "organic matcha seller", "home solar installation"].map(ex => (
                    <button
                      key={ex}
                      onClick={() => {
                        setKeywordInput(ex);
                        handleGenerateOpportunities(ex);
                      }}
                      className="px-3 py-1.5 bg-slate-55 border border-slate-200 text-[11px] font-bold hover:bg-slate-100 hover:border-slate-300 text-slate-750 rounded-xl transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading Screen */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-6 shadow-xs flex flex-col items-center justify-center min-h-[350px]">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <Key className="w-5 h-5 text-slate-900 absolute top-3.5 left-3.5 animate-pulse" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight font-mono uppercase">LSI Opportunity Intelligence</h4>
                <p className="text-indigo-600 text-xs font-bold font-mono animate-pulse">
                  {loaderMessages[loaderMessageIndex]}
                </p>
                <div className="w-48 bg-slate-100 h-1.5 rounded-full mx-auto overflow-hidden mt-3">
                  <div className="bg-indigo-600 h-full rounded-full animate-loading-bar" style={{ width: "70%" }} />
                </div>
              </div>
            </div>
          )}

          {/* Keyword Results Block */}
          {result && !loading && (
            <div className="space-y-6">
              
              {/* Top Summary Dashboard Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Micro widget: Seed Scope */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                    <Key className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-widest">Active Seed</span>
                  <div className="text-xl font-extrabold text-slate-900 truncate pr-8">{result.seedKeyword}</div>
                  <p className="text-[10px] text-slate-500 font-medium pt-1">
                    Matched targeting to client niches.
                  </p>
                </div>

                {/* Micro widget: Extracted Opportunities count */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-widest">Discovered Variations</span>
                  <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                    {result.semanticVariations.length + result.questions.length}
                    <span className="text-xs text-slate-400 font-bold">LSI terms</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {result.semanticVariations.filter(v => v.intent === "Transactional").length} core buyer intent targets.
                  </p>
                </div>

                {/* Micro widget: Average CPC estimate */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-widest">Avg CPC Value</span>
                  <div className="text-3xl font-black text-indigo-650">
                    ${(result.semanticVariations.reduce((sum, current) => sum + current.cpc, 0) / result.semanticVariations.length).toFixed(2)}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Estimated competitive cost-per-click value.
                  </p>
                </div>
              </div>

              {/* Bento Grid: Landscape Insights & Historical 12-Month Trends Line Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Insights Column */}
                <div className="lg:col-span-5 bg-slate-950 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute bottom-0 right-0 opacity-10 translate-x-4 translate-y-4">
                    <BarChart className="w-48 h-48 text-indigo-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-3 relative z-10">
                      <div className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 p-1.5 rounded animate-pulse">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-indigo-400">Competitive Insights & Recommendations</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-205 relative z-10 font-medium">
                      {result.competitiveDifficulty}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                    <span>Topic Difficulty Analytics</span>
                    <span className="text-indigo-400 font-bold font-mono">Rank Plan Activated</span>
                  </div>
                </div>

                {/* Search Volume Trend Line Chart */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">12-Month Historical Search Volume</h3>
                          <p className="text-[10px] text-slate-500 font-medium select-none">Search engine interest index for "{result.seedKeyword}"</p>
                        </div>
                      </div>
                      <span className="bg-indigo-50 text-indigo-750 font-bold border border-indigo-100 rounded px-2 py-0.5 text-[9px] font-mono">
                        Trend Volume Index
                      </span>
                    </div>

                    <div className="h-48 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(val) => val.toLocaleString()}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "rgba(15, 23, 42, 0.95)", 
                              borderRadius: "12px", 
                              border: "none",
                              color: "#fff",
                              fontSize: "11px",
                              fontFamily: "monospace"
                            }}
                            formatter={(value: any) => [`${Number(value).toLocaleString()} queries`, "Est. Monthly Vol"]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="volume" 
                            stroke="#4f46e5" 
                            strokeWidth={2.5} 
                            activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }} 
                            dot={{ r: 4, stroke: "#4f46e5", strokeWidth: 1.5, fill: "#ffffff" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Semantic Variations Table Block */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                
                {/* Table Header Controls */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-xs tracking-tight uppercase">Latent Variations</span>
                    <span className="bg-indigo-50 text-indigo-750 font-bold border border-indigo-100 rounded px-1.5 py-0.5 text-[10px]">
                      {processedVariations.length} items
                    </span>
                  </div>

                  {/* Filter elements */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    
                    {/* Live search input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter phrase..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-[11px] font-semibold outline-none focus:ring-1 focus:ring-indigo-400 w-36 shadow-2xs"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>

                    {/* Intent Filter Selector */}
                    <select
                      value={intentFilter}
                      onChange={(e) => setIntentFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400 shadow-2xs"
                    >
                      <option value="All">All Intents</option>
                      <option value="Informational">Informational</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Transactional">Transactional</option>
                      <option value="Navigational">Navigational</option>
                    </select>

                    {/* Difficulty Filter Selector */}
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400 shadow-2xs"
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Easy">Easy (≤35)</option>
                      <option value="Moderate">Moderate (36-65)</option>
                      <option value="Hard">Hard (&gt;65)</option>
                    </select>

                    <button
                      onClick={() => {
                        setSearchFilter("");
                        setIntentFilter("All");
                        setDifficultyFilter("All");
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1.5 rounded-lg transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Main Interactive Table Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                        <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("phrase")}>
                          <span className="flex items-center gap-1">Keyword Phrase <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("intent")}>
                          <span className="flex items-center gap-1">Search Intent <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("volume")}>
                          <span className="flex items-center gap-1 text-right">M. Vol <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition animate-pulse" onClick={() => handleSort("difficulty")}>
                          <span className="flex items-center gap-1">Rank KD% <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("cpc")}>
                          <span className="flex items-center gap-1">Avg CPC <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("relevance")}>
                          <span className="flex items-center gap-1">Relevance <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="py-3 px-4 text-center">Campaign Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {processedVariations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                            No semantic variations match the filters. Try adjusting search criteria.
                          </td>
                        </tr>
                      ) : (
                        processedVariations.map((item, idx) => {
                          const isCurrentlyTracked = trackedKeywords[item.phrase];
                          const isAddingThis = addingTrackId === item.phrase;

                          return (
                            <tr key={`${item.phrase}-${idx}`} className="hover:bg-slate-50/70 transition font-medium text-slate-755">
                              {/* Phrase */}
                              <td className="py-3 px-4 font-bold text-slate-900 select-all">{item.phrase}</td>
                              
                              {/* Intent */}
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase ${
                                  item.intent === "Transactional" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                  item.intent === "Commercial" ? "bg-indigo-100 text-indigo-800 border border-indigo-200" :
                                  item.intent === "Navigational" ? "bg-slate-100 text-slate-700" :
                                  "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}>
                                  {item.intent}
                                </span>
                              </td>
                              
                              {/* Volume */}
                              <td className="py-3 px-3 text-slate-700 font-mono font-bold">
                                {item.volume.toLocaleString()}
                              </td>
                              
                              {/* Difficulty */}
                              <td className="py-3 px-3">
                                <div className="space-y-1 max-w-[90px]">
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className={`px-1 rounded border font-mono ${getDifficultyTextColor(item.difficulty)}`}>
                                      {item.difficulty}%
                                    </span>
                                    <span className="text-slate-400">
                                      {item.difficulty <= 35 ? "Easy" : item.difficulty <= 65 ? "Mod" : "Hard"}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div className={`h-full ${getDifficultyPercentColor(item.difficulty)}`} style={{ width: `${item.difficulty}%` }} />
                                  </div>
                                </div>
                              </td>
                              
                              {/* CPC */}
                              <td className="py-3 px-3 font-mono font-bold text-slate-650">${item.cpc.toFixed(2)}</td>
                              
                              {/* Relevance Score */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" style={{ opacity: item.relevance / 100 }} />
                                  <span>{item.relevance}</span>
                                </div>
                              </td>

                              {/* Campaign Actions */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex justify-center items-center gap-1">
                                  
                                  {/* SERP position track button */}
                                  <button
                                    onClick={() => handleTrackKeyword(item.phrase, item.volume)}
                                    disabled={isCurrentlyTracked || isAddingThis}
                                    title="Add to continuously tracked keywords"
                                    className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center transition gap-1 ${
                                      isCurrentlyTracked ? 
                                      "bg-emerald-50 border-emerald-100 text-emerald-700" : 
                                      "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50"
                                    }`}
                                  >
                                    {isAddingThis ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-550" />
                                    ) : isCurrentlyTracked ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Tracked</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800" />
                                        <span>Track SERP</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Redirect to Content Writer */}
                                  <button
                                    onClick={() => handleWriteArticleDirectly(item.phrase, item.intent)}
                                    title="Prefill focus keyword and launch content editor"
                                    className="p-2 rounded-xl border border-indigo-150 text-[11px] font-bold bg-indigo-50/50 hover:bg-indigo-50/100 text-indigo-700 flex items-center justify-center gap-1 transition"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Draft Content</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Long Tail Questions section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-650 shrink-0" />
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Structured Long-Tail Questions Uncovered</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.questions.map((q, idx) => (
                    <div 
                      key={`${q.question}-${idx}`}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-indigo-55 text-indigo-700 font-extrabold uppercase text-[9px] tracking-wider font-mono px-2 py-0.5 rounded">
                            Long-Tail FAQ Target
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500 font-medium">Vol: <b className="text-slate-800 font-mono">{q.volume}</b></span>
                            <span className={`text-[10px] px-1.5 rounded font-mono border font-bold ${getDifficultyTextColor(q.difficulty)}`}>
                              KD: {q.difficulty}%
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 leading-snug font-serif text-sm">
                          "{q.question}"
                        </h4>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
                        <div className="flex gap-1.5 items-start">
                          <span className="text-indigo-600 font-bold text-[10px] uppercase font-mono tracking-wider mt-0.5">Content Angle:</span>
                          <span className="text-slate-600 text-xs font-semibold leading-relaxed">
                            {q.contentAngle}
                          </span>
                        </div>
                        <button
                          onClick={() => handleWriteArticleDirectly(q.question, "Informational")}
                          className="mt-1 text-[11px] font-extrabold text-indigo-600 hover:text-indigo-855 flex items-center gap-1 transition"
                        >
                          Draft dedicated FAQ answers <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Minimal missing icons
function CompassIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
