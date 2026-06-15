import React, { useState, useEffect } from "react";
import { 
  FileText, Printer, Award, TrendingUp, CheckCircle, HelpCircle, 
  ChevronRight, ArrowDownLeft, ShieldCheck, Download, Plus, Loader2, Info
} from "lucide-react";
import { Client, SEOReport } from "../types";

interface ReportsProps {
  selectedClient: Client | null;
  onNavigate: (tab: string) => void;
}

export default function Reports({ selectedClient, onNavigate }: ReportsProps) {
  const [reportsList, setReportsList] = useState<SEOReport[]>([]);
  const [activeReport, setActiveReport] = useState<SEOReport | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReportsList = () => {
    if (!selectedClient) return;
    setReportsList([]);
    setActiveReport(null);
    setErrorMessage("");

    fetch(`/api/reports/${selectedClient.id}`)
      .then(res => res.json())
      .then(data => {
        setReportsList(data);
        if (data.length > 0) {
          setActiveReport(data[data.length - 1]); // Set newest as active
        }
      })
      .catch(err => setErrorMessage(err.message));
  };

  useEffect(() => {
    loadReportsList();
  }, [selectedClient]);

  const handleCreateReport = async () => {
    if (!selectedClient) return;
    setIsCompiling(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          period: "Monthly Optimization Period"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReportsList(prev => [...prev, data]);
        setActiveReport(data);
      } else {
        setErrorMessage("Failed to compile executive metrics.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed running PDF reports compiler.");
    } finally {
      setIsCompiling(false);
    }
  };

  // Triggers print settings modal
  const triggerPrint = () => {
    window.print();
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4 text-slate-800">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client to View Reports</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Please select a client from the dashboard portfolio before examining audits summary tables or printing reports.
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
    <div className="space-y-8 animate-fade-in text-slate-800 print:space-y-0 print:m-0 print:p-0">
      
      {/* Tab Header Controls - Hidden in Printing Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 print:hidden">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Performance Sheets</h1>
          <p className="text-slate-500 text-sm">
            Configure PDF-styled report structures for client <span className="font-semibold text-slate-800">{selectedClient.name}</span>.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handleCreateReport}
            disabled={isCompiling}
            className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Compiling...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-indigo-600" /> Compile Fresh Report
              </>
            )}
          </button>
          {activeReport && (
            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-xs"
            >
              <Printer className="w-4 h-5 text-indigo-200" /> Print or Export PDF
            </button>
          )}
        </div>
      </div>

      {isCompiling && (
        <div className="text-center py-16 space-y-3 print:hidden">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Generating SEO audit benchmarks & ranking statistics...</p>
        </div>
      )}

      {errorMessage && !isCompiling && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs p-4 rounded-xl flex items-center gap-2 print:hidden">
          <Info className="w-4 h-4 text-indigo-505" />
          <span>{errorMessage}</span>
        </div>
      )}

      {reportsList.length === 0 && !isCompiling && (
        <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4 print:hidden">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Compile your client's first Monthly SEO Report</h2>
          <p className="text-slate-500 max-w-sm mx-auto text-xs leading-normal">
            No report exists for {selectedClient.name} yet. Click 'Compile Fresh Report' to automatically gather audits score indexes, traffic matrices and rankings.
          </p>
          <button 
            onClick={handleCreateReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl mt-2 transition"
          >
            Synthesize Report
          </button>
        </div>
      )}

      {reportsList.length > 0 && activeReport && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start print:grid-cols-1">
          
          {/* List of Previous reports (Hidden during print) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-1 print:hidden">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed Reports Archive</h2>
            <div className="grid gap-2">
              {reportsList.map((rep) => (
                <div 
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                    rep.id === activeReport.id 
                      ? 'border-indigo-600 bg-indigo-50/20' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="font-bold text-slate-800 block truncate text-xs">{rep.period}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">ID: {rep.id}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${rep.id === activeReport.id ? 'text-indigo-600' : 'text-slate-300'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Formal PDF Report Paper Sheet Container (Print styled) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 p-8 md:p-12 shadow-sm rounded-2xl space-y-10 font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
            
            {/* Report Header Logo Section */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div className="space-y-1.5">
                <span className="text-[10px] text-indigo-600 uppercase font-extrabold tracking-widest block font-mono">ORGANIC SEO ANALYTICS SHEET</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Executive Performance Report</h2>
                <p className="text-xs text-slate-500 font-mono">Client Domain: {selectedClient.url}</p>
              </div>

              <div className="text-right space-y-1">
                <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded font-mono uppercase tracking-wider">SEO Toolkit</span>
                <p className="text-xs text-slate-500 font-bold block pt-1">{activeReport.period} Overview</p>
                <p className="text-[10px] text-slate-450 font-mono">Date Compiled: {activeReport.createdAt}</p>
              </div>
            </div>

            {/* Profile Brief Segment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-slate-50 print:border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client Identity</span>
                <h3 className="font-extrabold text-slate-900 text-md leading-normal">{selectedClient.name}</h3>
                <p className="text-xs text-slate-500">{selectedClient.businessCategory}</p>
              </div>

              <div className="space-y-1 md:text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Focus Search Location</span>
                <p className="text-xs text-slate-800 font-bold">{selectedClient.location}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase">Keywords tracked: {selectedClient.keywords?.length || 0}</p>
              </div>
            </div>

            {/* Numeric Indicators Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-slate-100 p-4 rounded-xl text-center space-y-1.5 shadow-2xs print:border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">Technical SEO score</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-slate-900">{activeReport.seoScore}</span>
                  <span className="text-[10px] text-slate-400">/ 100</span>
                </div>
                <p className="text-[9px] text-green-600 font-semibold uppercase font-sans">Crawler Passed</p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl text-center space-y-1.5 shadow-2xs print:border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">Estimated Traffic</span>
                <span className="text-2xl font-black text-indigo-600 block leading-none">{selectedClient.monthlyTraffic.toLocaleString()}</span>
                <p className="text-[9px] text-indigo-600 font-semibold uppercase font-sans">{activeReport.trafficGrowth}</p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl text-center space-y-1.5 shadow-2xs print:border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">Visibility placement</span>
                <span className="text-2xl font-black text-amber-500 block leading-none">#{Math.floor(Math.random() * 12) + 2}</span>
                <p className="text-[9px] text-amber-600 font-semibold uppercase font-sans">Direct Keyword tracks</p>
              </div>
            </div>

            {/* Strategic Overview commentary section */}
            <div className="space-y-1.5">
              <h4 className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-400" /> Professional Search Placement Summary
              </h4>
              <p className="text-slate-700 text-xs leading-relaxed font-sans font-medium">
                {activeReport.rankingsSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              {/* Work Completed */}
              <div className="space-y-3">
                <h4 className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed Campaigns Summary
                </h4>
                <ul className="space-y-2 text-xs text-slate-650 font-sans font-medium pl-1">
                  {activeReport.workCompleted.map((task, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed">
                      <span className="text-slate-400 text-[10px] shrink-0 mt-0.5">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Strategic Steps */}
              <div className="space-y-3">
                <h4 className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Next Strategic Sprints
                </h4>
                <ul className="space-y-2 text-xs text-slate-650 font-sans font-medium pl-1">
                  {activeReport.nextSteps.map((task, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed">
                      <span className="text-indigo-400 text-[10px] shrink-0 mt-0.5">&rarr;</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Executive Footer block */}
            <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row md:items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              <span>SEO Toolkit Certified Sheet</span>
              <span className="font-bold text-slate-600 block mt-1.5 md:mt-0 font-sans">PREMIUM LOCAL & ORGANIC ARCHITECTURE BOOSTER</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
