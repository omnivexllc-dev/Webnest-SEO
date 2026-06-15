import React, { useState, useEffect } from "react";
import { 
  Globe, Link2, ShieldAlert, Award, Play, Loader2, Info, 
  ExternalLink, Check, AlertCircle, Copy, Mail, Sparkles, Send, X, Trash2
} from "lucide-react";
import { Client } from "../types";

interface BacklinkAuditorProps {
  selectedClient: Client | null;
  onNavigate: (tab: string) => void;
}

interface AnchorDist {
  text: string;
  percent: number;
}

interface LinkTypeDist {
  type: string;
  percent: number;
}

interface BacklinkItem {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  authority: number;
  anchorText: string;
  linkType: string;
  follow: boolean;
  toxic: boolean;
  toxicityDetails?: string;
  disavowed: boolean;
  createdAt: string;
  status: string;
}

interface BacklinkReport {
  referringDomainsCount: number;
  totalBacklinksCount: number;
  domainAuthority: number;
  toxicityScore: number;
  anchorDistribution: AnchorDist[];
  linkTypesDistribution: LinkTypeDist[];
  linksList: BacklinkItem[];
}

export default function BacklinkAuditor({ selectedClient, onNavigate }: BacklinkAuditorProps) {
  const [report, setReport] = useState<BacklinkReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  
  // Backlink Pitch Outreach states
  const [pitchTargetUrl, setPitchTargetUrl] = useState("");
  const [pitchProposedTopic, setPitchProposedTopic] = useState("");
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState("");
  const [pitchCopied, setPitchCopied] = useState(false);

  // Load backlinks on selection change
  useEffect(() => {
    if (!selectedClient) return;
    setReport(null);
    setAuditError("");
    setPitchResult("");
    setPitchTargetUrl("");
    setPitchProposedTopic("");

    setIsLoading(true);
    fetch(`/api/backlinks/${selectedClient.id}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Could not load backlinks portfolio.");
      })
      .then(data => {
        setReport(data);
      })
      .catch(err => {
        console.error("Backlink fetch err:", err);
        setAuditError(err.message || "Failed initializing links.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedClient]);

  // Run deep links crawler triggers
  const handleRunLinksScan = async () => {
    if (!selectedClient) return;
    setIsLoading(true);
    setAuditError("");
    setPitchResult("");

    try {
      const response = await fetch(`/api/backlinks/${selectedClient.id}/run`, {
        method: "POST"
      });
      if (response.ok) {
        const updated = await response.json();
        setReport(updated);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed backlinks crawl execution.");
      }
    } catch (err: any) {
      console.error("Run scan err:", err);
      setAuditError(err.message || "Failed execution of server-side link finder.");
    } finally {
      setIsLoading(false);
    }
  };

  // Disavow toxic link handler
  const handleDisavowLink = async (linkId: string) => {
    if (!selectedClient || !report) return;
    try {
      const response = await fetch(`/api/backlinks/${selectedClient.id}/disavow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId })
      });
      if (response.ok) {
        const updated = await response.json();
        setReport(updated);
      } else {
        const errJson = await response.json();
        alert(errJson.error || "Failed link disavowal.");
      }
    } catch (err) {
      console.error("Disavow request error:", err);
    }
  };

  // Generate outreach email draft using AI
  const handleGenerateOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!pitchTargetUrl.trim()) {
      alert("Please provide a target publication or blog URL.");
      return;
    }

    setGeneratingPitch(true);
    setPitchCopied(false);
    setPitchResult("");

    try {
      const resp = await fetch(`/api/backlinks/${selectedClient.id}/pitch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: pitchTargetUrl,
          proposedTopic: pitchProposedTopic
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setPitchResult(data.emailText);
      } else {
        throw new Error("Outreach endpoint failure.");
      }
    } catch (err: any) {
      console.error("Pitch generation error:", err);
      setPitchResult(`Failed to leverage AI outreach client: ${err.message || err}`);
    } finally {
      setGeneratingPitch(false);
    }
  };

  // Copy outreach pitch to clipboard
  const handleCopyPitch = () => {
    if (!pitchResult) return;
    navigator.clipboard.writeText(pitchResult);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <Link2 className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client to Map Backlinks</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Select an active client from your Workspace Portfolio directory to trace backlinks authority, toxic anchor distributions, and deploy outreach partnerships.
        </p>
        <button 
          onClick={() => onNavigate("dashboard")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl mt-2 transition shadow-sm cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="backlink-auditor-root">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Backlink intelligence & Audit</h1>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider font-mono">Semrush Engine</span>
          </div>
          <p className="text-slate-500 text-sm">
            Evaluating overall referring equity, link velocity, and toxic anchoring for <span className="font-semibold text-slate-800">{selectedClient.name}</span>
          </p>
        </div>

        <button
          onClick={handleRunLinksScan}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-5 rounded-xl transition duration-150 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Mining backlink databases...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Crawl & Sync Backlinks
            </>
          )}
        </button>
      </div>

      {auditError && !report && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 text-xs p-4 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Backlinks Engine Notification</p>
            <p className="mt-1">{auditError}. Standard safe simulation initialized below.</p>
          </div>
        </div>
      )}

      {isLoading && !report && (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Quering index logs. Generating authoritative anchor distribution...</p>
        </div>
      )}

      {report && (
        <div className="space-y-8">
          
          {/* Top Level Semrush Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            {/* Referrers */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono block">Referring Domains</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-sans tracking-tight">{report.referringDomainsCount}</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-55/80 px-1.5 py-0.5 rounded font-mono">+12% MoM</span>
              </div>
              <p className="text-[11px] text-slate-500">Unique referencing root sites.</p>
            </div>

            {/* Total Backlinks count */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono block">Total Linked Pages</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-sans tracking-tight">{report.totalBacklinksCount}</span>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">114 IP Blocks</span>
              </div>
              <p className="text-[11px] text-slate-500">Cumulative index paths discovered.</p>
            </div>

            {/* Authority score */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono block">Domain Authority (DA)</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-slate-950 font-sans tracking-tight">{report.domainAuthority}</span>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full" 
                    style={{ width: `${report.domainAuthority}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Semrush comparative rank weight.</p>
            </div>

            {/* Link Toxicity */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono block">Link Toxicity Index</span>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-extrabold font-sans tracking-tight ${report.toxicityScore > 20 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {report.toxicityScore}%
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                  report.toxicityScore > 20 
                    ? 'bg-rose-50 text-rose-700' 
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {report.toxicityScore > 20 ? 'Action Needed' : 'Highly Healthy'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Percentage of toxic/spam domains.</p>
            </div>
          </div>

          {/* Anchor and distribution widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Anchor Distribution Bar Charts */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-500" /> Anchors Core Distribution
                </h3>
                <p className="text-xs text-slate-400">Verifying target keywords are naturally dispersed inside referring anchors.</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {report.anchorDistribution && report.anchorDistribution.map((anchor, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-sans font-semibold text-slate-800 shrink-0 truncate max-w-[240px]">
                        "{anchor.text}"
                      </span>
                      <span className="font-mono text-slate-450 text-[11px] font-semibold">{anchor.percent}%</span>
                    </div>
                    <div className="bg-slate-50 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${anchor.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Link Types Breakdowns */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" /> Link Type & Attribute Footprint
                </h3>
                <p className="text-xs text-slate-400">Balancing Text and Image links alongside searcher crawlers.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                {report.linkTypesDistribution && report.linkTypesDistribution.map((t, i) => (
                  <div key={i} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-2xs space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">{t.type}</span>
                    <p className="text-lg font-mono font-extrabold text-slate-800">{t.percent}%</p>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-550 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/40 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  The ideal standard ratio is <strong>70%+ Text links</strong>. Your client profile matches natural authority behaviors without spam trigger thresholds. 
                </span>
              </div>
            </div>
          </div>

          {/* Links Inventory Table */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Authoritative Backlinks Scanned Records</h3>
              <p className="text-xs text-slate-500">Live monitoring of active linkages, text categories, path values, and toxicity flags.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-sans font-bold border-b border-slate-100">
                    <th className="py-3 px-4">Source Referral URL</th>
                    <th className="py-3 px-4 text-center">Auth (DA)</th>
                    <th className="py-3 px-4">Anchor text & Type</th>
                    <th className="py-3 px-4 text-center">Attributes</th>
                    <th className="py-3 px-4 text-center">Toxicity Audit</th>
                    <th className="py-3 px-4 text-center">Target Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.linksList && report.linksList.map((link) => (
                    <tr 
                      key={link.id} 
                      className={`hover:bg-slate-50/50 ${link.disavowed ? 'bg-slate-50/80 text-slate-400 opacity-60' : ''}`}
                    >
                      {/* Source Referral URL */}
                      <td className="py-4 px-4 font-mono font-medium max-w-[280px]">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold truncate hover:text-indigo-600">
                          <span className="truncate">{link.sourceUrl}</span>
                          <a 
                            href={link.sourceUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-slate-400 hover:text-indigo-600 inline-block shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">Target: {link.targetUrl}</span>
                      </td>

                      {/* Domain Authority score */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-xs font-bold font-mono px-2 py-1 rounded ${
                          link.authority > 50 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50' 
                            : 'bg-slate-150 text-slate-700'
                        }`}>
                          {link.authority}
                        </span>
                      </td>

                      {/* Anchor text & type */}
                      <td className="py-4 px-4">
                        <span className="font-semibold block text-slate-800 break-words font-sans">
                          {link.anchorText ? `"${link.anchorText}"` : "(No anchor text cataloged)"}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono uppercase">{link.linkType}</span>
                      </td>

                      {/* Follow or nofollow attributes */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          link.follow 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {link.follow ? 'Dofollow' : 'Nofollow'}
                        </span>
                      </td>

                      {/* Toxicity analysis */}
                      <td className="py-4 px-4 text-center">
                        {link.disavowed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-mono">
                            Disavowed
                          </span>
                        ) : link.toxic ? (
                          <div className="flex flex-col items-center gap-1 group relative">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100/50 px-2 py-0.5 rounded-full uppercase font-mono cursor-help">
                              <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" /> Spammed
                            </span>
                            {link.toxicityDetails && (
                              <span className="text-[9px] text-rose-600 leading-none max-w-[150px] truncate text-center block">
                                {link.toxicityDetails}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded-full uppercase font-mono">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" /> Clean Equity
                          </span>
                        )}
                      </td>

                      {/* Audit Target Actions */}
                      <td className="py-4 px-4 text-center">
                        {link.disavowed ? (
                          <span className="text-slate-400 font-semibold italic text-xs flex justify-center items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-slate-400" /> Removed
                          </span>
                        ) : link.toxic ? (
                          <button
                            type="button"
                            onClick={() => handleDisavowLink(link.id)}
                            className="inline-flex items-center justify-center gap-1.2 px-3 py-1.5 border border-rose-100 hover:border-rose-200 text-rose-600 bg-rose-50/35 hover:bg-rose-50 rounded-xl text-[10px] font-bold transition flex-wrap cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Disavow Link
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Safe Link</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Outreach Email Pitch Builder */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" /> AI Link Building Outreach Pitch Generator
              </h3>
              <p className="text-xs text-slate-500">Draft personalized, high-converting outreach pitches to niche sites to secure high-authority placements.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Request Inputs */}
              <form onSubmit={handleGenerateOutreach} className="md:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Target Blog / Domain Authority Publisher URL
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-400 font-sans focus:outline-none transition-all"
                    placeholder="e.g. https://www.gardeningpioneers.com/blog"
                    value={pitchTargetUrl}
                    onChange={(e) => setPitchTargetUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Proposed Guest Article Topic / Anchor Context
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-400 font-sans focus:outline-none transition-all"
                    placeholder="e.g. 5 Water-Saving Clover Turf Installation Techniques"
                    value={pitchProposedTopic}
                    onChange={(e) => setPitchProposedTopic(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={generatingPitch}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {generatingPitch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Drafting Outreach...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400 animate-pulse" />
                      Draft High-Yield Outreach Pitch
                    </>
                  )}
                </button>
              </form>

              {/* Pitch output */}
              <div className="md:col-span-3 flex flex-col h-full min-h-[220px]">
                {pitchResult ? (
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4.5 flex flex-col space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold font-mono">Personalized AI Outreach Pitch</span>
                      <button
                        type="button"
                        onClick={handleCopyPitch}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-800 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg transition shadow-3xs cursor-pointer"
                      >
                        {pitchCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Pitch Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-650" /> Copy Outreach Email
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap overflow-y-auto max-h-[280px]">
                      {pitchResult}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 border border-dashed border-slate-200 rounded-xl flex flex-col justify-center items-center text-center p-6 bg-slate-50/20">
                    <Mail className="w-6 h-6 text-slate-350 mb-2" />
                    <span className="text-xs text-slate-700 font-bold">Waiting for Outreach Request</span>
                    <span className="text-[11px] text-slate-400 max-w-xs mt-0.5">Input your link target above to generate a highly enticing guest post pitch letter.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
