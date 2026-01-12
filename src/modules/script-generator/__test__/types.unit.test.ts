import { describe, it, expect } from '@jest/globals';
import {
  ScriptGeneratorConfigSchema,
  ScriptSectionsSchema,
  ScriptMetadataSchema,
  ValidationResultSchema,
  ScriptResultSchema,
  type ScriptGeneratorConfig,
  type ScriptSections,
  type ScriptMetadata,
  type ValidationResult,
  type ScriptResult,
} from '../types.js';

/**
 * Unit Tests for Script Generator Types
 *
 * Tests all Zod schemas and type definitions for:
 * - Valid data validation
 * - Invalid data rejection
 * - Edge cases
 * - Default values
 * - Type inference
 *
 * Target: 100% coverage
 */

describe('Script Generator Types', () => {
  // =================================================================
  // ScriptGeneratorConfigSchema Tests
  // =================================================================
  describe('ScriptGeneratorConfigSchema', () => {
    it('should validate a valid config with all fields', () => {
      const validConfig: ScriptGeneratorConfig = {
        temperature: 0.7,
        maxTokens: 500,
        timeout: 5000,
      };

      const result = ScriptGeneratorConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.7);
        expect(result.data.maxTokens).toBe(500);
        expect(result.data.timeout).toBe(5000);
      }
    });

    it('should apply default values when fields are missing', () => {
      const minimalConfig = {};

      const result = ScriptGeneratorConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.7);
        expect(result.data.maxTokens).toBe(500);
        expect(result.data.timeout).toBe(5000);
      }
    });

    it('should validate partial config with temperature only', () => {
      const config = { temperature: 0.9 };

      const result = ScriptGeneratorConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.9);
        expect(result.data.maxTokens).toBe(500); // default
        expect(result.data.timeout).toBe(5000); // default
      }
    });

    it('should reject temperature below 0', () => {
      const invalidConfig = { temperature: -0.1 };

      const result = ScriptGeneratorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject temperature above 1', () => {
      const invalidConfig = { temperature: 1.1 };

      const result = ScriptGeneratorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should accept temperature at boundaries (0 and 1)', () => {
      const configMin = { temperature: 0 };
      const configMax = { temperature: 1 };

      expect(ScriptGeneratorConfigSchema.safeParse(configMin).success).toBe(true);
      expect(ScriptGeneratorConfigSchema.safeParse(configMax).success).toBe(true);
    });

    it('should reject negative maxTokens', () => {
      const invalidConfig = { maxTokens: -100 };

      const result = ScriptGeneratorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject zero maxTokens', () => {
      const invalidConfig = { maxTokens: 0 };

      const result = ScriptGeneratorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer maxTokens', () => {
      const invalidConfig = { maxTokens: 500.5 };

      const result = ScriptGeneratorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject negative timeout', () => {
      const invalidConfig = { timeout: -1000 };

      const result = ScriptGeneratorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject zero timeout', () => {
      const invalidConfig = { timeout: 0 };

      const result = ScriptGeneratorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // ScriptSectionsSchema Tests
  // =================================================================
  describe('ScriptSectionsSchema', () => {
    it('should validate a valid script with all sections', () => {
      const validSections: ScriptSections = {
        hook: '삼성전자 주가 -5% 급락!',
        problem: '엔비디아가 어제 신제품 발표를 하면서 반도체 시장에 큰 변화가 생겼습니다.',
        impact: '이게 당신 월급과 무슨 관계냐면, 삼성전자 주가가 떨어지면 연금펀드 수익률도 함께 떨어집니다.',
        conclusion: '내일 출근해서 동료한테 얘기해보세요.',
      };

      const result = ScriptSectionsSchema.safeParse(validSections);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hook).toBe(validSections.hook);
        expect(result.data.problem).toBe(validSections.problem);
        expect(result.data.impact).toBe(validSections.impact);
        expect(result.data.conclusion).toBe(validSections.conclusion);
      }
    });

    it('should reject empty hook', () => {
      const invalidSections = {
        hook: '',
        problem: 'Valid problem',
        impact: 'Valid impact',
        conclusion: 'Valid conclusion',
      };

      const result = ScriptSectionsSchema.safeParse(invalidSections);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Hook cannot be empty');
      }
    });

    it('should reject empty problem', () => {
      const invalidSections = {
        hook: 'Valid hook',
        problem: '',
        impact: 'Valid impact',
        conclusion: 'Valid conclusion',
      };

      const result = ScriptSectionsSchema.safeParse(invalidSections);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Problem section cannot be empty');
      }
    });

    it('should reject empty impact', () => {
      const invalidSections = {
        hook: 'Valid hook',
        problem: 'Valid problem',
        impact: '',
        conclusion: 'Valid conclusion',
      };

      const result = ScriptSectionsSchema.safeParse(invalidSections);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Impact section cannot be empty');
      }
    });

    it('should reject empty conclusion', () => {
      const invalidSections = {
        hook: 'Valid hook',
        problem: 'Valid problem',
        impact: 'Valid impact',
        conclusion: '',
      };

      const result = ScriptSectionsSchema.safeParse(invalidSections);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Conclusion cannot be empty');
      }
    });

    it('should reject missing hook field', () => {
      const invalidSections = {
        problem: 'Valid problem',
        impact: 'Valid impact',
        conclusion: 'Valid conclusion',
      };

      const result = ScriptSectionsSchema.safeParse(invalidSections);
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only sections', () => {
      const invalidSections = {
        hook: '   ',
        problem: 'Valid problem',
        impact: 'Valid impact',
        conclusion: 'Valid conclusion',
      };

      const result = ScriptSectionsSchema.safeParse(invalidSections);
      expect(result.success).toBe(false);
    });

    it('should accept single-character sections', () => {
      const minimalSections: ScriptSections = {
        hook: 'A',
        problem: 'B',
        impact: 'C',
        conclusion: 'D',
      };

      const result = ScriptSectionsSchema.safeParse(minimalSections);
      expect(result.success).toBe(true);
    });

    it('should accept sections with special characters', () => {
      const sectionsWithSpecialChars: ScriptSections = {
        hook: '주가 -5% 급락! 🚨',
        problem: '엔비디아 vs 삼성전자 (경쟁 심화)',
        impact: '당신의 $투자금$이 위험합니다!',
        conclusion: '지금 확인하세요 → https://example.com',
      };

      const result = ScriptSectionsSchema.safeParse(sectionsWithSpecialChars);
      expect(result.success).toBe(true);
    });
  });

  // =================================================================
  // ScriptMetadataSchema Tests
  // =================================================================
  describe('ScriptMetadataSchema', () => {
    it('should validate valid metadata', () => {
      const validMetadata: ScriptMetadata = {
        estimatedDuration: 45,
        characterCount: 215,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 3200,
      };

      const result = ScriptMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.estimatedDuration).toBe(45);
        expect(result.data.characterCount).toBe(215);
        expect(result.data.newsCount).toBe(3);
        expect(result.data.generatedAt).toBeInstanceOf(Date);
        expect(result.data.processingTime).toBe(3200);
      }
    });

    it('should validate metadata with newsCount at boundaries (3 and 5)', () => {
      const metadataMin: ScriptMetadata = {
        estimatedDuration: 40,
        characterCount: 180,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 2500,
      };

      const metadataMax: ScriptMetadata = {
        estimatedDuration: 50,
        characterCount: 270,
        newsCount: 5,
        generatedAt: new Date(),
        processingTime: 4000,
      };

      expect(ScriptMetadataSchema.safeParse(metadataMin).success).toBe(true);
      expect(ScriptMetadataSchema.safeParse(metadataMax).success).toBe(true);
    });

    it('should reject newsCount below 3', () => {
      const invalidMetadata = {
        estimatedDuration: 45,
        characterCount: 200,
        newsCount: 2,
        generatedAt: new Date(),
        processingTime: 3000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject newsCount above 5', () => {
      const invalidMetadata = {
        estimatedDuration: 45,
        characterCount: 200,
        newsCount: 6,
        generatedAt: new Date(),
        processingTime: 3000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject zero estimatedDuration', () => {
      const invalidMetadata = {
        estimatedDuration: 0,
        characterCount: 200,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 3000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject negative estimatedDuration', () => {
      const invalidMetadata = {
        estimatedDuration: -10,
        characterCount: 200,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 3000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should accept zero characterCount', () => {
      const metadata = {
        estimatedDuration: 1,
        characterCount: 0,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 100,
      };

      const result = ScriptMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should reject negative characterCount', () => {
      const invalidMetadata = {
        estimatedDuration: 45,
        characterCount: -50,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 3000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should accept zero processingTime', () => {
      const metadata = {
        estimatedDuration: 45,
        characterCount: 200,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 0,
      };

      const result = ScriptMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should reject negative processingTime', () => {
      const invalidMetadata = {
        estimatedDuration: 45,
        characterCount: 200,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: -1000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date', () => {
      const invalidMetadata = {
        estimatedDuration: 45,
        characterCount: 200,
        newsCount: 3,
        generatedAt: 'not a date',
        processingTime: 3000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer values', () => {
      const invalidMetadata = {
        estimatedDuration: 45.5,
        characterCount: 200,
        newsCount: 3,
        generatedAt: new Date(),
        processingTime: 3000,
      };

      const result = ScriptMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // ValidationResultSchema Tests
  // =================================================================
  describe('ValidationResultSchema', () => {
    it('should validate a valid validation result with no errors', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 85,
      };

      const result = ValidationResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.errors).toEqual([]);
        expect(result.data.warnings).toEqual([]);
        expect(result.data.score).toBe(85);
      }
    });

    it('should validate an invalid validation result with errors', () => {
      const invalidResult: ValidationResult = {
        isValid: false,
        errors: ['Hook is missing', 'Conclusion is too short'],
        warnings: ['Impact could be stronger'],
        score: 45,
      };

      const result = ValidationResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false);
        expect(result.data.errors).toHaveLength(2);
        expect(result.data.warnings).toHaveLength(1);
        expect(result.data.score).toBe(45);
      }
    });

    it('should validate score at boundaries (0 and 100)', () => {
      const resultMin: ValidationResult = {
        isValid: false,
        errors: ['Critical error'],
        warnings: [],
        score: 0,
      };

      const resultMax: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 100,
      };

      expect(ValidationResultSchema.safeParse(resultMin).success).toBe(true);
      expect(ValidationResultSchema.safeParse(resultMax).success).toBe(true);
    });

    it('should reject score below 0', () => {
      const invalidResult = {
        isValid: false,
        errors: [],
        warnings: [],
        score: -1,
      };

      const result = ValidationResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject score above 100', () => {
      const invalidResult = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 101,
      };

      const result = ValidationResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer score', () => {
      const invalidResult = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 85.5,
      };

      const result = ValidationResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject non-boolean isValid', () => {
      const invalidResult = {
        isValid: 'yes',
        errors: [],
        warnings: [],
        score: 85,
      };

      const result = ValidationResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject non-array errors', () => {
      const invalidResult = {
        isValid: false,
        errors: 'Error message',
        warnings: [],
        score: 50,
      };

      const result = ValidationResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should accept empty arrays for errors and warnings', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 100,
      };

      const result = ValidationResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate multiple warnings without errors', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Hook could be stronger', 'Consider adding numbers', 'CTA could be more specific'],
        score: 75,
      };

      const result = ValidationResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warnings).toHaveLength(3);
      }
    });
  });

  // =================================================================
  // ScriptResultSchema Tests
  // =================================================================
  describe('ScriptResultSchema', () => {
    it('should validate a complete valid script result', () => {
      const validScriptResult: ScriptResult = {
        success: true,
        script:
          '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 반도체 시장에 큰 변화가 생겼습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 주가가 떨어지면 연금펀드 수익률도 함께 떨어집니다. 내일 출근해서 동료한테 얘기해보세요.',
        sections: {
          hook: '삼성전자 주가 -5% 급락!',
          problem: '엔비디아가 어제 신제품 발표를 하면서 반도체 시장에 큰 변화가 생겼습니다.',
          impact: '이게 당신 월급과 무슨 관계냐면, 삼성전자 주가가 떨어지면 연금펀드 수익률도 함께 떨어집니다.',
          conclusion: '내일 출근해서 동료한테 얘기해보세요.',
        },
        metadata: {
          estimatedDuration: 45,
          characterCount: 215,
          newsCount: 3,
          generatedAt: new Date(),
          processingTime: 3200,
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          score: 85,
        },
      };

      const result = ScriptResultSchema.safeParse(validScriptResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.script).toBeTruthy();
        expect(result.data.sections.hook).toBeTruthy();
        expect(result.data.metadata.newsCount).toBeGreaterThanOrEqual(3);
        expect(result.data.validation.score).toBeGreaterThanOrEqual(0);
      }
    });

    it('should validate a failed script result with errors', () => {
      const failedResult: ScriptResult = {
        success: false,
        script: 'Incomplete script',
        sections: {
          hook: 'Hook only',
          problem: 'Problem section',
          impact: 'Impact section',
          conclusion: 'Conclusion',
        },
        metadata: {
          estimatedDuration: 20,
          characterCount: 80,
          newsCount: 3,
          generatedAt: new Date(),
          processingTime: 2000,
        },
        validation: {
          isValid: false,
          errors: ['Script too short', 'Hook not effective'],
          warnings: ['Missing numbers in hook'],
          score: 40,
        },
      };

      const result = ScriptResultSchema.safeParse(failedResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.validation.isValid).toBe(false);
        expect(result.data.validation.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject empty script text', () => {
      const invalidResult = {
        success: true,
        script: '',
        sections: {
          hook: 'Valid hook',
          problem: 'Valid problem',
          impact: 'Valid impact',
          conclusion: 'Valid conclusion',
        },
        metadata: {
          estimatedDuration: 45,
          characterCount: 200,
          newsCount: 3,
          generatedAt: new Date(),
          processingTime: 3000,
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          score: 85,
        },
      };

      const result = ScriptResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Script cannot be empty');
      }
    });

    it('should reject missing sections field', () => {
      const invalidResult = {
        success: true,
        script: 'Valid script text',
        metadata: {
          estimatedDuration: 45,
          characterCount: 200,
          newsCount: 3,
          generatedAt: new Date(),
          processingTime: 3000,
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          score: 85,
        },
      };

      const result = ScriptResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject missing metadata field', () => {
      const invalidResult = {
        success: true,
        script: 'Valid script text',
        sections: {
          hook: 'Valid hook',
          problem: 'Valid problem',
          impact: 'Valid impact',
          conclusion: 'Valid conclusion',
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          score: 85,
        },
      };

      const result = ScriptResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject missing validation field', () => {
      const invalidResult = {
        success: true,
        script: 'Valid script text',
        sections: {
          hook: 'Valid hook',
          problem: 'Valid problem',
          impact: 'Valid impact',
          conclusion: 'Valid conclusion',
        },
        metadata: {
          estimatedDuration: 45,
          characterCount: 200,
          newsCount: 3,
          generatedAt: new Date(),
          processingTime: 3000,
        },
      };

      const result = ScriptResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should validate nested schema errors propagate correctly', () => {
      const invalidResult = {
        success: true,
        script: 'Valid script',
        sections: {
          hook: '',
          problem: 'Valid problem',
          impact: 'Valid impact',
          conclusion: 'Valid conclusion',
        },
        metadata: {
          estimatedDuration: 45,
          characterCount: 200,
          newsCount: 3,
          generatedAt: new Date(),
          processingTime: 3000,
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          score: 85,
        },
      };

      const result = ScriptResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });
});
