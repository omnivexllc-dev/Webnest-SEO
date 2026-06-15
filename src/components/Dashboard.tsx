import React from "react";
import { 
  Users, Globe, TrendingUp, Award, CheckCircle, 
  BarChart2, ShieldCheck, Zap, AlertTriangle, PlusCircle, ArrowRight
} from "lucide-react";
import { Client } from "../types";
import MarketTrends from "./MarketTrends";

interface DashboardProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ 
  clients, 
  selectedClient, 
  onSelectClient,
  onNavigate 
}: DashboardProps) {
  
  // Aggregate Metrics
  const totalClients = clients.length;
  const websitesManaged = clients.filter(c => c.url).length;
  
  const totalKeywords = clients.reduce((acc, c) => acc + (c.keywords?.length || 0), 0);
  
  const avgSeoScore = clients.length 
    ? Math.round(clients.reduce((acc, c) => acc + (c.seoScore || 0), 0) / clients.length) 
    : 0;
    
  const totalTraffic = clients.reduce((acc, c) => acc + (c.monthlyTraffic || 0), 0);
  const totalTasksDone = clients.reduce((acc, c) => acc + (c.tasksCompleted || 0), 0);
  
  // Quick calculations for average visibility score
  const avgVisibility = clients.length
    ? Math.round(clients.reduce((acc, c) => acc + (c.visibilityScore || 0), 0) / clients.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> AI-Powered Heuristics Active
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">SEO Agency Command Hub</h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Manage your SEO clients, run technical crawlers, compose search-intent blog posts, tracking Google Business placements, and download executive analytics summaries.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Clients */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">Total Clients</span>
            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-2xs"><Users className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{totalClients}</h3>
            <p className="text-[10px] text-green-600 font-bold mt-1">Active Accounts</p>
          </div>
        </div>

        {/* Websites Managed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">Domains</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Globe className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{websitesManaged}</h3>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">100% Crawlable</p>
          </div>
        </div>

        {/* Ranking Keywords */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">Tracked Keywords</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Award className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{totalKeywords}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">SERP Monitoring</p>
          </div>
        </div>

        {/* Traffic Growth */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">Monthly Traffic</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{totalTraffic.toLocaleString()}</h3>
            <p className="text-[10px] text-purple-600 font-bold mt-1">Total Clicks</p>
          </div>
        </div>

        {/* Avg SEO Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">Avg SEO Score</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{avgSeoScore}</h3>
              <span className="text-xs text-slate-400">/100</span>
            </div>
            <p className={`text-[10px] font-bold mt-1 ${avgSeoScore > 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {avgSeoScore > 75 ? "Healthy Agency" : "Action Needed"}
            </p>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">Tasks Done</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{totalTasksDone}</h3>
            <p className="text-[10px] text-teal-600 font-bold mt-1">Fixes Deployed</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Client and Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client Directory */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Portfolio Client Directory</h2>
              <p className="text-xs text-slate-500">Select any client to manage audits, rank histories, and local SEO triggers.</p>
            </div>
            <button 
              onClick={() => onNavigate("onboarding")}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-xl transition duration-150"
            >
              <PlusCircle className="w-4 h-4" /> Add Client
            </button>
          </div>

          <div className="grid gap-4">
            {clients.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl space-y-3">
                <p className="text-sm text-slate-500">No accounts onboarded yet.</p>
                <button 
                  onClick={() => onNavigate("onboarding")}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Onboard your first client now &rarr;
                </button>
              </div>
            ) : (
              clients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <div 
                    key={client.id}
                    onClick={() => onSelectClient(client)}
                    className={`group cursor-pointer border rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/20' 
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1 md:max-w-md">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-base">
                          {client.name}
                        </h3>
                        {isSelected && (
                          <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Active Choice
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.url}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                        <span>{client.businessCategory}</span>
                        <span>•</span>
                        <span>{client.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                      {/* SEO Score Indicator */}
                      <div className="text-center">
                        <span className="text-[10px] block text-slate-400 font-sans font-medium">SEO Score</span>
                        <span className={`text-lg font-extrabold ${
                          client.seoScore >= 75 ? 'text-green-600' : client.seoScore >= 50 ? 'text-amber-600' : 'text-rose-500'
                        }`}>
                          {client.seoScore || "—"}
                        </span>
                      </div>

                      {/* Keyword Count */}
                      <div className="text-center">
                        <span className="text-[10px] block text-slate-400 font-sans font-medium">Keywords</span>
                        <span className="text-lg font-bold text-slate-800">
                          {client.keywords?.length || 0}
                        </span>
                      </div>

                      {/* Progress checklist bar */}
                      <div className="w-24 space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-sans font-bold">
                          <span>Progress</span>
                          <span>{client.tasksCompleted}/{client.totalTasks}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${(client.tasksCompleted / (client.totalTasks || 8)) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition hidden md:block" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Client Quick Panel */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-6">
          <h2 className="text-md font-extrabold text-slate-900 flex items-center gap-2">
            Target Focus Panel
          </h2>

          {selectedClient ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-4 rounded-xl space-y-3 shadow-2xs">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Workspace</div>
                <div className="font-extrabold text-slate-900 text-lg leading-snug">{selectedClient.name}</div>
                <div className="text-xs text-slate-500 truncate">{selectedClient.url}</div>
              </div>

              {/* Keyword Pills */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Onboarded Keywords</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClient.keywords?.map((kw, i) => (
                    <span key={i} className="bg-slate-200/60 text-slate-800 border border-slate-200 text-[10px] px-2 py-0.5 rounded-md font-sans">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Menu Operations Link */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Direct Link Access</div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onNavigate("audit")}
                    className="bg-white border border-slate-200 hover:border-slate-300 p-3 rounded-xl text-left hover:shadow-xs transition"
                  >
                    <span className="text-xs font-bold text-slate-900 block">Site Audit</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Diagnose issues</span>
                  </button>
                  <button 
                    onClick={() => onNavigate("competitors")}
                    className="bg-white border border-slate-200 hover:border-slate-300 p-3 rounded-xl text-left hover:shadow-xs transition"
                  >
                    <span className="text-xs font-bold text-slate-900 block">Competitors</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Content Gaps</span>
                  </button>
                  <button 
                    onClick={() => onNavigate("writer")}
                    className="bg-white border border-slate-200 hover:border-slate-300 p-3 rounded-xl text-left hover:shadow-xs transition"
                  >
                    <span className="text-xs font-bold text-slate-900 block">AI Writer</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Target blogs</span>
                  </button>
                  <button 
                    onClick={() => onNavigate("rankings")}
                    className="bg-white border border-slate-200 hover:border-slate-300 p-3 rounded-xl text-left hover:shadow-xs transition"
                  >
                    <span className="text-xs font-bold text-slate-900 block">Keyword Tracks</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Google ranks</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
              <span className="text-slate-400 block text-xs">No client is currently highlighted.</span>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Select a client from the portfolio list to customize, view keyword trends, and compose optimizations!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Market Trends Section */}
      <MarketTrends />
    </div>
  );
}
