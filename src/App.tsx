import React, { useState, useEffect } from "react";
import { 
  BarChart2, Users, FileText, Globe, Award, Sparkles, MapPin, 
  Bot, Zap, Settings, ShieldCheck, Plus, Check, FolderOpen, ChevronDown, Menu, X, Key
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import ClientOnboarding from "./components/ClientOnboarding";
import WebsiteAudit from "./components/WebsiteAudit";
import CompetitorAnalysis from "./components/CompetitorAnalysis";
import AIContentWriter from "./components/AIContentWriter";
import RankTracker from "./components/RankTracker";
import LocalSEO from "./components/LocalSEO";
import AISEOAgent from "./components/AISEOAgent";
import Automations from "./components/Automations";
import Reports from "./components/Reports";
import KeywordOpportunity from "./components/KeywordOpportunity";
import { Client } from "./types";

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load clients list on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (data.length > 0) {
          // Initialize active client workspace
          setSelectedClient(data[0]);
        }
      }
    } catch (err) {
      console.error("Failing to connect to server clients list:", err);
    }
  };

  // Sync state for a client's metrics (e.g. following completions)
  const syncClientState = async (clientId: string) => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data: Client[] = await res.json();
        setClients(data);
        const match = data.find(c => c.id === clientId);
        if (match) {
          setSelectedClient(match);
        }
      }
    } catch (err) {
      console.error("State sync failed:", err);
    }
  };

  // Onboarding action
  const handleAddClient = async (clientData: {
    name: string;
    url: string;
    businessCategory: string;
    location: string;
    keywords: string[];
  }) => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData)
      });
      if (res.ok) {
        const data = await res.json();
        setClients(prev => [...prev, data]);
        setSelectedClient(data);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // Run Crawl Audit action
  const handleRunAudit = async (clientId: string, url: string) => {
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, url })
      });
      if (res.ok) {
        const data = await res.json();
        // Sync score dynamically back to clients portfolio
        await syncClientState(clientId);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // Competitors trigger action
  const handleRunCompetitors = async (clientId: string) => {
    try {
      const res = await fetch("/api/competitors/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // Article optimization generate action
  const handleGenerateArticle = async (articleData: {
    clientId: string;
    type: "blog" | "service" | "landing" | "meta" | "faq" | "schema";
    title: string;
    searchIntent: string;
    keywords: string[];
    customPrompt?: string;
  }) => {
    try {
      const res = await fetch("/api/writer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });
      if (res.ok) {
        const data = await res.json();
        await syncClientState(articleData.clientId);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard Portfolio", icon: BarChart2 },
    { id: "onboarding", label: "Client Onboarding", icon: Users },
    { id: "audit", label: "Crawler Site Audit", icon: Globe },
    { id: "competitors", label: "Competitor Evaluation", icon: Award },
    { id: "writer", label: "AI Content Writer", icon: FileText },
    { id: "rankings", label: "SERP Position Tracks", icon: Sparkles },
    { id: "opportunities", label: "Keyword Opportunities", icon: Key },
    { id: "local-seo", label: "Local Maps Booster", icon: MapPin },
    { id: "ai-agent", label: "AI Strategy Coach", icon: Bot },
    { id: "automations", label: "Autopilots Box", icon: Zap },
    { id: "reporting", label: "Executive PDFs", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      
      {/* Top Navigation Frame - Hidden on Printing PDF */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Accent header */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 shadow-md flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400 animate-pulse" />
              </div>
              <div>
                <span className="font-display font-extrabold text-slate-900 tracking-tight block text-sm uppercase">SEO OPTIMATRIX</span>
                <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase font-mono leading-none">AI Agency Copilot</span>
              </div>
            </div>

            {/* Selected Client Workspace Selection */}
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Workspace:</span>
              {selectedClient ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2.5 text-xs font-semibold text-slate-800 transition shadow-2xs"
                  >
                    <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="max-w-[140px] truncate font-semibold">{selectedClient.name}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transform transition ${isClientDropdownOpen ? 'rotate-180': ''}`} />
                  </button>

                  {isClientDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 text-xs select-none">
                      <div className="px-3 py-2 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Select Active Client</div>
                      {clients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c);
                            setIsClientDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between font-medium ${c.id === selectedClient.id ? 'text-indigo-650 bg-indigo-50/30 font-bold': 'text-slate-700'}`}
                        >
                          <span className="truncate">{c.name}</span>
                          {c.id === selectedClient.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-semibold italic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">No Clients Onboarded</span>
              )}
            </div>

            {/* Mobile menu slide activator */}
            <div className="flex items-center sm:hidden gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 border border-slate-200 p-2.5 rounded-xl bg-slate-50 transition"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Structural Body View (Flex layout block) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar (Desk default view) - Hidden on print */}
        <aside className="w-full md:w-64 shrink-0 space-y-4 hidden sm:block print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block px-3 mb-3 font-mono">WORKSPACE CHANNELS</span>
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-tight transition ${
                    isActive 
                      ? "bg-slate-800 text-white font-bold border border-slate-700/50 shadow-inner" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400': 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Sleek Theme custom Pro Badge footer inside Sidebar */}
            <div className="mt-4 pt-4 border-t border-slate-800 px-2">
              <div className="bg-indigo-600 rounded-xl p-3.5 text-white text-xs font-medium relative overflow-hidden shadow-lg shadow-indigo-950/40">
                <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 opacity-15">
                  <Zap className="w-16 h-16 text-white" />
                </div>
                <div className="flex justify-between items-center relative z-10 mb-1">
                  <span className="font-extrabold tracking-wider uppercase text-[9px] px-1.5 py-0.5 bg-indigo-500/50 rounded text-indigo-100">PRO LEVEL</span>
                  <Award className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="text-[11px] text-indigo-100 font-semibold mb-1">Automations Active</div>
                <div className="text-[10px] text-indigo-200 leading-snug">Continuous AI crawl is listening.</div>
              </div>
            </div>

          </div>
        </aside>

        {/* Mobile menu navigation overlays */}
        {isMobileMenuOpen && (
          <div className="sm:hidden fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex pt-16 justify-end">
            <div className="w-72 bg-white h-screen shadow-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-extrabold text-slate-900 text-sm">Operation Hub Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 p-1 font-bold">Close</button>
              </div>

              {/* Client select row on Mobile dropdown */}
              {selectedClient && (
                <div className="space-y-1 bg-slate-50 p-2.5 border border-slate-100 rounded-xl">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Client Profile:</span>
                  <select 
                    value={selectedClient.id}
                    onChange={(e) => {
                      const match = clients.find(c => c.id === e.target.value);
                      if (match) setSelectedClient(match);
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-semibold"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5 overflow-y-auto max-h-[70%]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive 
                          ? "bg-slate-900 text-white" 
                          : "text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Inner Tab Output Screen */}
        <main className="flex-1 bg-white sm:bg-transparent sm:border-0 sm:shadow-none min-w-0 print:w-full print:bg-white">
          {activeTab === "dashboard" && (
            <Dashboard 
              clients={clients} 
              selectedClient={selectedClient} 
              onSelectClient={setSelectedClient}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "onboarding" && (
            <ClientOnboarding 
              onAddClient={handleAddClient} 
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "audit" && (
            <WebsiteAudit 
              selectedClient={selectedClient} 
              onRunAudit={handleRunAudit}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "competitors" && (
            <CompetitorAnalysis 
              selectedClient={selectedClient} 
              onRunCompetitors={handleRunCompetitors}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "writer" && (
            <AIContentWriter 
              selectedClient={selectedClient} 
              onGenerateArticle={handleGenerateArticle}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "rankings" && (
            <RankTracker 
              selectedClient={selectedClient} 
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "opportunities" && (
            <KeywordOpportunity 
              selectedClient={selectedClient}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "local-seo" && (
            <LocalSEO 
              selectedClient={selectedClient} 
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "ai-agent" && (
            <AISEOAgent 
              selectedClient={selectedClient} 
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "automations" && (
            <Automations 
              selectedClient={selectedClient} 
              onNavigate={setActiveTab}
              onUpdateClient={syncClientState}
            />
          )}

          {activeTab === "reporting" && (
            <Reports 
              selectedClient={selectedClient} 
              onNavigate={setActiveTab}
            />
          )}
        </main>

      </div>
    </div>
  );
}
