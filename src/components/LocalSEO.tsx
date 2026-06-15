import React, { useState } from "react";
import { 
  Building, CheckCircle2, Star, Sparkles, MessageSquare, 
  MapPin, Loader2, Copy, Check, Circle, ExternalLink, HelpCircle, Info
} from "lucide-react";
import { Client } from "../types";

interface LocalSEOProps {
  selectedClient: Client | null;
  onNavigate: (tab: string) => void;
}

export default function LocalSEO({ selectedClient, onNavigate }: LocalSEOProps) {
  const [reviewInput, setReviewInput] = useState("");
  const [starCount, setStarCount] = useState<5 | 4 | 3 | 2 | 1>(5);
  const [responderTone, setResponderTone] = useState("Empathetic & Professional");
  const [generatedResponder, setGeneratedResponder] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  // GBP checklist state
  const [gbpTasks, setGbpTasks] = useState([
    { id: "gbp-1", title: "Claim & Verify Google Business Profile Listing", done: true },
    { id: "gbp-2", title: "Insert primary & secondary business categories", done: true },
    { id: "gbp-3", title: "Synchronize NAP (Name, Address, Phone) precisely across site", done: false },
    { id: "gbp-4", title: "Upload 10+ high-quality geotagged images of client team/projects", done: false },
    { id: "gbp-5", title: "Add structured LocalBusiness Schema JSON-LD on index footer", done: true },
    { id: "gbp-6", title: "Establish recurring Google Business Profile updates sequence (Weekly)", done: false }
  ]);

  const toggleTask = (id: string) => {
    setGbpTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleResponderDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !reviewInput.trim()) return;

    setIsCompiling(true);
    setGeneratedResponder("");
    setCopiedStatus(false);

    try {
      // Direct call to API chat model with direct instructions to act as reviewer autoresponder
      const messages = [
        {
          role: "user",
          content: `Draft a professional review reply for my client "${selectedClient.name}" in "${selectedClient.location}".
Reviewer Star rating: ${starCount}/5 stars
Review Content: "${reviewInput}"
Request Responder Tone: ${responderTone}

Keyword inclusion constraint: Naturally integrate localized keyword anchors like "${selectedClient.keywords[0] || "expert quality service"}" or "${selectedClient.keywords[1] || "services"}" at least once. Please maintain elegant customer support etiquette, express gratitude (or apologize constructively if stars are low), and invite them back. Respond with ONLY the reply text.`
        }
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClient.id, messages })
      });

      const data = await res.json();
      if (data && data.content) {
        setGeneratedResponder(data.content);
      } else {
        setGeneratedResponder("Thank you so much for choosing our services! We appreciate your valuable support.");
      }
    } catch (err) {
      console.error(err);
      setGeneratedResponder("Valuable review responder draft failed. Please check backend connection.");
    } finally {
      setIsCompiling(false);
    }
  };

  const copyResponder = () => {
    if (!generatedResponder) return;
    navigator.clipboard.writeText(generatedResponder);
    setCopiedStatus(true);
    setTimeout(() => {
      setCopiedStatus(false);
    }, 1800);
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <Building className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client for Local SEO</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Before auditing maps compliance, Yelp structures or drafting review responders, highlight a client in the Dashboard.
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

  const completedTaskCount = gbpTasks.filter(t => t.done).length;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      {/* Header element */}
      <div className="space-y-1 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Local SEO Booster</h1>
        <p className="text-slate-500 text-sm">
          Optimize Google Maps slots, respond to Yelp reviews, and audits local directory placements for <span className="font-semibold text-slate-800">{selectedClient.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* GBP Checklist (Left Panel) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Google Maps Placements</h3>
              <p className="text-[10px] text-slate-400">Map pack rank factors checklist</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
              <span>Task Progress Checklist</span>
              <span>{completedTaskCount}/{gbpTasks.length}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(completedTaskCount / gbpTasks.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Checklist list */}
          <div className="space-y-2.5">
            {gbpTasks.map((t) => (
              <div 
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex items-start gap-2.5 p-3.5 border border-slate-50 hover:bg-slate-50 rounded-xl cursor-pointer transition select-none"
              >
                {t.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                )}
                <span className={`text-xs leading-normal font-sans font-medium ${t.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {t.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Reviews Responder Grid */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><MessageSquare className="w-4.5 h-4.5" /></div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI maps Review Response Generator</h3>
              <p className="text-[11px] text-slate-500">Boost authority weights by replying keyword-enriched sentences to local directories reviews.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <form onSubmit={handleResponderDraft} className="space-y-4">
              {/* Review Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Raw Review Copy</label>
                <textarea
                  rows={4}
                  placeholder="Paste review here (e.g., 'Loved their garden design! Portland yards replaced all my dry weeds with clovers, they did a wonderful aeration work!')"
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  required
                ></textarea>
              </div>

              {/* Stars & Tone selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Reviewer Stars</label>
                  <select
                    value={starCount}
                    onChange={(e) => setStarCount(parseInt(e.target.value) as any)}
                    className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-semibold"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                    <option value="2">⭐⭐ (2 Stars)</option>
                    <option value="1">⭐ (1 Star)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Responder Accent Tone</label>
                  <select
                    value={responderTone}
                    onChange={(e) => setResponderTone(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-semibold"
                  >
                    <option value="Gratitude & Warmth">Gratitude & Warmth</option>
                    <option value="Professional & Descriptive">Professional & Descriptive</option>
                    <option value="Apologetic & Empathetic">Apologetic & Empathetic</option>
                    <option value="Constructive Outreach">Constructive Solutions</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCompiling}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  {isCompiling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Tailoring responder copy...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" /> Auto-Construct Maps Reply
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Generated Reply Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 min-h-[220px] flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Structured Client Auto-Reply</span>
                
                {generatedResponder ? (
                  <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium italic">
                    "{generatedResponder}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Paste a Yelp/Google Local rating review, configure rating parameter stars, and click 'Auto-Construct' to compose an auto-reply including localized keyword anchors!
                  </p>
                )}
              </div>

              {generatedResponder && (
                <div className="pt-4 border-t border-slate-200/50 flex justify-end">
                  <button
                    onClick={copyResponder}
                    className="bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 transition"
                  >
                    {copiedStatus ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Responder
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Directory Listings Tracker (Footer segment) */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3.5">Local Citation Authority Tracker</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                <span className="font-bold text-slate-700">Yelp Listings</span>
                <span className="bg-green-50 border border-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded text-[9px]">Synced</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                <span className="font-bold text-slate-700">Apple Maps</span>
                <span className="bg-green-50 border border-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded text-[9px]">Synced</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                <span className="font-bold text-slate-700">Bing Places</span>
                <span className="bg-amber-50 border border-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded text-[9px]">Pending</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                <span className="font-bold text-slate-700">YellowPages</span>
                <span className="bg-green-50 border border-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded text-[9px]">Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
