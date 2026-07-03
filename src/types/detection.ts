// 检测引擎核心类型定义

export type Severity = "high" | "mid" | "low";
export type AlgorithmStatus = "pass" | "warn" | "fail";
export type Grade = "A" | "B" | "C" | "D" | "F";
export type Competition = "low" | "mid" | "high";
export type SandboxState = "none" | "active" | "released";

/** 页面特征对象：由 URL 解析 + 模拟抓取特征组成 */
export interface PageFeatures {
  url: string;
  domain: string;
  protocol: "http" | "https";
  pathDepth: number;
  isRegistered: boolean; // 是否备案推断
  titleLength: number;
  keywordDensity: number; // 关键词密度 0-1
  firstScreenTime: number; // 首屏加载秒数
  mobileInteractiveScore: number; // 移动端交互分 0-100
  externalLinkCount: number;
  lowQualityLinkRatio: number; // 低质外链占比 0-1
  contentLength: number;
  aiTraceScore: number; // AI 痕迹分 0-100
  semanticHomogeneity: number; // 语义同质化 0-1
  authorIdentity: boolean; // 是否有明确作者
  authorityBadge: boolean; // 是否有权威资质
  citeSource: boolean; // 是否引用权威来源
  adInsertion: boolean; // 是否穿插引流
  titleBodyMatch: number; // 标题正文语义匹配度 0-1
  bounceRate: number; // 模拟跳出率 0-1
  dwellTime: number; // 模拟停留时长秒
  titleSample: string;
  topicKeywords: string[];
}

/** 单条规则命中 */
export interface RuleHit {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  deduct: number;
  evidence: string;
  suggestion: string;
}

/** 单个算法诊断结果 */
export interface AlgorithmDiagnosis {
  algorithmId: string;
  algorithmName: string;
  status: AlgorithmStatus;
  score: number; // 0-100
  hits: RuleHit[];
}

/** 蜘蛛行为序列单步 */
export interface SpiderBehavior {
  phase: string;
  action: string;
  result: "ok" | "warn" | "block";
  detail: string;
  latencyMs: number;
}

/** 蜘蛛喜好度结果 */
export interface SpiderAffinity {
  score: number; // 0-100
  level: string;
  behaviorSequence: SpiderBehavior[];
  trace: { x: number; y: number; label: string }[];
}

/** 收录预测结果 */
export interface InclusionPrediction {
  probability: number; // 0-1
  estimatedDays: [number, number];
  sandbox: SandboxState;
  registrationImpact: string;
  factors: { label: string; impact: "positive" | "negative" | "neutral"; detail: string }[];
}

/** 关键词预测单条 */
export interface KeywordPrediction {
  keyword: string;
  competition: Competition;
  rankRange: [number, number];
  trafficEstimate: number;
  difficulty: number; // 0-100
  intent: string;
}

/** 整改清单单条 */
export interface RemediationItem {
  id: string;
  priority: "P0" | "P1" | "P2" | "P3";
  algorithmId: string;
  title: string;
  problem: string;
  solution: string;
  codeSample?: string;
  impact: string;
}

/** 完整检测结果 */
export interface DetectionResult {
  url: string;
  timestamp: number;
  overallScore: number;
  grade: Grade;
  gradeLabel: string;
  features: PageFeatures;
  diagnoses: AlgorithmDiagnosis[];
  spiderAffinity: SpiderAffinity;
  inclusionPrediction: InclusionPrediction;
  keywordPrediction: KeywordPrediction[];
  remediation: RemediationItem[];
  /** 用户粘贴或自动抓取的正文（可选） */
  pageContent?: string;
  /** AIGC 检测结果（仅当有正文时存在） */
  aiDetection?: import("@/engine/aiContentDetector").AiDetectionResult;
  /** 页面抓取结果（自动抓取时存在） */
  fetchResult?: import("@/engine/pageFetcher").FetchResult;
}

/** 算法静态元数据 */
export interface AlgorithmMeta {
  id: string;
  name: string;
  version: string;
  weight: number;
  category: "content" | "cheat" | "link" | "speed" | "behavior" | "authority";
  icon: string;
  color: string;
  coreUpgrade: string;
  controlPoints: string[];
  violationExample: string;
  complianceAdvice: string;
}
