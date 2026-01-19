
export interface GradeStats {
  mean: number;
  variance: number;
  stdDev: number;
  max: number;
  min: number;
  count: number;
  passRate: number;
  excellenceRate: number;
  failureRate: number;
  distribution: { range: string; count: number }[];
}

export interface Thresholds {
  passing: number;
  excellent: number;
  maxScore: number;
}

export interface AnalysisResult {
  scores: number[];
  stats: GradeStats;
  thresholds: Thresholds;
}
