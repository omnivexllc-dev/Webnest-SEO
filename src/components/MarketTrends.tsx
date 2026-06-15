import React, { useState, useEffect } from "react";
import { 
  TrendingUp, RefreshCw, AlertTriangle, Calendar, 
  ArrowUpRight, BookOpen, AlertCircle, Info, Sparkles, HelpCircle 
} from "lucide-react";
import { MarketTrendData, MarketTrendUpdate } from "../types";

export default function MarketTrends() {
  const [trends, setTrends] = useState<MarketTrendData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 25000); // 25 seconds timeout

      const url = `/api/market-trends${forceRefresh ? "?refresh=true" : ""}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const data: MarketTrendData = await response.json();
      setTrends(data);
    } catch (err: any) {
      console.error("Error fetching market trends:", err);
      setError(err?.message || "Failed to retrieve the latest Google updates summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const getSeverityBadgeClass = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes("high") || s.includes("critical")) {
      return "bg-rose-50 border border-rose-200 text-rose-700";
    }
    if (s.includes("medium") || s.includes("moderate")) {
      return "bg-amber-50 border border-amber-200 text-amber-700";
    }
    return "bg-sky-50 border border-sky-100 text-sky-700";
  };

  const getSeverityLabelColor = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes("high") || s.includes("critical")) {
      return "text-rose-600";
    }
    if (s.includes("medium") || s.includes("moderate")) {
      return "text-amber-600";
    }
    return "text-sky-600";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="dashboard-market-trends">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>Google Algorithm Updates & Market Trends</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Real-time search volatility intelligence powered by Google Search Grounding.
          </p>
        </div>
        <button
          onClick={() => fetchTrends(true)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Re-grounding..." : "Scan Algorithm Updates"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-800">Connection Latency</h4>
            <p className="text-[11px] text-rose-600 leading-normal">{error}</p>
            <button
              onClick={() => fetchTrends(true)}
              className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 block"
            >
              Try Re-querying Search Index &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !trends && (
        <div className="space-y-6 animate-pulse">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 h-20"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-3">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {trends && (
        <div className="space-y-6">
          {/* Aggregate Summary Callout Card */}
          <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-2xl relative overflow-hidden flex items-start gap-4">
            <div className="absolute top-0 right-0 p-3 text-indigo-505 pointer-events-none">
              <Sparkles className="w-10 h-10 text-indigo-500/10" />
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-sans">Weekly Search Volatility Intel</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium">
                {trends.summary}
              </p>
            </div>
          </div>

          {/* Grid of Updates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trends.updates.map((update, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs transition duration-200 p-5 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Severity Badge & Date */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getSeverityBadgeClass(update.severity)}`}>
                      {update.severity} Severity
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {update.date}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm md:text-base tracking-tight leading-tight">
                    {update.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {update.summary}
                  </p>
                </div>

                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100/50 space-y-1 mt-auto">
                  <span className={`text-[9px] uppercase font-extrabold block tracking-wider ${getSeverityLabelColor(update.severity)}`}>
                    Actionable SEO Focus
                  </span>
                  <p className="text-[11px] text-slate-600 leading-normal font-sans font-medium">
                    {update.actionableInsight}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Grounding Attribution / Sources Section */}
          {trends.sources && trends.sources.length > 0 && (
            <div className="border-t border-slate-150 pt-5 space-y-3">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">
                  Grounding Citations & Primary Sources
                </h4>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {trends.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/50 px-3/5 px-3 py-1.5 rounded-xl transition"
                  >
                    <span>{source.title || "Indexed Update"}</span>
                    <ArrowUpRight className="w-3 h-3 text-indigo-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
