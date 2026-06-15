export interface Client {
  id: string;
  name: string;
  url: string;
  businessCategory: string;
  location: string;
  keywords: string[];
  onboardingDate: string;
  seoScore: number;
  rankingKeywordsCount: number;
  monthlyTraffic: number;
  visibilityScore: number; // percent 0-100
  tasksCompleted: number;
  totalTasks: number;
}

export interface AuditReport {
  clientId: string;
  score: number;
  auditedAt: string;
  metadata: {
    titleExists: boolean;
    titleText?: string;
    descriptionExists: boolean;
    descriptionText?: string;
    duplicateContentFound: boolean;
    h1Exists: boolean;
    h1Text?: string;
    brokenLinksCount: number;
    speedScore: number;
    isMobileFriendly: boolean;
    schemaMarkupFound: boolean;
    schemaType?: string;
    internalLinkingScore: number;
    coreWebVitals: {
      lcp: number; // seconds
      cls: number; // layout shift score
      fid: number; // milliseconds
    };
  };
  fixList: {
    id: string;
    title: string;
    description: string;
    priority: "critical" | "moderate" | "low";
    category: string;
    impact: "high" | "medium" | "low";
  }[];
}

export interface CompetitorAnalysis {
  clientId: string;
  analyzedAt: string;
  competitors: {
    url: string;
    name: string;
    contentLength: number; // average word count
    keywordDensity: number; // percentage
    backlinksCount: number;
    speedSeconds: number;
    internalLinksCount: number;
    schemaType: string;
  }[];
  contentGaps: {
    topic: string;
    competitorStrength: "high" | "medium";
    ourStatus: "missing" | "needs-work";
    actionItem: string;
  }[];
  keywordGaps: {
    keyword: string;
    competitorRank: number;
    searchVolume: number;
    difficulty: number; // percent
  }[];
}

export interface RankPoint {
  date: string;
  rank: number;
  mobileRank: number;
  localRank: number;
}

export interface KeywordRankHistory {
  id: string;
  clientId: string;
  keyword: string;
  currentRank: number;
  previousRank: number;
  history: RankPoint[];
  volume: number;
}

export interface SavedArticle {
  id: string;
  clientId: string;
  title: string;
  type: "blog" | "service" | "landing" | "meta" | "faq" | "schema";
  content: string;
  createdAt: string;
  keywordsUsed: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  clientId?: string;
}

export interface SEOReport {
  id: string;
  clientId: string;
  createdAt: string;
  period: string;
  seoScore: number;
  trafficGrowth: string;
  rankingsSummary: string;
  workCompleted: string[];
  nextSteps: string[];
}
