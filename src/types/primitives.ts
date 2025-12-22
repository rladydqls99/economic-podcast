/**
 * Branded types for domain-invariant primitives
 * 특정 도메인에 종속되지 않는 원시 타입 확장
 */

/**
 * Normalized number between 0 and 1 (inclusive)
 * 0과 1 사이의 정규화된 숫자 (0, 1 포함)
 *
 * @example
 * const similarity: Norm = 0.85 as Norm;
 * const probability: Norm = calculateProbability() as Norm;
 */
export type Norm = number;

/**
 * Type guard to validate if a number is within normalized range
 * 숫자가 정규화된 범위 내에 있는지 검증하는 타입 가드
 */
export const isNorm = (value: number): value is Norm => {
  return value >= 0 && value <= 1;
};

/**
 * Safe constructor for Norm type with runtime validation
 * 런타임 검증을 포함한 안전한 Norm 생성자
 */
export const toNorm = (value: number): Norm => {
  if (!isNorm(value)) {
    throw new RangeError(`Value ${value} is out of normalized range [0, 1]`);
  }
  return value as Norm;
};

/**
 * Percentage type (0-100)
 * 백분율 타입 (0-100)
 */
export type Percentage = number & { readonly __brand: 'Percentage' };

export const isPercentage = (value: number): value is Percentage => {
  return value >= 0 && value <= 100;
};

export const toPercentage = (value: number): Percentage => {
  if (!isPercentage(value)) {
    throw new RangeError(`Value ${value} is out of percentage range [0, 100]`);
  }
  return value as Percentage;
};

/**
 * Convert Norm to Percentage
 */
export const normToPercentage = (norm: Norm): Percentage => {
  return (norm * 100) as Percentage;
};
