import React, { useState, useEffect } from "react";
import { 
  FileText, Sparkles, Loader2, Copy, Check, Info, FileCode, CheckCircle, HelpCircle
} from "lucide-react";
import { Client, SavedArticle } from "../types";

interface AIContentWriterProps {
  selectedClient: Client | null;
  onGenerateArticle: (articleData: {
    clientId: string;
    type: "blog" | "service" | "landing" | "meta" | "faq" | "schema";
    title: string;
    searchIntent: string;
    keywords: string[];
    customPrompt?: string;
  }) => Promise<SavedArticle | null>;
  onNavigate: (tab: string) => void;
}

export default function AIContentWriter({ selectedClient, onGenerateArticle, onNavigate }: AIContentWriterProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"blog" | "service" | "landing" | "meta" | "faq" | "schema">("blog");
  const [searchIntent, setSearchIntent] = useState("Informational");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<SavedArticle | null>(null);
  const [savedArticlesList, setSavedArticlesList] = useState<SavedArticle[]>([]);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Load saved articles from server when selected client changes
  useEffect(() => {
    if (!selectedClient) return;
    setGeneratedArticle(null);
    setCopiedStatus(false);
    setErrorText("");

    fetch(`/api/writer/${selectedClient.id}`)
      .then(res => res.json())
      .then(data => setSavedArticlesList(data))
      .catch(err => console.error("Error loading articles list:", err));
  }, [selectedClient]);

  // Set default keywords from selected client and handle research prefill redirects
  useEffect(() => {
    try {
      const prefillStr = sessionStorage.getItem("seo_copilot_prefill");
      if (prefillStr) {
        const prefill = JSON.parse(prefillStr);
        if (prefill && prefill.keyword) {
          setTitle(`Comprehensive Guide to ${prefill.keyword}`);
          setSearchIntent(prefill.intent || "Informational");
          setKeywordsInput(prefill.keyword);
          setType(prefill.type || "blog");
          
          sessionStorage.removeItem("seo_copilot_prefill");
          return; // Skip normal prefill since we have an active override
        }
      }
    } catch (e) {
      console.error("Prefill parse error:", e);
    }

    if (selectedClient && selectedClient.keywords) {
      setKeywordsInput(selectedClient.keywords.slice(0, 3).join(", "));
    } else {
      setKeywordsInput("");
    }
  }, [selectedClient]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!title.trim()) {
      setErrorText("Provide a descriptive title for your writing optimization run.");
      return;
    }

    setIsLoading(true);
    setErrorText("");
    setCopiedStatus(false);

    const keywordsArray = keywordsInput
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      const resp = await onGenerateArticle({
        clientId: selectedClient.id,
        type,
        title: title.trim(),
        searchIntent,
        keywords: keywordsArray,
        customPrompt: customPrompt.trim()
      });

      if (resp) {
        setGeneratedArticle(resp);
        // Add to saved list
        setSavedArticlesList(prev => [resp, ...prev]);
        setTitle("");
        setCustomPrompt("");
      } else {
        setErrorText("AI synthesis failed. Let's try again with simplified instructions.");
      }
    } catch (err: any) {
      setErrorText(err.message || "Failed running Content Writer.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedArticle) return;
    
    // Copy content stripping tags
    const cleanText = generatedArticle.content.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(cleanText || generatedArticle.content);
    setCopiedStatus(true);
    setTimeout(() => {
      setCopiedStatus(false);
    }, 1800);
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-2xl max-w-2xl mx-auto space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select Client for AI Writer</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-xs">
          Please select a client account before creating content, landing tags, Schema markup or SEO FAQs.
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="space-y-1 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Content Writer</h1>
        <p className="text-slate-500 text-sm">
          Optimize blogs, landing copy, or structured schema for <span className="font-semibold text-slate-800">{selectedClient.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Editor Settings Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5 text-indigo-600" /> SEO Content Parameters
          </h2>

          <form onSubmit={handleGenerate} className="space-y-5 text-slate-800">
            {errorText && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl">
                {errorText}
              </div>
            )}

            {/* Content Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Content Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                >
                  <option value="blog">SEO Blog Post</option>
                  <option value="service">Service Offering Page</option>
                  <option value="landing">Target Landing Copy</option>
                  <option value="meta">Meta Titles & Descriptions</option>
                  <option value="faq">SEO FAQ Accordion List</option>
                  <option value="schema">JSON-LD Schema.org Markup</option>
                </select>
              </div>

              {/* Search Intent */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Search Intent</label>
                <select 
                  value={searchIntent} 
                  onChange={(e) => setSearchIntent(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                >
                  <option value="Informational">Informational (Know-How)</option>
                  <option value="Commercial">Commercial (Investigating)</option>
                  <option value="Transactional">Transactional (Buy/Hire)</option>
                  <option value="Navigational">Navigational (Brand Search)</option>
                </select>
              </div>
            </div>

            {/* Document Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Target Heading / Title</label>
              <input 
                type="text"
                placeholder={
                  type === "schema" ? "e.g. Eco-Friendly Landscaping Service Schema" :
                  type === "meta" ? "e.g. Home Page Optimization Title" : "e.g. 5 Native Botanical Plants Perfect for Portland Yards"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-sans"
              />
            </div>

            {/* Target Keywords */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">NLP & Semantic Entities (Comma separated)</label>
              <input 
                type="text"
                placeholder="e.g. native garden design, nachhaltig gardens portland, water audit"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
              />
            </div>

            {/* Custom AI Prompt instructions */}
            <div className="space-y-1.5 font-sans">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block flex items-center justify-between">
                <span>Special Copy Instructions (Optional)</span>
                <span className="text-[9px] text-slate-400 font-normal">NLP Entity focus</span>
              </label>
              <textarea 
                rows={3}
                placeholder="e.g. Write in a relaxed modern tone. Accent local Pacific Northwest plant species. Wrap sections in clear H2 structures."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
              ></textarea>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition duration-150 disabled:bg-indigo-400 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Drafting SEO copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Synthesize AI optimized text
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Output Screen */}
        <div className="space-y-6">
          <div className="bg-slate-950 text-slate-100 rounded-2xl p-6 shadow-xl relative min-h-[400px] flex flex-col justify-between">
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              {generatedArticle && (
                <button
                  onClick={copyToClipboard}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                  title="Copy pure text to clipboard"
                >
                  {copiedStatus ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400 font-bold" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Tags
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Writer Shell Preview */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-slate-400">SEO_WRITER_STENCIL.html</span>
              </div>

              {generatedArticle ? (
                <div 
                  className="prose prose-invert prose-xs text-sm max-h-[380px] overflow-y-auto pr-2 scrollbar-thin text-slate-300 font-sans leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: generatedArticle.content }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-500 space-y-3 font-sans">
                  <div className="p-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl animate-pulse">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs max-w-xs font-semibold text-slate-400">Writer output container is ready.</p>
                  <p className="text-[11px] text-slate-500">Configure parameters on the left and trigger synthesis to populate optimized H-structures, copy blocks, markup snippets, or answers lists!</p>
                </div>
              )}
            </div>

            {generatedArticle && (
              <div className="border-t border-slate-800 pt-3 mt-6 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Saving to Client database index</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3 h-3" /> Deployed Entity-SEO OKs
                </span>
              </div>
            )}
          </div>

          {/* List of previously generated logs for this client */}
          {savedArticlesList.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Previously Generated Files</h3>
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {savedArticlesList.map((art) => (
                  <div 
                    key={art.id} 
                    onClick={() => {
                      setGeneratedArticle(art);
                      setErrorText("");
                    }}
                    className="flex justify-between items-center text-xs p-3 hover:bg-slate-50 border border-slate-100 rounded-xl cursor-pointer transition"
                  >
                    <div className="space-y-0.5 truncate pr-4">
                      <span className="font-bold text-slate-800 hover:text-indigo-600 block truncate">{art.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-sans font-medium">{art.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{art.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
