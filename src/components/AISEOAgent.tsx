import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, Send, Loader2, Sparkles, AlertCircle, Info, 
  HelpCircle, ChevronRight, User, Trash2
} from "lucide-react";
import { Client, ChatMessage } from "../types";

interface AISEOAgentProps {
  selectedClient: Client | null;
  onNavigate: (tab: string) => void;
}

export default function AISEOAgent({ selectedClient, onNavigate }: AISEOAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: "Hello! I am your **AI SEO Agent Coach**. I can help you decode search algorithm behaviors, design 30-day technical sprint plans, structure structured data markups (JSON-LD), and prioritize crawling audits issues.\n\nType your query below or tap a quick strategy card to start!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips
  const suggestPromptList = [
    { label: "Explain Core Web Vitals (LCP/CLS)", prompt: "Explain Core Web Vitals (LCP, FID and CLS) simply, and give me 3 specific code fixes to resolve a slow LCP score." },
    { label: "Draft a 30-day Local SEO Strategy", prompt: "My local client wants to rank in Google Map Packs within 30 days. Draft a week-by-week Local SEO strategy sprint including GMB checklists and reviews strategy." },
    { label: "Outline Schema Markup Principles", prompt: "Explain how Schema.org Structured Data works. Show me an example of LocalBusiness schema with nested openingHours and streetAddress properties." },
    { label: "Explain Search Intent Match", prompt: "What is Search Intent matching? Explain the differences between Commercial, Transactional and Informational keywords, and how they apply to content clustering." }
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const chatPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient?.id || null,
          messages: chatPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed sending messages to Gemini.");
      }
    } catch (err: any) {
      console.error(err);
      const systemErr: ChatMessage = {
        id: `sys-err-${Date.now()}`,
        role: "assistant",
        content: `Apologies, I hit a snag: ${err.message || "Unable to reach the indexer intelligence agent."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, systemErr]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: "Chat logs cleared. Ask me any technical SEO, crawling, or schema-org markup questions, and let's craft a perfect organic marketing campaign!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI SEO Strategy Coach</h1>
          <p className="text-slate-500 text-sm">
            {selectedClient 
              ? `Tailored strategy advisor for client ${selectedClient.name}` 
              : "General organic marketing consultant & algorithmic solver"}
          </p>
        </div>

        <button 
          onClick={clearChat}
          className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-850 px-3 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Trash2 className="w-4 h-4" /> Reset Conversation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Chat window (Left panel 3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm h-[580px] flex flex-col justify-between overflow-hidden">
          
          {/* Messages Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div 
                  key={m.id} 
                  className={`flex gap-3 max-w-4xl ${isAssistant ? '' : 'flex-row-reverse ml-auto'}`}
                >
                  {/* Avatar icon */}
                  <div className={`p-2 rounded-xl h-9 w-9 shrink-0 flex items-center justify-center ${
                    isAssistant ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-900 text-slate-100'
                  }`}>
                    {isAssistant ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-1 max-w-[85%]">
                    <div className={`p-4 rounded-2xl text-[13px] leading-relaxed break-words font-sans selection:bg-indigo-100 ${
                      isAssistant 
                        ? 'bg-slate-50 text-slate-800 rounded-tl-none font-medium' 
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}>
                      {/* Robust formatting parsing: support basic block headers and bullets */}
                      {m.content.split("\n\n").map((chunk, paragraphIndex) => {
                        // Check if it's bullet list chunk
                        if (chunk.trim().slice(0, 2) === "1." || chunk.trim().slice(0, 1) === "*" || chunk.trim().slice(0, 2) === "- ") {
                          const lines = chunk.split("\n");
                          return (
                            <ul key={paragraphIndex} className="list-disc pl-5 space-y-1.5 my-2">
                              {lines.map((ln, listLineIndex) => (
                                <li key={listLineIndex}>
                                  {ln.replace(/^(\d+\.|\*|-)\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        
                        // Parse bold text **word**
                        const boldParsed = chunk.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                        return (
                          <p 
                            key={paragraphIndex} 
                            className="mb-2 last:mb-0"
                            dangerouslySetInnerHTML={{ __html: boldParsed }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono block pl-1">{m.timestamp}</span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>

          {/* Form input controls footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
            <input 
              type="text"
              placeholder={isLoading ? "Analyzing indices..." : "e.g. Write a Schema script representing local price packages..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend(inputValue);
              }}
              className="flex-1 border border-slate-200 bg-white rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 transition font-sans"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-3 rounded-xl transition duration-150 shrink-0 flex items-center justify-center shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* Suggestion Chips sidebar (Right panel 1 col) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 lg:col-span-1">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> Technical Quick Prompts
          </h2>

          <div className="grid gap-3">
            {suggestPromptList.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(chip.prompt)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 text-left hover:shadow-2xs transition group"
                disabled={isLoading}
              >
                <div className="text-slate-800 text-xs font-bold group-hover:text-indigo-600 transition flex items-center justify-between">
                  <span>{chip.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {chip.prompt}
                </p>
              </button>
            ))}
          </div>

          {selectedClient && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
              <span className="text-[10px] text-indigo-700 font-bold block uppercase tracking-wider">Client Context Loaded</span>
              <p className="text-[11px] text-indigo-900 font-medium leading-normal block">
                The agent is pre-configured with <strong>{selectedClient.name}</strong> parameters (Industry: {selectedClient.businessCategory}, Region: {selectedClient.location}).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
