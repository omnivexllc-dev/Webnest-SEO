import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, AlertTriangle, Play, Loader2, Info, 
  HelpCircle, ArrowDown, ExternalLink, Check, AlertCircle, Sparkles, Server, Clock,
  Camera, Edit, X
} from "lucide-react";
import { Client, AuditReport } from "../types";

interface WebsiteAuditProps {
  selectedClient: Client | null;
  onRunAudit: (clientId: string, url: string) => Promise<AuditReport | null>;
  onNavigate: (tab: string) => void;
}

export default function WebsiteAudit({ selectedClient, onRunAudit, onNavigate }: WebsiteAuditProps) {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // States to allow manual editing of Crawler Live Metadata Elements
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editH1, setEditH1] = useState("");
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState("");

  const startEditingMetadata = () => {
    if (!report) return;
    setEditTitle(report.metadata.titleText || "");
    setEditDescription(report.metadata.descriptionText || "");
    setEditH1(report.metadata.h1Text || "");
    setMetadataError("");
    setIsEditingMetadata(true);
  };

  const handleSaveMetadata = async () => {
    if (!selectedClient || !report) return;
    setSavingMetadata(true);
    setMetadataError("");
    try {
      const response = await fetch(`/api/audit/${selectedClient.id}/metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleText: editTitle,
          descriptionText: editDescription,
          h1Text: editH1
        })
      });
      if (response.ok) {
        const updatedReport = await response.json();
        setReport(updatedReport);
        setIsEditingMetadata(false);
      } else {
        const errData = await response.json();
        setMetadataError(errData.error || "Failed to update meta elements.");
      }
    } catch (err: any) {
      console.error("Save metadata error:", err);
      setMetadataError("Connection failure: Failed to update SEO elements.");
    } finally {
      setSavingMetadata(false);
    }
  };

  // Fallback handler to take a beautiful PDF/PNG element shot
  const handleCaptureScreenshot = async () => {
    if (!reportRef.current) return;
    setIsCapturing(true);
    
    // Store original styles and reference list to restore after
    let originalStyles: { element: HTMLStyleElement | HTMLLinkElement, text?: string, disabled: boolean }[] = [];
    let patchedStyleElements: HTMLStyleElement[] = [];

    try {
      // Create safe RGB/RGBA representations for oklch and oklab colors to protect html2canvas from crashing
      const cleanOklch = (text: string) => {
        return text.replace(/oklch\(([^)]+)\)/g, (match, values) => {
          const parts = values.split(/[\s,/]+/).filter(Boolean);
          if (parts.length >= 3) {
            const l = parseFloat(parts[0]);
            const c = parseFloat(parts[1]);
            const h = parseFloat(parts[2]);
            const alpha = parts[3] ? parseFloat(parts[3]) : 1;
            
            if (isNaN(l) || isNaN(c) || isNaN(h)) {
              return "rgb(79, 70, 229)";
            }
            // Grey scale check (low chroma)
            if (c < 0.03) {
              const g = Math.round(l * 255);
              return `rgba(${g}, ${g}, ${g}, ${alpha})`;
            }
            
            let r = 79, g = 70, b = 229;
            if (h >= 340 || h < 45) {
              // Red/Pinkish
              r = 239; g = 68; b = 68;
            } else if (h >= 45 && h < 110) {
              // Yellow/Orange
              r = 245; g = 158; b = 11;
            } else if (h >= 110 && h < 180) {
              // Green
              r = 34; g = 197; b = 94;
            } else if (h >= 180 && h < 280) {
              // Blue/Indigo
              r = 79; g = 70; b = 229;
            } else {
              // Purple/Violet
              r = 168; g = 85; b = 247;
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
          return "rgb(79, 70, 229)";
        });
      };

      const cleanOklab = (text: string) => {
        return text.replace(/oklab\(([^)]+)\)/g, (match, values) => {
          const parts = values.split(/[\s,/]+/).filter(Boolean);
          const l = parseFloat(parts[0]);
          const alpha = parts[3] ? parseFloat(parts[3]) : 1;
          if (isNaN(l)) {
            return `rgba(79, 70, 229, ${alpha})`;
          }
          const g = Math.round(l * 255);
          return `rgba(${g}, ${g}, ${g}, ${alpha})`;
        });
      };

      // Find all style and link tags, extract CSS rules from all readable sheets
      const rules: string[] = [];
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
          const sheetRules = sheet.cssRules || sheet.rules;
          if (sheetRules && sheetRules.length > 0) {
            const sheetCss: string[] = [];
            for (let j = 0; j < sheetRules.length; j++) {
              sheetCss.push(sheetRules[j].cssText);
            }
            rules.push(sheetCss.join("\n"));
            
            const owner = sheet.ownerNode as HTMLElement | null;
            if (owner) {
              originalStyles.push({
                element: owner as HTMLStyleElement | HTMLLinkElement,
                disabled: (owner as any).disabled || false
              });
              (owner as any).disabled = true;
            }
          }
        } catch (e) {
          // Cross-origin sheet (like Google Fonts) - leave enabled
        }
      }

      // Combine all rules, clean up oklch/oklab to standard rgb/rgba fallbacks
      const combinedCssText = rules.join("\n");
      const cleanedText = cleanOklab(cleanOklch(combinedCssText));

      // Inject temporary patched style element containing clean styles
      const patchedEl = document.createElement("style");
      patchedEl.setAttribute("data-html2canvas-patched", "true");
      patchedEl.textContent = cleanedText;
      document.head.appendChild(patchedEl);
      patchedStyleElements.push(patchedEl);

      const { default: html2canvas } = await import("html2canvas");
      
      const canvas = await html2canvas(reportRef.current, {
        useCORS: true, 
        logging: false,
        backgroundColor: "#f8fafc", // slate-50 canvas framework background
        scale: 2, // High resolution pixel ratio magnification
        scrollY: -window.scrollY,
        scrollX: 0,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });

      const clientNameSanitized = selectedClient?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report";
      const timestamp = new Date().toISOString().split("T")[0];
      
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to generate image blob representation"));
            return;
          }
          try {
            const blobUrl = URL.createObjectURL(blob);
            const tempLink = document.createElement("a");
            tempLink.href = blobUrl;
            tempLink.download = `seo-site-audit-${clientNameSanitized}-${timestamp}.png`;
            document.body.appendChild(tempLink);
            tempLink.click();
            
            setTimeout(() => {
              if (tempLink.parentNode) {
                document.body.removeChild(tempLink);
              }
              URL.revokeObjectURL(blobUrl);
              resolve();
            }, 150);
          } catch (e) {
            reject(e);
          }
        }, "image/png");
      });
    } catch (err: any) {
      console.error("Screenshot capture process failure:", err);
      setErrorStatus("Failed to make screenshot: " + (err.message || err));
    } finally {
      // RESTORE ALL ORIGINAL STYLES FIRST
      for (const patchedEl of patchedStyleElements) {
        patchedEl.remove();
      }
      for (const item of originalStyles) {
        item.element.disabled = item.disabled;
      }
      setIsCapturing(false);
    }
  };

  // Auto-fetch audit if it exists
  useEffect(() => {
    if (!selectedClient) return;
    setReport(null);
    setErrorStatus("");
    
    fetch(`/api/audit/${selectedClient.id}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No previous audit file. Click 'Generate Website Audit' to crawl target domain.");
      })
      .then(data => setReport(data))
      .catch(err => setErrorStatus(err.message));
  }, [selectedClient]);

  const handleAuditClick = async () => {
    if (!selectedClient) return;
    setIsRunning(true);
    setErrorStatus("");
    
    try {
      const data = await onRunAudit(selectedClient.id, selectedClient.url);
      if (data) {
        setReport(data);
      } else {
        setErrorStatus("An error occurred during scanning. Attempt fallback parameters.");
      }
    } catch (err: any) {
      setErrorStatus(err.message || "Failed running audit scan.");
    } finally {
      setIsRunning(false);
    }
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client to Scan</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Before inspecting tags, speed variables, and site scores, select a client on the Dashboard page or onboard a new focus domain.
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

  // Get Priority Badge Color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-rose-50 text-rose-700 border border-rose-100";
      case "moderate": return "bg-amber-50 text-amber-700 border border-amber-100";
      default: return "bg-blue-50 text-blue-700 border border-blue-100";
    }
  };

  // Get Impact Badge Color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-green-100/80 text-green-800 font-bold";
      case "medium": return "bg-slate-100 text-slate-800 font-medium";
      default: return "bg-slate-50 text-slate-500 font-normal";
    }
  };

  // Compute Estimated Ranking Impact score dynamically based on fixList:
  const getRankingImpactScore = (rep: AuditReport) => {
    if (!rep || !rep.fixList) return 0;
    const totalWeight = rep.fixList.reduce((acc, fix) => {
      switch (fix.impact) {
        case "high": return acc + 25;
        case "medium": return acc + 15;
        default: return acc + 5;
      }
    }, 0);
    // Normalize and cap between 10 and 100
    return Math.min(Math.max(totalWeight, 10), 100);
  };

  const getRankingImpactText = (score: number) => {
    if (score >= 65) return "Critical Rank Opportunities";
    if (score >= 35) return "Significant Visibility Lift";
    return "Minor Positional Wins";
  };

  const getRankingImpactColorClass = (score: number) => {
    if (score >= 65) return "text-indigo-600";
    if (score >= 35) return "text-purple-600";
    return "text-cyan-600";
  };

  const getRankingImpactStrokeColor = (score: number) => {
    if (score >= 65) return "#6366f1"; // Indigo
    if (score >= 35) return "#a855f7"; // Purple
    return "#06b6d4"; // Cyan
  };

  const rankingImpactScore = report ? getRankingImpactScore(report) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-slate-900">Technical SEO Audit</h1>
          <p className="text-slate-500 text-sm">
            Diagnosing <span className="font-semibold text-slate-850">{selectedClient.name}</span> &rarr; <span className="text-indigo-600 truncate font-mono text-xs">{selectedClient.url}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {report && (
            <button
              onClick={handleCaptureScreenshot}
              disabled={isCapturing}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 min-h-[44px] sm:min-h-0 text-xs font-extrabold py-3 px-5 rounded-xl border border-slate-250 transition duration-150 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-2xs"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Capturing Report...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Take Report Screenshot</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleAuditClick}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px] sm:min-h-0 text-xs font-bold py-3 px-5 rounded-xl transition duration-150 disabled:bg-indigo-400 cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Crawling & Scanning Site...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Crawl Website Audit
              </>
            )}
          </button>
        </div>
      </div>

      {errorStatus && !report && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs p-4 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
          <div>
            <p className="font-semibold text-slate-800">Scan Status Update</p>
            <p className="mt-1">{errorStatus}</p>
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100" ref={reportRef}>
          {/* Top Score Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* SEO Score Circular Graph */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-4 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall SEO Health</span>
              <div className="relative w-36 h-36 flex items-center justify-center">
                
                {/* Score Circle Progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={report.score >= 75 ? "#10b981" : report.score >= 50 ? "#f59e0b" : "#f43f5e"}
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - report.score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold font-display text-slate-900 tracking-tight">{report.score}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-sans">/ 100</span>
                </div>
              </div>
              <p className={`text-xs font-bold ${
                report.score >= 75 ? "text-green-600" : report.score >= 50 ? "text-amber-600" : "text-rose-500"
              }`}>
                {report.score >= 75 ? "Optimal Structural Integrity" : report.score >= 50 ? "Requires Intermediate Optimization" : "Critical SEO Risks Detected"}
              </p>
            </div>

            {/* Estimated Ranking Impact Score Circular Graph */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-4 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <span>Est. Ranking Impact</span>
                <span className="group relative cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none leading-normal font-normal">
                    Aggregate search visibility score uplift opportunity from implementing optimal fixes.
                  </span>
                </span>
              </span>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={getRankingImpactStrokeColor(rankingImpactScore)}
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - rankingImpactScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold font-display text-slate-900 tracking-tight">{rankingImpactScore}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-sans">/ 100 Points</span>
                </div>
              </div>
              <p className={`text-xs font-bold ${getRankingImpactColorClass(rankingImpactScore)}`}>
                {getRankingImpactText(rankingImpactScore)}
              </p>
            </div>

            {/* Core Web Vitals Performance Stats */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Google Core Web Vitals Indicators
              </h3>
              
              <div className="space-y-4">
                {/* LCP */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Largest Contentful Paint (LCP)</span>
                    <span className={`font-bold ${report.metadata.coreWebVitals.lcp <= 2.5 ? 'text-green-600' : report.metadata.coreWebVitals.lcp <= 4.0 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {report.metadata.coreWebVitals.lcp}s
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full ${report.metadata.coreWebVitals.lcp <= 2.5 ? 'bg-green-500' : report.metadata.coreWebVitals.lcp <= 4.0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min((report.metadata.coreWebVitals.lcp / 6) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400">Target score: &lt; 2.5s for fast indexing rendering.</p>
                </div>

                {/* FID */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">First Input Delay (FID)</span>
                    <span className={`font-bold ${report.metadata.coreWebVitals.fid <= 100 ? 'text-green-600' : 'text-amber-500'}`}>
                      {report.metadata.coreWebVitals.fid} ms
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full ${report.metadata.coreWebVitals.fid <= 100 ? 'bg-green-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min((report.metadata.coreWebVitals.fid / 300) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400">Target score: &lt; 100ms layout interaction triggers.</p>
                </div>

                {/* CLS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Cumulative Layout Shift (CLS)</span>
                    <span className={`font-bold ${report.metadata.coreWebVitals.cls <= 0.1 ? 'text-green-600' : 'text-rose-500'}`}>
                      {report.metadata.coreWebVitals.cls}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full ${report.metadata.coreWebVitals.cls <= 0.1 ? 'bg-green-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min((report.metadata.coreWebVitals.cls / 0.5) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400">Target score: &lt; 0.1 to avoid content reflow shifts.</p>
                </div>
              </div>
            </div>

            {/* Quick Tech Checklist Status */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Crawler Meta-Tag Status</span>
              
              <div className="space-y-2.5">
                {/* Meta Title */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Meta Title Block</span>
                  {report.metadata.titleExists ? (
                    <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold bg-green-50 border border-green-100 px-2 py-0.5 rounded-md text-[10px]">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                      <AlertCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>

                {/* Meta Description */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Meta Description</span>
                  {report.metadata.descriptionExists ? (
                    <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold bg-green-50 border border-green-100 px-2 py-0.5 rounded-md text-[10px]">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                      <AlertCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>

                {/* H1 Tags */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Header Structure H1</span>
                  {report.metadata.h1Exists ? (
                    <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold bg-green-50 border border-green-100 px-2 py-0.5 rounded-md text-[10px]">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                      <AlertCircle className="w-3 h-3" /> Missing H1
                    </span>
                  )}
                </div>

                {/* Schema Markup */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Schema.org Structured JSON</span>
                  {report.metadata.schemaMarkupFound ? (
                    <span className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[10px]">
                      {report.metadata.schemaType || "LocalBusiness"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                      No Schema Found
                    </span>
                  )}
                </div>

                {/* Mobile Friendly */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Mobile Responsive Views</span>
                  {report.metadata.isMobileFriendly ? (
                    <span className="text-green-700 font-bold">Responsive</span>
                  ) : (
                    <span className="text-rose-600 font-semibold">Clipped Elements</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Crawler Live Metadata Details */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500" /> Crawled Raw Header Elements
              </h3>
              {!isEditingMetadata ? (
                <button
                  type="button"
                  onClick={startEditingMetadata}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100/80 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5" /> Verify Added Index Tag & Meta Description
                </button>
              ) : null}
            </div>
            
            {isEditingMetadata ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200/85 space-y-4 animate-fade-in" id="metadata-override-form">
                <div className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/50">
                  <span className="font-extrabold text-indigo-900 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-sans">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Staging Bypass & Live Tag Verification
                  </span>
                  If local port constraints, staging firewalls, or sandboxed environments prevent the network crawler from accessing your updated headers, paste the exact tags you implemented below. Saving will mark them as "Configured" and update your client's overall SEO Audit Score.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Title Input */}
                  <div className="space-y-1.5_temp">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      HTML Title Tag (&lt;title&gt;)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 border border-slate-250/70 focus:border-indigo-400 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-400 font-sans focus:outline-none transition-all"
                      placeholder="e.g. Acme Agency | High performance cloud analytics tools"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  {/* Description Input */}
                  <div className="space-y-1.5_temp">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Meta Description Content
                    </label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-50/50 border border-slate-250/70 focus:border-indigo-400 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-400 font-sans focus:outline-none transition-all resize-none"
                      placeholder="e.g. Enterprise SEO tools and rank search engine crawler optimization tools for hyper-growth startups."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>

                  {/* H1 input */}
                  <div className="space-y-1.5_temp">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Target &lt;h1&gt; Tag Text
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 border border-slate-250/70 focus:border-indigo-400 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-400 font-sans focus:outline-none transition-all"
                      placeholder="e.g. High Performance Organic Rank Growth"
                      value={editH1}
                      onChange={(e) => setEditH1(e.target.value)}
                    />
                  </div>
                </div>

                {metadataError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {metadataError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingMetadata(false)}
                    disabled={savingMetadata}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Overrides
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMetadata}
                    disabled={savingMetadata}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingMetadata ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying Metadata...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Complete Verification
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {/* Title Tag */}
                <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider block">Index Tag &lt;title&gt;</span>
                  {report.metadata.titleText ? (
                    <p className="text-slate-800 leading-relaxed break-words font-sans font-medium">{report.metadata.titleText}</p>
                  ) : (
                    <p className="text-slate-400 italic font-sans font-medium">No Title Tag was successfully parsed.</p>
                  )}
                </div>

                {/* Description Tag */}
                <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider block">Meta &lt;description&gt;</span>
                  {report.metadata.descriptionText ? (
                    <p className="text-slate-800 leading-relaxed break-words font-sans font-medium">{report.metadata.descriptionText}</p>
                  ) : (
                    <p className="text-slate-400 italic font-sans font-medium">No Meta Description Tag was successfully parsed.</p>
                  )}
                </div>

                {/* H1 Tag */}
                <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider block">Primary Heading &lt;h1&gt; Tag</span>
                  {report.metadata.h1Text ? (
                    <p className="text-slate-800 leading-relaxed break-words font-sans font-medium">{report.metadata.h1Text}</p>
                  ) : (
                    <p className="text-slate-400 italic font-sans font-medium">No H1 Tag was successfully parsed.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Priority Fix List Logs */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Priority SEO Fix Logs</h2>
              <p className="text-xs text-slate-500">Address these issues systematically. Standardizing these fixes triggers optimal organic position updates.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-sans font-bold border-b border-slate-100">
                    <th className="py-3 px-4">Focus Category</th>
                    <th className="py-3 px-4">Identified SEO Flaw</th>
                    <th className="py-3 px-4">Priority Rank</th>
                    <th className="py-3 px-4 text-center">Est. Ranking Impact</th>
                    <th className="py-3 px-4 text-right">Operation Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.fixList.map((fix) => (
                    <tr key={fix.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {fix.category}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 text-[13px]">{fix.title}</div>
                        <p className="text-slate-500 text-xs mt-1 leading-normal">{fix.description}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(fix.priority)}`}>
                          {fix.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] px-2 py-1 rounded-md uppercase tracking-wider font-semibold ${getImpactColor(fix.impact)}`}>
                          {fix.impact}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => {
                            if (fix.category.toLowerCase().includes("description") || fix.category.toLowerCase().includes("meta")) {
                              onNavigate("writer");
                            } else {
                              onNavigate("ai-agent");
                            }
                          }}
                          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-2.5 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1"
                        >
                          Solve Panel &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
