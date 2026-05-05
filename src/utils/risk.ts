import type { RiskLevel } from '../types/incident';

/**
 * risk_score → risk_level 분류
 * - 80 이상: 긴급
 * - 50 ~ 79: 주의
 * - 50 미만: 낮음
 */
export function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 80) return '긴급';
  if (score >= 50) return '주의';
  return '낮음';
}
