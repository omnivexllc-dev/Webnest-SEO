import React, { useState } from "react";
import { Plus, Check, Loader2, Globe, Sparkles, Navigation, ListTodo, AlertCircle } from "lucide-react";
import { Client } from "../types";

interface ClientOnboardingProps {
  onAddClient: (clientData: {
    name: string;
    url: string;
    businessCategory: string;
    location: string;
    keywords: string[];
  }) => Promise<Client | null>;
  onNavigate: (tab: string) => void;
}

export default function ClientOnboarding({ onAddClient, onNavigate }: ClientOnboardingProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addStatus, setAddStatus] = useState<"idle" | "success" | "error">("idle");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    if (!name.trim()) {
      setValidationError("Please enter a client business name.");
      return;
    }
    if (!url.trim()) {
      setValidationError("Please enter a valid website URL.");
      return;
    }
    
    // Quick sanitizing on URL format
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }

    const keywordList = keywordsText
      .split("\n")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordList.length === 0) {
      setValidationError("Please provide at least one target keyword to track.");
      return;
    }

    setIsSubmitting(true);
    setAddStatus("idle");

    try {
      const added = await onAddClient({
        name: name.trim(),
        url: cleanUrl,
        businessCategory: category.trim() || "Local Business",
        location: location.trim() || "Local Area",
        keywords: keywordList,
      });

      if (added) {
        setAddStatus("success");
        setName("");
        setUrl("");
        setCategory("");
        setLocation("");
        setKeywordsText("");
        setTimeout(() => {
          onNavigate("dashboard");
        }, 1500);
      } else {
        setAddStatus("error");
      }
    } catch (err) {
      console.error(err);
      setAddStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Onboard New Client Workspace</h1>
        <p className="text-slate-500 text-sm">
          Register their search domain parameters and target locations to initialize keyword index matching, crawler audits, and content writers.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {addStatus === "success" && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Onboarding completed! Initializing position histories & dashboards...</span>
            </div>
          )}

          {addStatus === "error" && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>An issue occurred creating the onboarding workspace on the server DB.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Business / Client Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Portland Eco-Yards"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* website URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. www.ecoyardsportland.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Business Category / Industry Focus
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Lawn Care & Xeriscapes"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Target Location */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Target SEO Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Navigation className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Portland, Oregon"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Keywords Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block flex items-center justify-between">
              <span>Target Focus Keywords</span>
              <span className="text-[10px] text-slate-400 normal-case font-normal font-sans">
                Enter each target search phrase on a new separate line
              </span>
            </label>
            <div className="relative">
              <textarea
                rows={4}
                placeholder="eco friendly landscaping portland&#10;native yard replacement&#10;organic lawn aeration"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition font-mono leading-relaxed"
                disabled={isSubmitting}
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-xs border border-slate-200 hover:border-slate-300 rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition duration-150 shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Preparing Database...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Start Client Onboarding
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
