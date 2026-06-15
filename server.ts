import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "seo_db.json");

// Middleware
app.use(express.json());

// Initialize Gemini SDK with telemetry headers
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will fallback to simulation.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Database Seeding and Helper Functions
interface DBStructure {
  clients: any[];
  audits: Record<string, any>;
  competitors: Record<string, any>;
  articles: any[];
  rankHistory: Record<string, any>;
  reports: any[];
}

const defaultDB: DBStructure = {
  clients: [
    {
      id: "greenwood-gardens",
      name: "Greenwood Gardens",
      url: "https://greenwoodgardens.example.com",
      businessCategory: "Eco-friendly Landscaping & Garden Design",
      location: "Portland, Oregon",
      keywords: ["eco friendly landscaping portland", "native garden design", "sustainable yards", "organic weed control portland"],
      onboardingDate: "2026-05-10",
      seoScore: 78,
      rankingKeywordsCount: 14,
      monthlyTraffic: 1420,
      visibilityScore: 65,
      tasksCompleted: 4,
      totalTasks: 10,
    },
    {
      id: "apex-wealth",
      name: "Apex Wealth Management",
      url: "https://apexwealthdenver.example.com",
      businessCategory: "Financial Planning & Retirement Wealth Advisory",
      location: "Denver, Colorado",
      keywords: ["financial planner denver", "retirement advisory denver", "fiduciary advisor colorado", "wealth management denver"],
      onboardingDate: "2026-06-01",
      seoScore: 45,
      rankingKeywordsCount: 5,
      monthlyTraffic: 310,
      visibilityScore: 22,
      tasksCompleted: 1,
      totalTasks: 12,
    }
  ],
  audits: {
    "greenwood-gardens": {
      clientId: "greenwood-gardens",
      score: 78,
      auditedAt: "2026-06-12",
      metadata: {
        titleExists: true,
        titleText: "Greenwood Gardens | Sustainable Garden Design & Landscaping Portland",
        descriptionExists: true,
        descriptionText: "Transform your outdoor space into an eco-friendly oasis. Native plantings, drip irrigation, organic lawn care in Portland, OR.",
        duplicateContentFound: false,
        h1Exists: true,
        h1Text: "Sustainable Landscape & Native Garden Design Portland",
        brokenLinksCount: 1,
        speedScore: 84,
        isMobileFriendly: true,
        schemaMarkupFound: true,
        schemaType: "LocalBusiness",
        internalLinkingScore: 75,
        coreWebVitals: { lcp: 2.1, cls: 0.08, fid: 45 }
      },
      fixList: [
        { id: "gg-1", title: "Add Schema.org markup for service packages", description: "Inject Service schema matching native grass replacement packages.", priority: "moderate", category: "Schema Issues", impact: "medium" },
        { id: "gg-2", title: "Repair broken resource link in footer", description: "Footer link pointing to stale water management checklist returns 404.", priority: "critical", category: "Broken Links", impact: "high" },
        { id: "gg-3", title: "Optimize index page images to WebP", description: "Convert portfolio JPEG hero blocks to modern WebP. Potential savings: 1.2s LCP reduction.", priority: "low", category: "Core Web Vitals", impact: "low" }
      ]
    },
    "apex-wealth": {
      clientId: "apex-wealth",
      score: 45,
      auditedAt: "2026-06-13",
      metadata: {
        titleExists: true,
        titleText: "Home - Apex Wealth Denver",
        descriptionExists: false,
        duplicateContentFound: true,
        h1Exists: false,
        brokenLinksCount: 12,
        speedScore: 51,
        isMobileFriendly: false,
        schemaMarkupFound: false,
        internalLinkingScore: 30,
        coreWebVitals: { lcp: 4.3, cls: 0.28, fid: 190 }
      },
      fixList: [
        { id: "aw-1", title: "Configure modern descriptive meta description tag", description: "The home page is entirely missing a meta description. Google will pull random screen scraps.", priority: "critical", category: "Missing Meta Descriptions", impact: "high" },
        { id: "aw-2", title: "Add missing primary H1 tag", description: "Identify core brand keyword 'Retirement & Fiduciary Advisory Denver' and wrap in a clean front-facing H1 block.", priority: "critical", category: "Missing H1 Tags", impact: "high" },
        { id: "aw-3", title: "Audit and fix broken internal links", description: "Found 12 broken resources leading to advisory pages and calendar scheduling hooks.", priority: "critical", category: "Broken Links", impact: "high" },
        { id: "aw-4", title: "Resolve mobile viewport content-width clipping issues", description: "The layout contains non-responsive column bounds. The page horizontally scrolls on mobile.", priority: "moderate", category: "Mobile Issues", impact: "medium" }
      ]
    }
  },
  competitors: {
    "greenwood-gardens": {
      clientId: "greenwood-gardens",
      analyzedAt: "2026-06-13",
      competitors: [
        { url: "https://portlandsustainablelandscapes.example.com", name: "Portland Sustainable Landscapes", contentLength: 1250, keywordDensity: 2.1, backlinksCount: 45, speedSeconds: 1.8, internalLinksCount: 22, schemaType: "LocalBusiness" },
        { url: "https://nativepdxgardens.example.com", name: "Native PDX Gardens & Yards", contentLength: 980, keywordDensity: 1.8, backlinksCount: 18, speedSeconds: 2.4, internalLinksCount: 14, schemaType: "None" }
      ],
      contentGaps: [
        { topic: "Native Rainwater Capture Systems", competitorStrength: "high", ourStatus: "missing", actionItem: "Write a 1200-word informative guide on rainwater harvesting incentives in Oregon." },
        { topic: "Drought-Resilient Clover Turf Alternatives", competitorStrength: "medium", ourStatus: "needs-work", actionItem: "Enhance our Service descriptions adding micro-copy on clover grass alternatives." }
      ],
      keywordGaps: [
        { keyword: "rain garden builder portland", competitorRank: 3, searchVolume: 140, difficulty: 45 },
        { keyword: "xeriscape yard installation portland", competitorRank: 5, searchVolume: 210, difficulty: 60 }
      ]
    }
  },
  articles: [
    {
      id: "art-1",
      clientId: "greenwood-gardens",
      title: "Why Switch to Native Plant Landscaping in Portland?",
      type: "blog",
      content: "<h1>Why Switch to Native Plant Landscaping in Portland?</h1><p>Transitioning your yard to prioritize local, native botanical flora yields substantial gains both for your regional aquifer and your weekend tranquility...</p>",
      createdAt: "2026-06-10",
      keywordsUsed: ["native garden design", "sustainable yards"]
    }
  ],
  rankHistory: {
    "greenwood-gardens": [
      {
        id: "r1",
        clientId: "greenwood-gardens",
        keyword: "eco friendly landscaping portland",
        currentRank: 4,
        previousRank: 6,
        volume: 320,
        history: [
          { date: "06-08", rank: 8, mobileRank: 10, localRank: 5 },
          { date: "06-09", rank: 7, mobileRank: 9, localRank: 4 },
          { date: "06-10", rank: 6, mobileRank: 8, localRank: 4 },
          { date: "06-11", rank: 6, mobileRank: 7, localRank: 4 },
          { date: "06-12", rank: 5, mobileRank: 7, localRank: 3 },
          { date: "06-13", rank: 4, mobileRank: 6, localRank: 3 },
          { date: "06-14", rank: 4, mobileRank: 5, localRank: 2 }
        ]
      },
      {
        id: "r2",
        clientId: "greenwood-gardens",
        keyword: "native garden design portland",
        currentRank: 12,
        previousRank: 15,
        volume: 480,
        history: [
          { date: "06-08", rank: 16, mobileRank: 18, localRank: 14 },
          { date: "06-10", rank: 15, mobileRank: 17, localRank: 13 },
          { date: "06-12", rank: 13, mobileRank: 15, localRank: 11 },
          { date: "06-14", rank: 12, mobileRank: 14, localRank: 10 }
        ]
      }
    ],
    "apex-wealth": [
      {
        id: "r3",
        clientId: "apex-wealth",
        keyword: "financial planner denver",
        currentRank: 38,
        previousRank: 41,
        volume: 880,
        history: [
          { date: "06-08", rank: 45, mobileRank: 50, localRank: 32 },
          { date: "06-10", rank: 43, mobileRank: 48, localRank: 32 },
          { date: "06-12", rank: 41, mobileRank: 46, localRank: 30 },
          { date: "06-14", rank: 38, mobileRank: 42, localRank: 28 }
        ]
      }
    ]
  },
  reports: [
    {
      id: "rep-1",
      clientId: "greenwood-gardens",
      createdAt: "2026-06-01",
      period: "May 2026",
      seoScore: 78,
      trafficGrowth: "+24% Month-over-Month",
      rankingsSummary: "Rankings for core keyword 'eco friendly landscaping portland' rose from spot #8 to #4, entering search views.",
      workCompleted: [
        "Constructed custom blog post 'Why Switch to Native Plant Landscaping in Portland'.",
        "Wrote structural LocalBusiness Schema.org markup.",
        "Corrected critical meta titles on index page."
      ],
      nextSteps: [
        "Launch rain garden content sequence targeting keyword voids.",
        "Fix broken footer anchor resources.",
        "Compress heavy imagery portfolio weights on home domain."
      ]
    }
  ]
};

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("DB reading failed, using defaults:", error);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
  return defaultDB;
}

function writeDB(db: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("DB writing failed:", error);
  }
}

// Ensure the local database is initialized
readDB();

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Clients Endpoints
app.get("/api/clients", (req, res) => {
  const db = readDB();
  res.json(db.clients);
});

app.post("/api/clients", (req, res) => {
  const { name, url, businessCategory, location, keywords } = req.body;
  if (!name || !url) {
    res.status(400).json({ error: "Missing client name or URL" });
    return;
  }
  const db = readDB();
  
  // Create solid clean ID
  const id = name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  
  const kwList = Array.isArray(keywords) 
    ? keywords.filter(Boolean) 
    : (typeof keywords === "string" ? keywords.split(",").map(k => k.trim()).filter(Boolean) : []);

  const newClient = {
    id,
    name,
    url,
    businessCategory: businessCategory || "General Business",
    location: location || "Global",
    keywords: kwList,
    onboardingDate: new Date().toISOString().split("T")[0],
    seoScore: 0,
    rankingKeywordsCount: 0,
    monthlyTraffic: 50, // Starting baseline
    visibilityScore: 5,
    tasksCompleted: 0,
    totalTasks: 8,
  };

  db.clients.push(newClient);

  // Initialize simulated rank history for the client's keywords
  const initialHistory: any[] = [];
  kwList.forEach((kw, index) => {
    const seedRank = Math.floor(Math.random() * 40) + 21; // between 21 and 60
    const historyData = [
      { date: "06-08", rank: seedRank + 4, mobileRank: seedRank + 5, localRank: seedRank + 2 },
      { date: "06-10", rank: seedRank + 2, mobileRank: seedRank + 3, localRank: seedRank + 1 },
      { date: "06-12", rank: seedRank + 1, mobileRank: seedRank + 1, localRank: seedRank },
      { date: "06-14", rank: seedRank, mobileRank: seedRank, localRank: seedRank }
    ];
    initialHistory.push({
      id: `r-new-${id}-${index}`,
      clientId: id,
      keyword: kw,
      currentRank: seedRank,
      previousRank: seedRank + 4,
      volume: Math.floor(Math.random() * 500) + 100,
      history: historyData
    });
  });

  db.rankHistory[id] = initialHistory;
  db.clients[db.clients.length - 1].rankingKeywordsCount = kwList.length;

  writeDB(db);
  res.status(201).json(newClient);
});

app.delete("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.clients = db.clients.filter(c => c.id !== id);
  delete db.audits[id];
  delete db.competitors[id];
  delete db.rankHistory[id];
  writeDB(db);
  res.json({ success: true, message: `Client ${id} removed` });
});

// Crawling website details helper (Real HTML scraping or high-fidelity simulation)
app.post("/api/audit/run", async (req, res) => {
  const { clientId, url, category } = req.body;
  if (!clientId || !url) {
    res.status(400).json({ error: "Missing clientId or URL" });
    return;
  }

  let titleText = "";
  let descriptionText = "";
  let h1Text = "";
  let titleExists = false;
  let descriptionExists = false;
  let h1Exists = false;
  let crawledSuccess = false;

  // Real Crawl Attempt (Server-side fetch is safe from Client CORS issues)
  try {
    const fetchRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 SEO Toolkit Audit Crawler 1.0" },
      signal: AbortSignal.timeout(4000) // 4 seconds timeout
    });

    if (fetchRes.ok) {
      const htmlText = await fetchRes.text();
      crawledSuccess = true;

      // Extract title
      const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        titleText = titleMatch[1].trim();
        titleExists = true;
      }

      // Extract meta description
      const descMatch = htmlText.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || 
                         htmlText.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i);
      if (descMatch && descMatch[1]) {
        descriptionText = descMatch[1].trim();
        descriptionExists = true;
      }

      // Extract H1
      const h1Match = htmlText.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match && h1Match[1]) {
        h1Text = h1Match[1].replace(/<[^>]*>/g, "").trim();
        h1Exists = true;
      }
    }
  } catch (error) {
    console.log(`Crawl failed for ${url} (falling back to AI-mode):`, error instanceof Error ? error.message : error);
  }

  const db = readDB();
  const clientInfo = db.clients.find(c => c.id === clientId) || { name: clientId, businessCategory: category || "SEO Client" };

  try {
    const ai = getGeminiClient();
    const isMock = process.env.GEMINI_API_KEY ? false : true;

    let auditResult;

    if (!isMock) {
      // Real Gemini API Call with structured schema fallback
      const prompt = `Conduct a technical SEO and performance audit for the following website:
URL: ${url}
Business Name: ${clientInfo.name}
Business Category: ${clientInfo.businessCategory}

Web Crawler Results (Actual Fetched Meta Tags):
- Crawled successfully: ${crawledSuccess}
- <title> tag found: ${titleExists} ${titleExists ? `(${titleText})` : ""}
- <meta name="description"> tag found: ${descriptionExists} ${descriptionExists ? `(${descriptionText})` : ""}
- <h1> tag found: ${h1Exists} ${h1Exists ? `(${h1Text})` : ""}

If crawled successfully was false, construct a highly realistic diagnostic audit matching typical structural weaknesses of modern businesses in this vertical (${clientInfo.businessCategory}).
Analyze mobile optimization, responsive speed benchmarks, core web vitals, SSL configuration, duplicates, internal linking strategies, and schema parameters.

Provide a comprehensive JSON report containing:
1. "score" (Overall score 0-100)
2. "metadata" which includes boolean values and string indicators for titles, duplicateContentFound, h1, brokenLinksCount, speedScore, isMobileFriendly, schemaMarkupFound, schemaType, internalLinkingScore, and "coreWebVitals" details (LCP value, CLS value, FID index).
3. "fixList": a list of specific, highly customized fix items. Detail exactly what script, structure or selector needs editing. Each fix has "id", "title", "description", "priority" ("critical" | "moderate" | "low"), "category", and "impact" ("high" | "medium" | "low").`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              metadata: {
                type: Type.OBJECT,
                properties: {
                  titleExists: { type: Type.BOOLEAN },
                  titleText: { type: Type.STRING },
                  descriptionExists: { type: Type.BOOLEAN },
                  descriptionText: { type: Type.STRING },
                  duplicateContentFound: { type: Type.BOOLEAN },
                  h1Exists: { type: Type.BOOLEAN },
                  h1Text: { type: Type.STRING },
                  brokenLinksCount: { type: Type.INTEGER },
                  speedScore: { type: Type.INTEGER },
                  isMobileFriendly: { type: Type.BOOLEAN },
                  schemaMarkupFound: { type: Type.BOOLEAN },
                  schemaType: { type: Type.STRING },
                  internalLinkingScore: { type: Type.INTEGER },
                  coreWebVitals: {
                    type: Type.OBJECT,
                    properties: {
                      lcp: { type: Type.NUMBER },
                      cls: { type: Type.NUMBER },
                      fid: { type: Type.INTEGER }
                    },
                    required: ["lcp", "cls", "fid"]
                  }
                },
                required: ["titleExists", "descriptionExists", "duplicateContentFound", "h1Exists", "brokenLinksCount", "speedScore", "isMobileFriendly", "schemaMarkupFound", "internalLinkingScore", "coreWebVitals"]
              },
              fixList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    category: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  },
                  required: ["id", "title", "description", "priority", "category", "impact"]
                }
              }
            },
            required: ["score", "metadata", "fixList"]
          }
        }
      });

      if (response.text) {
        auditResult = JSON.parse(response.text.trim());
      }
    }

    // Fallback if SDK or parsing fails / mock run
    if (!auditResult) {
      const pScore = Math.floor(Math.random() * 25) + 50; // 50 - 75
      auditResult = {
        score: pScore,
        metadata: {
          titleExists: titleExists || true,
          titleText: titleText || `${clientInfo.name} | Expert ${clientInfo.businessCategory} Services`,
          descriptionExists: descriptionExists || false,
          descriptionText: descriptionText || "",
          duplicateContentFound: false,
          h1Exists: h1Exists || false,
          h1Text: h1Text || "",
          brokenLinksCount: Math.floor(Math.random() * 6) + 1,
          speedScore: Math.floor(Math.random() * 30) + 50,
          isMobileFriendly: Math.random() > 0.3,
          schemaMarkupFound: Math.random() > 0.5,
          schemaType: Math.random() > 0.5 ? "LocalBusiness" : "Organization",
          internalLinkingScore: Math.floor(Math.random() * 40) + 40,
          coreWebVitals: {
            lcp: Math.round((Math.random() * 3 + 1.5) * 10) / 10,
            cls: Math.round(Math.random() * 0.3 * 100) / 100,
            fid: Math.floor(Math.random() * 150) + 30
          }
        },
        fixList: [
          {
            id: `fix-${clientId}-1`,
            title: descriptionExists ? "Increase keyword relevance of Description" : "Create missing meta description on index",
            description: "The primary home page description must be meta-tagged to capture organic click clicks properly.",
            priority: "critical",
            category: "Missing Meta Descriptions",
            impact: "high"
          },
          {
            id: `fix-${clientId}-2`,
            title: "Resolve Render-Blocking CSS Assets",
            description: "Compress stylesheet bundles and defer third-party fonts. Improvise current LCP metric.",
            priority: "moderate",
            category: "Core Web Vitals",
            impact: "medium"
          },
          {
            id: `fix-${clientId}-3`,
            title: h1Exists ? "Refactor Heading Priority Heirarchy" : "Synthesize missing primary H1 tag",
            description: "A single front-page H1 is optimal for keyword relevance structure. Ensure heading matches primary keyword search intent.",
            priority: "critical",
            category: "Missing H1 Tags",
            impact: "high"
          }
        ]
      };
    }

    // Save report to db audits
    db.audits[clientId] = {
      clientId,
      score: auditResult.score,
      auditedAt: new Date().toISOString().split("T")[0],
      metadata: auditResult.metadata,
      fixList: auditResult.fixList
    };

    // Update client score as well
    const clIndex = db.clients.findIndex(c => c.id === clientId);
    if (clIndex !== -1) {
      db.clients[clIndex].seoScore = auditResult.score;
    }

    writeDB(db);
    res.json(db.audits[clientId]);
  } catch (err: any) {
    console.error("Audit AI generation caught standard error:", err);
    res.status(500).json({ error: "Failing to generate SEO Audit.", details: err?.message || err });
  }
});

app.get("/api/audit/:clientId", (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  const audit = db.audits[clientId];
  if (!audit) {
    res.status(404).json({ error: "No audit report found for this client. Please run a new audit scan." });
    return;
  }
  res.json(audit);
});

// Competitor Analysis Endpoint
app.post("/api/competitors/run", async (req, res) => {
  const { clientId } = req.body;
  if (!clientId) {
    res.status(400).json({ error: "Missing clientId" });
    return;
  }

  const db = readDB();
  const clientInfo = db.clients.find(c => c.id === clientId);
  if (!clientInfo) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  try {
    const ai = getGeminiClient();
    const isMock = process.env.GEMINI_API_KEY ? false : true;

    let compResult;

    if (!isMock) {
      const prompt = `Perform a mock organic competitor SEO audit for the client:
Name: ${clientInfo.name}
Business Category: ${clientInfo.businessCategory}
Location: ${clientInfo.location}
Target Keywords: ${clientInfo.keywords.join(", ")}

Task: Identify top organic search landing page domains that would rank in Google for these queries in this region.
Generate a structured report outlining:
1. List of 2 realistic competitor entries with metrics: url, name, contentLength, keywordDensity percentage, backlinksCount, speedSeconds, internalLinksCount, and schemaType.
2. "contentGaps": At least 2 prominent content gaps where these competitors possess highly comprehensive pages, but our client is missing columns or answers. Explicitly offer topics and actionable content ideas.
3. "keywordGaps": List of 2 semantic high-value long-tail phrases that competitors currently rank for, detailing organic difficulty indices and approximate monthly search volumes.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              competitors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    url: { type: Type.STRING },
                    name: { type: Type.STRING },
                    contentLength: { type: Type.INTEGER },
                    keywordDensity: { type: Type.NUMBER },
                    backlinksCount: { type: Type.INTEGER },
                    speedSeconds: { type: Type.NUMBER },
                    internalLinksCount: { type: Type.INTEGER },
                    schemaType: { type: Type.STRING }
                  },
                  required: ["url", "name", "contentLength", "keywordDensity", "backlinksCount", "speedSeconds", "internalLinksCount", "schemaType"]
                }
              },
              contentGaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    competitorStrength: { type: Type.STRING },
                    ourStatus: { type: Type.STRING },
                    actionItem: { type: Type.STRING }
                  },
                  required: ["topic", "competitorStrength", "ourStatus", "actionItem"]
                }
              },
              keywordGaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    competitorRank: { type: Type.INTEGER },
                    searchVolume: { type: Type.INTEGER },
                    difficulty: { type: Type.INTEGER }
                  },
                  required: ["keyword", "competitorRank", "searchVolume", "difficulty"]
                }
              }
            },
            required: ["competitors", "contentGaps", "keywordGaps"]
          }
        }
      });

      if (response.text) {
        compResult = JSON.parse(response.text.trim());
      }
    }

    if (!compResult) {
      // Elegant fallback
      compResult = {
        competitors: [
          {
            url: `https://competitor1-${clientId}.example.com`,
            name: `${clientInfo.name.split(" ")[0] || "Premier"} Competitor Inc`,
            contentLength: 1450,
            keywordDensity: 2.3,
            backlinksCount: 68,
            speedSeconds: 1.4,
            internalLinksCount: 30,
            schemaType: "LocalBusiness Service"
          },
          {
            url: `https://competitor2-${clientId}.example.com`,
            name: `Regional ${clientInfo.businessCategory.split(" ")[0]} Direct`,
            contentLength: 1100,
            keywordDensity: 1.9,
            backlinksCount: 34,
            speedSeconds: 2.1,
            internalLinksCount: 15,
            schemaType: "None"
          }
        ],
        contentGaps: [
          {
            topic: `Comprehensive ${clientInfo.businessCategory} Pricing & Cost Calculators`,
            competitorStrength: "high",
            ourStatus: "missing",
            actionItem: "Launch an interactive, highly shareable Cost Calculator module for local regional packages."
          },
          {
            topic: `Seasonal FAQs & Troubleshooting tips in ${clientInfo.location}`,
            competitorStrength: "medium",
            ourStatus: "needs-work",
            actionItem: "Synthesize FAQs matching target queries for quick insertion below services modules."
          }
        ],
        keywordGaps: [
          { keyword: `best ${clientInfo.keywords[0] || "provider in region"} list`, competitorRank: 2, searchVolume: 190, difficulty: 52 },
          { keyword: `${clientInfo.keywords[1] || "services"} cost guide`, competitorRank: 4, searchVolume: 110, difficulty: 38 }
        ]
      };
    }

    db.competitors[clientId] = {
      clientId,
      analyzedAt: new Date().toISOString().split("T")[0],
      competitors: compResult.competitors,
      contentGaps: compResult.contentGaps,
      keywordGaps: compResult.keywordGaps
    };

    writeDB(db);
    res.json(db.competitors[clientId]);
  } catch (err: any) {
    console.error("Competitor Analysis error:", err);
    res.status(500).json({ error: "Failing to execute Competitor Analysis.", details: err?.message || err });
  }
});

app.get("/api/competitors/:clientId", (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  const analysis = db.competitors[clientId];
  if (!analysis) {
    res.status(404).json({ error: "No competitor report exists yet. Click 'Run Competitor Audit'." });
    return;
  }
  res.json(analysis);
});

// AI Content Writer Endpoint
app.post("/api/writer/generate", async (req, res) => {
  const { clientId, type, title, searchIntent, keywords, customPrompt } = req.body;
  if (!clientId || !type || !title) {
    res.status(400).json({ error: "Missing required fields (clientId, type, title)" });
    return;
  }

  const db = readDB();
  const clientInfo = db.clients.find(c => c.id === clientId) || { name: "Client", businessCategory: "Business" };

  try {
    const ai = getGeminiClient();
    const isMock = process.env.GEMINI_API_KEY ? false : true;

    let contentOutput = "";

    const kwList = Array.isArray(keywords) ? keywords : [keywords].filter(Boolean);

    if (!isMock) {
      const prompt = `As a professional SEO copywriter expert in Search Intent, Entity-SEO, Semantic structures and NLP keywords, draft a copy block for:
Client: ${clientInfo.name} (Vertical: ${clientInfo.businessCategory})
Content Title: ${title}
Format Request: ${type} (Options: blog, service, landing, meta, faq, schema)
Target Search Intent: ${searchIntent || "Informational"}
Selected Key Phrases to integrate naturally: ${kwList.join(", ")}
Custom context requested: ${customPrompt || "Generate fully production-ready detailed rich content."}

SEO Optimization Directive for generation:
- Write beautiful formatting utilizing clean structural elements: use rich H1, H2, elements, list nodes, clear spacing.
- Maximize readability while naturally integrating target phrases. Avoid keyword stuffing. Include semantic keywords.
- If type is 'meta', provide both a Title tag (<70 chars) and Description tag (<160 chars) styled clean.
- If type is 'schema', formulate fully compliant JSON-LD Markup representing standard schema triggers.
- If type is 'faq', build a sequence of high-intent questions and clear answers.

Generate ONLY the requested HTML or structural text back to embed directly. Do not surround with conversational intros or backticks wrappers unless returning pure schema JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      contentOutput = response.text || "";
    }

    if (!contentOutput) {
      // High-quality mock draft
      if (type === "schema") {
        contentOutput = `{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "${title}",
  "provider": {
    "@type": "LocalBusiness",
    "name": "${clientInfo.name}"
  },
  "areaServed": "${clientInfo.location || "Local State"}",
  "description": "High fidelity optimized strategic package representing native keywords.",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "Contact for Pricing"
  }
}`;
      } else if (type === "meta") {
        contentOutput = `<strong>SEO Title Tag (62 chars):</strong><br/>
<pre class="bg-slate-100 p-2 text-xs rounded my-1 text-slate-800">${title} | Best Quality Expert Services in ${clientInfo.location || "Region"}</pre><br/>
<strong>Meta Description (154 chars):</strong><br/>
<pre class="bg-slate-100 p-2 text-xs rounded my-1 text-slate-800">Looking for premium ${title} in ${clientInfo.location || "Region"}? Find out why ${clientInfo.name} is trusted by locals. Check out our certified plans today!</pre>`;
      } else if (type === "faq") {
        contentOutput = `<h2>Frequently Asked Questions about ${title}</h2>
<h3>Q1: What are the primary benefits of our ${title} program?</h3>
<p>Our program matches native entity guidelines, optimizing structural output and increasing local visibility indices dramatically.</p>
<h3>Q2: How long does it take to see positive ranking impact?</h3>
<p>While standard SEO takes up to 30 to 90 days, integrating optimized content, fixing broken redirects, and publishing Schema profiles accelerates indexing speeds.</p>`;
      } else {
        contentOutput = `<h1>${title}</h1>
<p class="lead">In modern organic growth strategy, establishing semantic relevance for your ${clientInfo.businessCategory} requirements delivers ongoing compounding inbound returns.</p>
<h2>Essential Strategic Elements to Know</h2>
<p>Many localized campaigns stumble because they neglect basic intent structures. To rank client properties high in regional indexes, copy layout must follow natural voice commands:</p>
<ul>
  <li><strong>Target Search Entities:</strong> Align brand nodes carefully.</li>
  <li><strong>Internal Hyperlinks:</strong> Connect related topic directories.</li>
  <li><strong>Clean Mobile Flow:</strong> Prioritize Core Web Vitals (LCP, FID).</li>
</ul>
<p>Our ongoing testing verifies that integrating keyword topics like <em>${kwList.length > 0 ? kwList[0] : "expert localized optimization"}</em> directly correlates with organic impressions boosts.</p>`;
      }
    }

    const newArticle = {
      id: `art-${Date.now()}`,
      clientId,
      title,
      type,
      content: contentOutput,
      createdAt: new Date().toISOString().split("T")[0],
      keywordsUsed: kwList
    };

    db.articles.push(newArticle);

    // Increment client tasks completed
    const clIndex = db.clients.findIndex(c => c.id === clientId);
    if (clIndex !== -1) {
      db.clients[clIndex].tasksCompleted = Math.min(db.clients[clIndex].tasksCompleted + 1, db.clients[clIndex].totalTasks);
    }

    writeDB(db);
    res.json(newArticle);
  } catch (err: any) {
    console.error("AI Content generation error:", err);
    res.status(500).json({ error: "Failing to compile AI copy.", details: err?.message || err });
  }
});

app.get("/api/writer/:clientId", (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  const articles = db.articles.filter(a => a.clientId === clientId);
  res.json(articles);
});

// AI SEO Chat Agent Endpoint (Step 7)
app.post("/api/chat", async (req, res) => {
  const { clientId, messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const db = readDB();
  const clientInfo = db.clients.find(c => c.id === clientId);
  const clientContext = clientInfo 
    ? `You are discussing SEO strategy for the client:
- Name: ${clientInfo.name}
- Domain: ${clientInfo.url}
- Category: ${clientInfo.businessCategory}
- Location: ${clientInfo.location}
- Target Keywords: ${clientInfo.keywords.join(", ")}
- Current Website Score: ${clientInfo.seoScore}/100`
    : `You are answering general SEO and advanced organic search engineering questions.`;

  try {
    const ai = getGeminiClient();
    const isMock = process.env.GEMINI_API_KEY ? false : true;

    let reply = "";

    if (!isMock) {
      const lastMessage = messages[messages.length - 1];
      const chatConversation = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

      const prompt = `You are an elite, highly credentialed SEO Growth Consultant and Organic Architecture Mentor.
You provide professional SEO audits explanations, strategic fix priorities, schema markup suggestions, internal linking blueprints, and monthly local SEO sprints.

Context of current dashboard view:
${clientContext}

Conversation Thread:
${chatConversation}

Assistant:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the primary AI SEO Agent for a Digital Marketing Agency. Always structure your responses with crisp formatting, using bullet points, bold key terms, and high-impact SEO insights. Speak clearly, constructively, and display expert mastery over HTML schema, Google Core Web Vitals, entities, Google Business Profile (GBP), and page speed heuristics."
        }
      });

      reply = response.text || "";
    }

    if (!reply) {
      reply = `Thank you for asking! For ${clientInfo ? clientInfo.name : "your clients"}, optimizing technical and entity-based organic architectures will raise rankings quickly. Here is the immediate strategy:

1. **Fix Metadata Failures**: Meta description missing or truncated limits search CTR. Let's patch those immediately using the **AI writer**.
2. **Local Authority Expansion**: Focus on **Google Business Profile (GBP) optimization**, citations, and inserting localized reviews structured in LocalBusiness tags.
3. **Core Web Vitals**: Compress heavy CSS and leverage modern WebP images to resolve high LCP latencies.

How can I help you construct custom Schema JSON-LD or write a 30-day SEO growth sprint plan?`;
    }

    res.json({
      id: `chat-${Date.now()}`,
      role: "assistant",
      content: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (err: any) {
    console.error("AI chat agent error:", err);
    res.status(500).json({ reply: "I ran into an issue connecting with the organic search indexing intelligence unit.", error: err?.message });
  }
});

// Rank Tracker Endpoints (Step 5)
app.get("/api/rankings/:clientId", (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  const ranks = db.rankHistory[clientId] || [];
  res.json(ranks);
});

// Advanced Keyword Research Endpoint
app.post("/api/keywords/research", async (req, res) => {
  const { clientId, keyword } = req.body;
  if (!clientId || !keyword) {
    res.status(400).json({ error: "Missing required parameters (clientId, keyword)" });
    return;
  }

  const db = readDB();
  const clientInfo = db.clients.find(c => c.id === clientId) || { name: "Client", businessCategory: "SEO Client", location: "Local Region" };

  try {
    const ai = getGeminiClient();
    const isMock = process.env.GEMINI_API_KEY ? false : true;

    let researchResult;

    if (!isMock) {
      const prompt = `Perform an advanced SEO keyword research and search intent analysis for the root keyword: "${keyword}".
Client context:
- Name: ${clientInfo.name}
- Industry segment: ${clientInfo.businessCategory}
- Location context: ${clientInfo.location}

Task:
Generate analytical metrics for the root keyword and discover related semantic phrases and long-tail variations tailored specifically to inform their local or digital marketing campaigns.
Include search volume estimates, keyword difficulty percentages (0-100), CPC, and search intent categorizations ("Informational", "Commercial", "Transactional", "Navigational").

Provide a beautifully comprehensive JSON block containing:
1. "keyword": the queried word
2. "volume": estimated monthly search volume
3. "difficulty": keyword difficulty integer (0 to 100)
4. "cpc": average cost-per-click float (USD)
5. "intent": standard category string ("Informational" | "Commercial" | "Transactional" | "Navigational")
6. "description": short explanation of searcher mindset and competitor strength for this query
7. "relatedKeywords": an array of 5-6 discovered related long-tail keywords. Each must have "keyword", "volume", "difficulty", "cpc", "intent"
8. "semanticVariations": an array of 4-5 latently scoped synonyms or conceptual variations related to the topic. Each must have "phrase", "contextSuggestion" (recommending where/how to implement this in content copy), "relevanceScore" (0-100 integer)
9. "contentStrategy": a summary paragraph detailing the target audience, formatting suggestions, and click-through optimizations to rank this prompt.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              volume: { type: Type.INTEGER },
              difficulty: { type: Type.INTEGER },
              cpc: { type: Type.NUMBER },
              intent: { type: Type.STRING },
              description: { type: Type.STRING },
              relatedKeywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    volume: { type: Type.INTEGER },
                    difficulty: { type: Type.INTEGER },
                    cpc: { type: Type.NUMBER },
                    intent: { type: Type.STRING }
                  },
                  required: ["keyword", "volume", "difficulty", "cpc", "intent"]
                }
              },
              semanticVariations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: { type: Type.STRING },
                    contextSuggestion: { type: Type.STRING },
                    relevanceScore: { type: Type.INTEGER }
                  },
                  required: ["phrase", "contextSuggestion", "relevanceScore"]
                }
              },
              contentStrategy: { type: Type.STRING }
            },
            required: ["keyword", "volume", "difficulty", "cpc", "intent", "description", "relatedKeywords", "semanticVariations", "contentStrategy"]
          }
        }
      });

      if (response.text) {
        researchResult = JSON.parse(response.text.trim());
      }
    }

    if (!researchResult) {
      // Dynamic fallback generator
      const rootKwLower = keyword.toLowerCase();
      const difficulty = Math.floor(Math.random() * 45) + 32; // 32-77
      const volume = Math.floor(Math.random() * 800) + 220; // 220-1000
      const cpc = Math.round((Math.random() * 4 + 1.25) * 100) / 100;
      const intent = rootKwLower.includes("best") || rootKwLower.includes("top") ? "Commercial" : (rootKwLower.includes("price") || rootKwLower.includes("buy") || rootKwLower.includes("install") ? "Transactional" : "Informational");

      researchResult = {
        keyword,
        volume,
        difficulty,
        cpc,
        intent,
        description: `This query represents highly qualified searchers focusing on ${clientInfo.businessCategory || "General Business"}. There is a solid volume indicating clear user intent with manageable ranking resistance.`,
        relatedKeywords: [
          { keyword: `best ${keyword}`, volume: Math.floor(volume * 0.4), difficulty: Math.min(100, difficulty + 10), cpc: Math.round((cpc * 1.25) * 100) / 100, intent: "Commercial" },
          { keyword: `${keyword} cost`, volume: Math.floor(volume * 0.25), difficulty: Math.max(10, difficulty - 12), cpc: Math.round((cpc * 0.95) * 100) / 100, intent: "Transactional" },
          { keyword: `affordable ${keyword} solutions`, volume: Math.floor(volume * 0.15), difficulty: Math.max(10, difficulty - 20), cpc: Math.round((cpc * 0.8) * 100) / 100, intent: "Transactional" },
          { keyword: `how to choose a ${keyword}`, volume: Math.floor(volume * 0.3), difficulty: Math.max(10, difficulty - 15), cpc: Math.round((cpc * 0.5) * 100) / 100, intent: "Informational" },
          { keyword: `${keyword} guidelines in ${clientInfo.location || "Region"}`, volume: Math.floor(volume * 0.1), difficulty: Math.max(5, difficulty - 25), cpc: Math.round((cpc * 0.75) * 100) / 100, intent: "Informational" }
        ],
        semanticVariations: [
          { phrase: `${(clientInfo.businessCategory || "General Business").split(" ")[0]} services`, contextSuggestion: "Introduce in H2 headers to anchor primary entity definitions.", relevanceScore: 92 },
          { phrase: `sustainable ${keyword} solutions`, contextSuggestion: "Integrate into body text talking about environmental factors.", relevanceScore: 88 },
          { phrase: `professional local ${clientInfo.location || "Region"} provider`, contextSuggestion: "Add to meta title or introduction fields to strengthen regional relevance.", relevanceScore: 85 },
          { phrase: `cost-effective alternative strategies`, contextSuggestion: "Use in FAQ section addressing price variations.", relevanceScore: 74 }
        ],
        contentStrategy: `To rank optimally for "${keyword}", establish a thematic cluster targeting both general and local queries. Draft a comprehensive guide (>1,200 words) addressing standard service scopes and integrate Schema markup detailing location criteria. Focus on lowering Page Load latency (Core Web Vitals) to retain visitor session tracks on mobile.`
      };
    }

    res.json(researchResult);
  } catch (err: any) {
    console.error("Keyword Research generator caught standard error:", err);
    res.status(500).json({ error: "Failing to execute Keyword Research.", details: err?.message || err });
  }
});

// Keyword Track Addition Endpoint
app.post("/api/keywords/track", (req, res) => {
  const { clientId, keyword, volume } = req.body;
  if (!clientId || !keyword) {
    res.status(400).json({ error: "Missing required parameters (clientId, keyword)" });
    return;
  }

  const db = readDB();
  const client = db.clients.find(c => c.id === clientId);
  if (!client) {
    res.status(404).json({ error: "Client workspace not found" });
    return;
  }

  if (!db.rankHistory[clientId]) {
    db.rankHistory[clientId] = [];
  }

  // Check if keyword is already being tracked
  const alreadyTracking = db.rankHistory[clientId].some(r => r.keyword.toLowerCase() === keyword.toLowerCase());
  if (alreadyTracking) {
    res.status(400).json({ error: "This keyword is already being tracked in SERP position tracks" });
    return;
  }

  const seedRank = Math.floor(Math.random() * 50) + 15; // random rank between 15 and 65
  const kwVolume = volume || Math.floor(Math.random() * 300) + 80;

  const historyData = [
    { date: "06-08", rank: seedRank + 5, mobileRank: seedRank + 6, localRank: seedRank + 3 },
    { date: "06-10", rank: seedRank + 3, mobileRank: seedRank + 4, localRank: seedRank + 2 },
    { date: "06-12", rank: seedRank + 1, mobileRank: seedRank + 2, localRank: seedRank + 1 },
    { date: "06-14", rank: seedRank, mobileRank: seedRank, localRank: seedRank }
  ];

  const newTrackObj = {
    id: `r-research-${clientId}-${Date.now()}`,
    clientId,
    keyword,
    currentRank: seedRank,
    previousRank: seedRank + 5,
    volume: kwVolume,
    history: historyData
  };

  db.rankHistory[clientId].push(newTrackObj);

  if (!client.keywords.includes(keyword)) {
    client.keywords.push(keyword);
    client.rankingKeywordsCount = client.keywords.length;
  }

  writeDB(db);
  res.status(201).json(newTrackObj);
});

// Keyword Opportunities Discovery Endpoint
app.post("/api/keywords/opportunities", async (req, res) => {
  const { keyword, clientId } = req.body;
  if (!keyword) {
    res.status(400).json({ error: "Missing required parameter (keyword)" });
    return;
  }

  const db = readDB();
  const clientInfo = clientId ? db.clients.find(c => c.id === clientId) : null;
  const clientName = clientInfo ? clientInfo.name : "SEO Client";
  const clientCategory = clientInfo ? clientInfo.businessCategory : "General niche";
  const clientLocation = clientInfo ? clientInfo.location : "Local Region";

  try {
    const ai = getGeminiClient();
    const isMock = process.env.GEMINI_API_KEY ? false : true;

    let opportunityResult;

    if (!isMock) {
      const prompt = `Conduct high-value Keyword Opportunity research for the seed keyword: "${keyword}".
Client Context (if any):
- Name: ${clientName}
- Industry: ${clientCategory}
- Location: ${clientLocation}

Task:
Analyze searcher metrics for the seed phrase. Find semantic variations, latent semantic indexing (LSI) terms, search intents, monthly search volume estimates, cost-per-click values (CPC), and keyword difficulty (0 to 100).
Also discover highly searched long-tail questions (who, why, what, how, is, best) related to this topic.
Additionally, estimate the historical monthly search volume trend of this seed keyword over the last 12 months.

Provide a comprehensive JSON object with:
1. "seedKeyword": the string matching the original seed keyword exactly.
2. "competitiveDifficulty": a detailed summary explaining the competitive landscape, organic search volatility, and recommendations to rank for this topic.
3. "semanticVariations": an array of 5-7 keyword phrases representing related synonyms or LSI variations. Each must have:
   - "phrase": string keyword phrase
   - "volume": estimated monthly search volume of this phrase (typically integer between 50 and 20000)
   - "cpc": CPC value in USD (typically number between 0.20 and 15.00)
   - "relevance": relevance score (integer between 0 and 100)
   - "difficulty": keyword ranking difficulty (integer between 0 and 100)
   - "intent": search intent string ("Informational" | "Commercial" | "Transactional" | "Navigational")
4. "questions": an array of 4-6 long-tail questions related to the seed keyword. Each must have:
   - "question": the actual search question
   - "difficulty": difficulty score (integer between 0 and 100)
   - "volume": monthly search volume estimate (typically integer between 20 and 5000)
   - "contentAngle": a specific recommendation on how to cover this in an article (e.g., "Answer directly in H3 section with list", "Create a schema-compliant FAQ block")
5. "monthlyTrends": an array of exactly 12 items representing the search volume history for the last 12 months. Each must have:
   - "month": short month label (e.g., "Jun 25", "Jul 25", etc. up to the present)
   - "volume": estimated monthly search volume integer`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seedKeyword: { type: Type.STRING },
              competitiveDifficulty: { type: Type.STRING },
              semanticVariations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: { type: Type.STRING },
                    volume: { type: Type.INTEGER },
                    cpc: { type: Type.NUMBER },
                    relevance: { type: Type.INTEGER },
                    difficulty: { type: Type.INTEGER },
                    intent: { type: Type.STRING }
                  },
                  required: ["phrase", "volume", "cpc", "relevance", "difficulty", "intent"]
                }
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    difficulty: { type: Type.INTEGER },
                    volume: { type: Type.INTEGER },
                    contentAngle: { type: Type.STRING }
                  },
                  required: ["question", "difficulty", "volume", "contentAngle"]
                }
              },
              monthlyTrends: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    month: { type: Type.STRING },
                    volume: { type: Type.INTEGER }
                  },
                  required: ["month", "volume"]
                }
              }
            },
            required: ["seedKeyword", "competitiveDifficulty", "semanticVariations", "questions", "monthlyTrends"]
          }
        }
      });

      if (response.text) {
        opportunityResult = JSON.parse(response.text.trim());
      }
    }

    if (!opportunityResult) {
      // Dynamic fallback mock generator if no API key or on fail
      const kwLower = keyword.toLowerCase();
      const baseVol = Math.floor(Math.random() * 800) + 200;
      const baseDiff = Math.floor(Math.random() * 40) + 30; // 30-70
      const baseCpc = +(Math.random() * 3 + 1).toFixed(2);

      opportunityResult = {
        seedKeyword: keyword,
        competitiveDifficulty: `The seed keyword "${keyword}" represents a ${baseDiff < 50 ? 'moderately open' : 'highly competitive'} SEO landscape. Successful rankings require high-quality local entity anchors, schema structured markup, and structured H2/H3 long-tail question blocks. Search volumes are stable with strong buyer-intent indicators.`,
        semanticVariations: [
          { phrase: `best ${keyword} services`, volume: Math.floor(baseVol * 0.8), cpc: +(baseCpc * 1.3).toFixed(2), relevance: 95, difficulty: Math.min(100, baseDiff + 12), intent: "Commercial" },
          { phrase: `affordable ${keyword} solutions`, volume: Math.floor(baseVol * 0.45), cpc: +(baseCpc * 0.9).toFixed(2), relevance: 88, difficulty: Math.max(10, baseDiff - 8), intent: "Transactional" },
          { phrase: `local ${keyword} near me`, volume: Math.floor(baseVol * 1.4), cpc: +(baseCpc * 1.15).toFixed(2), relevance: 92, difficulty: Math.min(100, baseDiff + 5), intent: "Transactional" },
          { phrase: `professional ${keyword} company`, volume: Math.floor(baseVol * 0.6), cpc: +(baseCpc * 1.25).toFixed(2), relevance: 90, difficulty: Math.min(100, baseDiff + 8), intent: "Commercial" },
          { phrase: `${keyword} reviews and costs`, volume: Math.floor(baseVol * 0.25), cpc: +(baseCpc * 0.7).toFixed(2), relevance: 82, difficulty: Math.max(5, baseDiff - 15), intent: "Informational" },
          { phrase: `how does ${keyword} work`, volume: Math.floor(baseVol * 0.5), cpc: 0.45, relevance: 80, difficulty: Math.max(5, baseDiff - 20), intent: "Informational" }
        ],
        questions: [
          { question: `How much does a professional ${keyword} cost?`, difficulty: Math.max(5, baseDiff - 10), volume: Math.floor(baseVol * 0.35), contentAngle: "Construct a dynamic cost-calculator or budget matrix table." },
          { question: `What is the best way to choose a ${keyword}?`, difficulty: Math.max(5, baseDiff - 15), volume: Math.floor(baseVol * 0.2), contentAngle: "Create a bulleted credentials-and-license inspection roadmap." },
          { question: `Can I handle DIY ${keyword} or hire a specialist?`, difficulty: Math.max(5, baseDiff - 25), volume: Math.floor(baseVol * 0.15), contentAngle: "Write a high-contrast Pros and Cons comparison table." },
          { question: `How long does a standard ${keyword} project take?`, difficulty: Math.max(5, baseDiff - 18), volume: Math.floor(baseVol * 0.1), contentAngle: "Provide a linear timeline infographic explaining milestones." }
        ],
        monthlyTrends: [
          { month: "Jun 25", volume: Math.floor(baseVol * (0.9 + Math.random() * 0.2)) },
          { month: "Jul 25", volume: Math.floor(baseVol * (0.85 + Math.random() * 0.25)) },
          { month: "Aug 25", volume: Math.floor(baseVol * (0.9 + Math.random() * 0.2)) },
          { month: "Sep 25", volume: Math.floor(baseVol * (1.0 + Math.random() * 0.3)) },
          { month: "Oct 25", volume: Math.floor(baseVol * (1.1 + Math.random() * 0.2)) },
          { month: "Nov 25", volume: Math.floor(baseVol * (1.2 + Math.random() * 0.25)) },
          { month: "Dec 25", volume: Math.floor(baseVol * (1.3 + Math.random() * 0.3)) },
          { month: "Jan 26", volume: Math.floor(baseVol * (1.1 + Math.random() * 0.2)) },
          { month: "Feb 26", volume: Math.floor(baseVol * (1.0 + Math.random() * 0.2)) },
          { month: "Mar 26", volume: Math.floor(baseVol * (1.15 + Math.random() * 0.25)) },
          { month: "Apr 26", volume: Math.floor(baseVol * (1.25 + Math.random() * 0.2)) },
          { month: "May 26", volume: Math.floor(baseVol * (1.35 + Math.random() * 0.3)) }
        ]
      };
    }

    res.json(opportunityResult);
  } catch (err: any) {
    console.error("Keyword opportunity API error:", err);
    res.status(500).json({ error: "Failed to generate keyword opportunities details.", details: err?.message || err });
  }
});

// Create Automated Report (Step 9 / Step 8)
app.post("/api/reports/create", (req, res) => {
  const { clientId, period } = req.body;
  if (!clientId) {
    res.status(400).json({ error: "Missing clientId" });
    return;
  }

  const db = readDB();
  const clientInfo = db.clients.find(c => c.id === clientId);
  if (!clientInfo) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const reportId = `rep-${Date.now()}`;
  const newReport = {
    id: reportId,
    clientId,
    createdAt: new Date().toISOString().split("T")[0],
    period: period || "June 2026",
    seoScore: clientInfo.seoScore || 65,
    trafficGrowth: clientInfo.monthlyTraffic > 1000 ? "+15% growth" : "+8% startup growth",
    rankingsSummary: `Successfully tracking ${clientInfo.keywords.length} target search terms. Key rankings showed strong upward mobility due to metadata optimization.`,
    workCompleted: [
      `Completed Website Audit Scan (Technical Score: ${clientInfo.seoScore || 60}/100)`,
      `Drafted fresh optimized landing copy blocks for core keywords: ${clientInfo.keywords.slice(0, 2).join(", ")}`,
      "Synthesized semantic Schema templates representing local entity scopes."
    ],
    nextSteps: [
      "Improve Core Web vitals speed parameters by optimizing media packages.",
      "Address moderate tasks identified in Audit priority fix logs.",
      "Draft local citations matching Portland Google Business Profile parameters."
    ]
  };

  db.reports.push(newReport);
  writeDB(db);
  res.status(201).json(newReport);
});

app.get("/api/reports/:clientId", (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  const clientReports = db.reports.filter(r => r.clientId === clientId);
  res.json(clientReports);
});

// Vite Middleware & Asset Server Bootstrapper
async function startServer() {
  // Vite dev or production asset server mounting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SEO Toolkit Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
