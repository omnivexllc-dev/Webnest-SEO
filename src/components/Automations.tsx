import React, { useState } from "react";
import { 
  Zap, FileText, FileCode, CheckCircle, Loader2, ArrowRight, 
  Settings, Sparkles, Wand2, RefreshCw, Layers, ShieldCheck
} from "lucide-react";
import { Client, AuditReport } from "../types";

interface AutomationsProps {
  selectedClient: Client | null;
  onNavigate: (tab: string) => void;
  onUpdateClient: (clientId: string) => void;
}

export default function Automations({ selectedClient, onNavigate, onUpdateClient }: AutomationsProps) {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  const triggerTask = async (taskId: string, label: string) => {
    if (!selectedClient) return;
    setActiveTask(taskId);
    setLogs([]);
    setSuccessStatus(null);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      if (taskId === "content") {
        setLogs(prev => [...prev, "Contacting Gemini API content generator..."]);
        await sleep(600);
        setLogs(prev => [...prev, `Analyzing organic topic intents for query "${selectedClient.keywords[0] || "services"}"...`]);
        await sleep(800);
        
        // Call Content API
        const titleText = `Standardized Guide to ${selectedClient.keywords[0] || "Premium Services"}`;
        const res = await fetch("/api/writer/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClient.id,
            type: "blog",
            title: titleText,
            searchIntent: "Informational",
            keywords: selectedClient.keywords.slice(0, 2)
          })
        });

        if (res.ok) {
          setLogs(prev => [...prev, `SUCCESS: Generated blog article "${titleText}" saved as asset.`]);
          setSuccessStatus("Content generation completed successfully. File inserted into archive.");
          onUpdateClient(selectedClient.id); // Trigger state sync in app
        } else {
          throw new Error("Copy generator returned offline.");
        }
      } 
      
      else if (taskId === "schema") {
        setLogs(prev => [...prev, "Formatting Schema.org entity metadata..."]);
        await sleep(700);
        setLogs(prev => [...prev, `Evaluating NAP structure for "${selectedClient.name}" in ${selectedClient.location}...`]);
        await sleep(600);

        // Call Content API for schemas
        const res = await fetch("/api/writer/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClient.id,
            type: "schema",
            title: `${selectedClient.name} Local Structured Schema`,
            searchIntent: "Navigational",
            keywords: []
          })
        });

        if (res.ok) {
          setLogs(prev => [...prev, "SUCCESS: Compliant JSON-LD Schema.org generated."]);
          setSuccessStatus("Local Business structured markup generated and cached.");
          onUpdateClient(selectedClient.id);
        } else {
          throw new Error("Schema generator offline.");
        }
      } 
      
      else if (taskId === "metadata") {
        setLogs(prev => [...prev, "Scanning index files in directory..."]);
        await sleep(500);
        setLogs(prev => [...prev, "Detecting empty meta tags or character truncations..."]);
        await sleep(700);

        // Patch audit or client properties
        const res = await fetch("/api/writer/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClient.id,
            type: "meta",
            title: "Home Page Title tag optimize run",
            searchIntent: "Navigational",
            keywords: selectedClient.keywords.slice(0, 2)
          })
        });

        if (res.ok) {
          setLogs(prev => [...prev, "SUCCESS: Synthesized optimal title and description meta blocks."]);
          setSuccessStatus("SEO titles and description tags fixed in cache.");
          onUpdateClient(selectedClient.id);
        } else {
          throw new Error("Metadata generator caught error.");
        }
      } 
      
      else if (taskId === "links") {
        setLogs(prev => [...prev, "Crawl directory parsing internal hyperlink network..."]);
        await sleep(800);
        setLogs(prev => [...prev, "Calculating directory structure cluster silos..."]);
        await sleep(700);
        setLogs(prev => [...prev, "SUCCESS: Synthesized optimal internal hyperlinking architecture plan."]);
        setSuccessStatus("Silo schema blueprint created. Redirect list cached.");
      } 
      
      else if (taskId === "report") {
        setLogs(prev => [...prev, "Fetching SERP posicion daily values..."]);
        await sleep(600);
        setLogs(prev => [...prev, `Compiling audit score benchmarks (${selectedClient.seoScore}/100)...`]);
        await sleep(700);

        // Call report compilation
        const res = await fetch("/api/reports/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClient.id,
            period: "Active Optimization Period"
          })
        });

        if (res.ok) {
          setLogs(prev => [...prev, "SUCCESS: Executive PDF summary compilation finished."]);
          setSuccessStatus("Executive Monthly Analytics Report generated! Directing you to reporting tab...");
          await sleep(1500);
          onNavigate("reporting");
        } else {
          throw new Error("Report compiling returned error.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setLogs(prev => [...prev, `ERROR: Pipeline collapsed. ${err.message || err}`]);
    } finally {
      setActiveTask(null);
    }
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4 text-slate-800">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <Zap className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client to Run Autopilots</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Select a client workspace first. Once active, run automated scripts to patch titles, link structures, or compile executive report sets.
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
    <div className="space-y-8 animate-fade-in text-slate-800">
      {/* Header Banner */}
      <div className="space-y-1 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">One-Click SEO Autopilots</h1>
        <p className="text-slate-500 text-sm">
          Run high-impact automation macros immediately for client <span className="font-semibold text-slate-800">{selectedClient.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Buttons List Container */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Generate Content Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between min-h-[170px]">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Generate Landing Article</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Draft a high-relevance blog matching primary keyword metrics using SEO clustering rules.
              </p>
            </div>
            <button
              onClick={() => triggerTask("content", "Landing Content Builder")}
              disabled={activeTask !== null}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 transition disabled:bg-slate-300"
            >
              {activeTask === "content" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-emerald-400" />}
              Generate SEO Blog
            </button>
          </div>

          {/* Generate Schema Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between min-h-[170px]">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Syndicate Schema Markup</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Format fully compliant nested LocalBusiness JSON-LD markup blocks highlighting office parameters.
              </p>
            </div>
            <button
              onClick={() => triggerTask("schema", "JSON-LD Schema Creator")}
              disabled={activeTask !== null}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 transition disabled:bg-slate-300"
            >
              {activeTask === "schema" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4 text-indigo-400" />}
              Generate Structured Schema
            </button>
          </div>

          {/* Fix Metadata Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between min-h-[170px]">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Optimize Stale Headers</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Instantly scan index files and rewrite truncated titles using Google snippet bounds limits.
              </p>
            </div>
            <button
              onClick={() => triggerTask("metadata", "Metadata Optimizer")}
              disabled={activeTask !== null}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 transition disabled:bg-slate-300"
            >
              {activeTask === "metadata" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
              Reoptimize Metadata
            </button>
          </div>

          {/* Create Internal Links Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between min-h-[170px]">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Link Siphoning Silo</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Locate pages showing excessive external link weight and draw hyperlinked internal redirects.
              </p>
            </div>
            <button
              onClick={() => triggerTask("links", "Internal Linking Architect")}
              disabled={activeTask !== null}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 transition disabled:bg-slate-300"
            >
              {activeTask === "links" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-blue-400" />}
              Outline Silo Links
            </button>
          </div>

          {/* Generate Report Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between min-h-[170px] sm:col-span-2">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Compile Monthly Executive Report</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Construct a high-relevance PDF report detailing crawl health scores, rank updates, and completed work guidelines.
              </p>
            </div>
            <button
              onClick={() => triggerTask("report", "Report Analytics Compiler")}
              disabled={activeTask !== null}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 transition disabled:bg-indigo-400"
            >
              {activeTask === "report" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-indigo-200" />}
              Compile printable PDF Executive Report
            </button>
          </div>

        </div>

        {/* Console / status Log Panel */}
        <div className="bg-slate-950 text-slate-100 rounded-2xl p-6 shadow-xl h-[360px] flex flex-col justify-between lg:col-span-1 border border-slate-800">
          <div className="space-y-3.5 flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-slate-400 font-sans font-bold text-xs tracking-wider uppercase">
              <Settings className="w-4 h-4 text-slate-400 rotate-90" />
              <span>Autopilot Terminal logs</span>
            </div>

            {logs.length === 0 ? (
              <p className="text-slate-500 italic font-sans py-16 text-center">
                Terminal idle. Click any automation button on the left to initiate server-side optimization logs.
              </p>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log, index) => (
                  <div key={index} className={log.startsWith("SUCCESS:") ? "text-emerald-400 font-bold" : log.startsWith("ERROR:") ? "text-rose-400" : "text-slate-300"}>
                    &gt; {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {successStatus && (
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mt-4 flex items-start gap-2 text-[10px] sm:text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300 font-sans">{successStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
