/**
 * ScriptValidator Unit Tests
 *
 * Tests script validation logic:
 * - Structure validation (sections exist, lengths)
 * - Quality validation (Hook effectiveness, CTA strength)
 * - Score calculation
 * - Edge cases and boundary conditions
 *
 * @module script-generator/__test__/validator.unit.test
 */

import { describe, it, expect } from '@jest/globals';
import { ScriptValidator } from '../validator.js';
import { ScriptResult } from '../types.js';

describe('ScriptValidator', () => {
  describe('validateScript', () => {
    describe('Valid Scripts', () => {
      it('should pass validation for perfect script (score 100)', () => {
        const perfectScript: ScriptResult = {
          success: true,
          script:
            '당신 삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 추가 분석이 이어집니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 우리 노후자금에도 영향을 미치죠. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '당신 삼성전자 주가 -5% 급락!', // 18자, 숫자 O, 감정 O, 직접 호명 O
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 추가 분석이 이어집니다.', // 63자
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 우리 노후자금에도 영향을 미치죠.', // 105자, 직접 호명 O
            conclusion: '내일 출근해서 동료한테 얘기해보세요.', // 21자, 행동 동사 O, 긴급성 O
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 207,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 }, // 임시값
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(perfectScript);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
        expect(result.score).toBe(100);
      });

      it('should pass validation with warnings for suboptimal script', () => {
        const suboptimalScript: ScriptResult = {
          success: true,
          script:
            '금리 변화. 중앙은행이 어제 금리를 인상하면서 시장이 요동쳤습니다. 금리 인상은 대출 금리 상승으로 이어져 집을 사려는 사람들에게 부담이 됩니다. 특히 변동금리 대출자는 이자 부담이 크게 늘어날 수 있습니다. 금융 상품을 체크하세요.',
          sections: {
            hook: '금리 변화.', // 6자 (너무 짧음), 숫자 X, 감정 X, 직접 호명 X
            problem: '중앙은행이 어제 금리를 인상하면서 시장이 요동쳤습니다.', // 45자 (약간 짧음)
            impact:
              '금리 인상은 대출 금리 상승으로 이어져 집을 사려는 사람들에게 부담이 됩니다. 특히 변동금리 대출자는 이자 부담이 크게 늘어날 수 있습니다.', // 95자 (약간 짧음)
            conclusion: '금융 상품을 체크하세요.', // 20자, 행동 동사 O, 긴급성 X
          },
          metadata: {
            estimatedDuration: 38,
            characterCount: 186,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 2800,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(suboptimalScript);

        expect(result.isValid).toBe(true); // 에러 없음
        expect(result.errors).toHaveLength(0);
        expect(result.warnings.length).toBeGreaterThan(0); // 여러 경고 발생
        expect(result.score).toBeLessThan(100); // 점수 감점
        expect(result.score).toBeGreaterThanOrEqual(60); // 하지만 60점 이상

        // Hook 관련 경고 확인
        expect(result.warnings).toContain('Hook 길이가 권장 범위를 벗어남 (현재: 6자, 권장: 10-30자)');
        expect(result.warnings).toContain('Hook에 숫자가 없습니다 (충격적 사실 강화 권장)');
        expect(result.warnings).toContain('Hook에 감정 트리거가 없습니다 (급락, 위험, 기회 등 권장)');
        expect(result.warnings).toContain('Hook에 직접 호명이 없습니다 (당신의, 내 지갑 등 권장)');
      });
    });

    describe('Missing Sections (Structure Errors)', () => {
      it('should fail validation for missing hook', () => {
        const noHookScript: ScriptResult = {
          success: true,
          script: '문제 설명입니다. 영향 설명입니다. 결론입니다.',
          sections: {
            hook: '', // 비어있음
            problem: '문제 설명입니다. 중앙은행이 어제 금리를 인상하면서 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 40,
            characterCount: 200,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noHookScript);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Hook 섹션이 비어있습니다');
        expect(result.score).toBeLessThan(100);
      });

      it('should fail validation for missing problem', () => {
        const noProblemScript: ScriptResult = {
          success: true,
          script: '삼성전자 주가 -5% 급락! 영향 설명입니다. 결론입니다.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '   ', // 공백만 있음
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 40,
            characterCount: 200,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noProblemScript);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('문제 섹션이 비어있습니다');
      });

      it('should fail validation for missing impact', () => {
        const noImpactScript: ScriptResult = {
          success: true,
          script: '삼성전자 주가 -5% 급락! 문제 설명입니다. 결론입니다.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact: '', // 비어있음
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 40,
            characterCount: 200,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noImpactScript);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('영향 섹션이 비어있습니다');
      });

      it('should fail validation for missing conclusion', () => {
        const noConclusionScript: ScriptResult = {
          success: true,
          script: '삼성전자 주가 -5% 급락! 문제 설명입니다. 영향 설명입니다.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '', // 비어있음
          },
          metadata: {
            estimatedDuration: 40,
            characterCount: 200,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noConclusionScript);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('결론 섹션이 비어있습니다');
      });

      it('should detect multiple missing sections', () => {
        const multipleMissingScript: ScriptResult = {
          success: true,
          script: '문제 설명입니다.',
          sections: {
            hook: '', // 비어있음
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact: '', // 비어있음
            conclusion: '', // 비어있음
          },
          metadata: {
            estimatedDuration: 20,
            characterCount: 100,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(multipleMissingScript);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(3); // hook, impact, conclusion + 길이 에러, CTA 에러
        expect(result.errors).toContain('Hook 섹션이 비어있습니다');
        expect(result.errors).toContain('영향 섹션이 비어있습니다');
        expect(result.errors).toContain('결론 섹션이 비어있습니다');
        expect(result.score).toBe(0); // 여러 에러 = 최소 0점
      });
    });

    describe('Total Length Validation (Quality Errors)', () => {
      it('should fail validation for too short script (< 180 chars)', () => {
        const tooShortScript: ScriptResult = {
          success: true,
          script: '금리 인상. 시장 요동. 당신 월급에 영향. 체크하세요.', // 30자
          sections: {
            hook: '금리 인상.',
            problem: '시장 요동.',
            impact: '당신 월급에 영향.',
            conclusion: '체크하세요.',
          },
          metadata: {
            estimatedDuration: 15,
            characterCount: 30,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 2500,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(tooShortScript);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('전체 길이가 너무 짧습니다 (현재: 30자, 최소: 180자)');
      });

      it('should fail validation for too long script (> 270 chars)', () => {
        const tooLongScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가가 -5% 급락했습니다. 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 추가로 더 많은 설명이 이어집니다. 더 많은 내용이 계속됩니다. 내일 출근해서 동료한테 얘기해보세요.', // 300자
          sections: {
            hook: '삼성전자 주가가 -5% 급락했습니다.',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 추가로 더 많은 설명이 이어집니다. 더 많은 내용이 계속됩니다.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 70,
            characterCount: 300,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3500,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(tooLongScript);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('전체 길이가 너무 깁니다 (현재: 300자, 최대: 270자)');
      });

      it('should pass for script at exact minimum length (180 chars)', () => {
        const minLengthScript: ScriptResult = {
          success: true,
          script: '삼성전자 -5% 급락! 엔비디아 신제품 발표로 반도체 시장 요동. 당신 월급과 관련 있습니다. IT업계 연봉 동결, 취업시장 얼어붙을 수 있어요. 최저 임금도 영향 받습니다. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 -5% 급락!',
            problem: '엔비디아 신제품 발표로 반도체 시장 요동.',
            impact: '당신 월급과 관련 있습니다. IT업계 연봉 동결, 취업시장 얼어붙을 수 있어요. 최저 임금도 영향 받습니다.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 40,
            characterCount: 180,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(minLengthScript);

        expect(result.isValid).toBe(true);
        expect(result.errors).not.toContain(expect.stringContaining('전체 길이'));
      });

      it('should pass for script at exact maximum length (270 chars)', () => {
        const maxLengthScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 추가 영향 설명이 포함됩니다. 내일 출근해서 동료한테 얘기해보세요.', // 정확히 270자
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 추가 영향 설명이 포함됩니다.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 60,
            characterCount: 270,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(maxLengthScript);

        expect(result.isValid).toBe(true);
        expect(result.errors).not.toContain(expect.stringContaining('전체 길이'));
      });
    });

    describe('Hook Effectiveness (Quality Warnings)', () => {
      it('should warn if hook lacks numbers', () => {
        const noNumberHookScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 급락!', // 숫자 없음
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 215,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noNumberHookScript);

        expect(result.isValid).toBe(true); // 경고만 있음
        expect(result.warnings).toContain('Hook에 숫자가 없습니다 (충격적 사실 강화 권장)');
      });

      it('should warn if hook lacks emotional triggers', () => {
        const noEmotionHookScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5%. 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 주가 -5%.', // 감정 트리거 없음 (급락, 위험 등)
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 215,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noEmotionHookScript);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Hook에 감정 트리거가 없습니다 (급락, 위험, 기회 등 권장)');
      });

      it('should warn if hook lacks direct address', () => {
        const noDirectAddressScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!', // 직접 호명 없음 (당신, 내 등)
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact: '삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 43,
            characterCount: 205,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noDirectAddressScript);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Hook에 직접 호명이 없습니다 (당신의, 내 지갑 등 권장)');
      });

      it('should validate all emotional trigger keywords', () => {
        const emotionKeywords = ['급락', '급등', '위험', '기회', '충격', '폭등', '폭락', '긴급', '경고'];

        emotionKeywords.forEach((keyword) => {
          const script: ScriptResult = {
            success: true,
            script: `삼성전자 주가 ${keyword}! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.`,
            sections: {
              hook: `삼성전자 주가 ${keyword}!`,
              problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
              impact:
                '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
              conclusion: '내일 출근해서 동료한테 얘기해보세요.',
            },
            metadata: {
              estimatedDuration: 45,
              characterCount: 215,
              newsCount: 3,
              generatedAt: new Date(),
              processingTime: 3200,
            },
            validation: { isValid: true, errors: [], warnings: [], score: 0 },
          };

          const validator = new ScriptValidator();
          const result = validator.validateScript(script);

          expect(result.warnings).not.toContain('Hook에 감정 트리거가 없습니다 (급락, 위험, 기회 등 권장)');
        });
      });

      it('should validate all direct address keywords', () => {
        const directAddressKeywords = ['당신', '내', '우리', '여러분'];

        directAddressKeywords.forEach((keyword) => {
          const script: ScriptResult = {
            success: true,
            script: `${keyword} 삼성전자 주가 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 ${keyword} 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.`,
            sections: {
              hook: `${keyword} 삼성전자 주가 급락!`,
              problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
              impact:
                `이게 ${keyword} 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.`,
              conclusion: '내일 출근해서 동료한테 얘기해보세요.',
            },
            metadata: {
              estimatedDuration: 45,
              characterCount: 215,
              newsCount: 3,
              generatedAt: new Date(),
              processingTime: 3200,
            },
            validation: { isValid: true, errors: [], warnings: [], score: 0 },
          };

          const validator = new ScriptValidator();
          const result = validator.validateScript(script);

          expect(result.warnings).not.toContain('Hook에 직접 호명이 없습니다 (당신의, 내 지갑 등 권장)');
        });
      });
    });

    describe('CTA Validation (Quality Errors & Warnings)', () => {
      it('should fail validation if conclusion lacks action verbs (error)', () => {
        const noCTAScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근합니다.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근합니다.', // 행동 동사 없음
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 215,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noCTAScript);

        expect(result.isValid).toBe(false); // 에러
        expect(result.errors).toContain('결론에 행동 동사가 없습니다 (CTA 필수)');
      });

      it('should warn if conclusion lacks urgency', () => {
        const noUrgencyCTAScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '동료한테 얘기해보세요.', // 긴급성 없음
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 215,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(noUrgencyCTAScript);

        expect(result.isValid).toBe(true); // 경고만
        expect(result.warnings).toContain('결론에 긴급성 표현이 없습니다 (지금, 내일 등 권장)');
      });

      it('should validate all action verb keywords', () => {
        const actionVerbs = ['확인', '준비', '체크', '얘기', '공유', '저장', '기억', '주목'];

        actionVerbs.forEach((verb) => {
          const script: ScriptResult = {
            success: true,
            script: `삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 ${verb}하세요.`,
            sections: {
              hook: '삼성전자 주가 -5% 급락!',
              problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
              impact:
                '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
              conclusion: `내일 ${verb}하세요.`,
            },
            metadata: {
              estimatedDuration: 45,
              characterCount: 215,
              newsCount: 3,
              generatedAt: new Date(),
              processingTime: 3200,
            },
            validation: { isValid: true, errors: [], warnings: [], score: 0 },
          };

          const validator = new ScriptValidator();
          const result = validator.validateScript(script);

          expect(result.errors).not.toContain('결론에 행동 동사가 없습니다 (CTA 필수)');
        });
      });

      it('should validate all urgency keywords', () => {
        const urgencyKeywords = ['지금', '내일', '즉시', '빨리', '서둘러', '곧'];

        urgencyKeywords.forEach((keyword) => {
          const script: ScriptResult = {
            success: true,
            script: `삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. ${keyword} 확인하세요.`,
            sections: {
              hook: '삼성전자 주가 -5% 급락!',
              problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
              impact:
                '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
              conclusion: `${keyword} 확인하세요.`,
            },
            metadata: {
              estimatedDuration: 45,
              characterCount: 215,
              newsCount: 3,
              generatedAt: new Date(),
              processingTime: 3200,
            },
            validation: { isValid: true, errors: [], warnings: [], score: 0 },
          };

          const validator = new ScriptValidator();
          const result = validator.validateScript(script);

          expect(result.warnings).not.toContain('결론에 긴급성 표현이 없습니다 (지금, 내일 등 권장)');
        });
      });
    });

    describe('Score Calculation', () => {
      it('should calculate score correctly for perfect script (100 points)', () => {
        const perfectScript: ScriptResult = {
          success: true,
          script:
            '당신 삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 추가 분석이 이어집니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 우리 노후자금에도 영향을 미치죠. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '당신 삼성전자 주가 -5% 급락!', // 18자, 숫자 O, 감정 O, 직접 호명 O
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 추가 분석이 이어집니다.', // 63자
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 우리 노후자금에도 영향을 미치죠.', // 105자, 직접 호명 O
            conclusion: '내일 출근해서 동료한테 얘기해보세요.', // 21자, 행동 동사 O, 긴급성 O
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 207,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(perfectScript);

        expect(result.score).toBe(100);
      });

      it('should deduct 30 points per structure error', () => {
        const oneStructureErrorScript: ScriptResult = {
          success: true,
          script: '문제 설명입니다. 영향 설명입니다. 결론입니다.',
          sections: {
            hook: '', // 구조 에러 1개
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 40,
            characterCount: 200,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(oneStructureErrorScript);

        expect(result.score).toBeLessThanOrEqual(70); // 100 - 30 = 70 (최대)
      });

      it('should deduct 20 points per quality error', () => {
        const oneQualityErrorScript: ScriptResult = {
          success: true,
          script: '삼성전자 주가 -5% 급락! 문제. 영향. 그냥 말합니다.', // 너무 짧음 (품질 에러 1개)
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '문제.',
            impact: '영향.',
            conclusion: '그냥 말합니다.', // CTA 없음 (품질 에러 2개)
          },
          metadata: {
            estimatedDuration: 15,
            characterCount: 50,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 2500,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(oneQualityErrorScript);

        // 품질 에러 2개: -40점 (너무 짧음, CTA 없음)
        // 구조 경고 4개: -20점 (모든 섹션 길이 부족)
        // 품질 경고 3개: -15점 (Hook 숫자/감정/직접호명 없음)
        expect(result.score).toBeLessThanOrEqual(60); // 100 - 40 = 60 (최대)
      });

      it('should deduct 5 points per warning', () => {
        const multipleWarningsScript: ScriptResult = {
          success: true,
          script:
            '금리 변화. 중앙은행이 어제 금리를 인상하면서 시장이 요동쳤습니다. 금리 인상은 대출 금리 상승으로 이어져 집을 사려는 사람들에게 부담이 됩니다. 특히 변동금리 대출자는 이자 부담이 크게 늘어날 수 있습니다. 금융 상품을 체크하세요.',
          sections: {
            hook: '금리 변화.', // 경고: 너무 짧음, 숫자 없음, 감정 없음, 직접 호명 없음
            problem: '중앙은행이 어제 금리를 인상하면서 시장이 요동쳤습니다.', // 경고: 약간 짧음
            impact:
              '금리 인상은 대출 금리 상승으로 이어져 집을 사려는 사람들에게 부담이 됩니다. 특히 변동금리 대출자는 이자 부담이 크게 늘어날 수 있습니다.', // 경고: 약간 짧음
            conclusion: '금융 상품을 체크하세요.', // 경고: 긴급성 없음
          },
          metadata: {
            estimatedDuration: 38,
            characterCount: 186,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 2800,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(multipleWarningsScript);

        // 구조 경고 4개 + 품질 경고 4개 = 8개 경고 = -40점
        expect(result.warnings.length).toBeGreaterThanOrEqual(7);
        expect(result.score).toBeLessThanOrEqual(65); // 약 60점대
      });

      it('should not go below 0 points', () => {
        const terribleScript: ScriptResult = {
          success: true,
          script: '짧음',
          sections: {
            hook: '',
            problem: '',
            impact: '',
            conclusion: '',
          },
          metadata: {
            estimatedDuration: 5,
            characterCount: 10,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 1000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(terribleScript);

        expect(result.score).toBe(0); // 최소 0점
        expect(result.score).toBeGreaterThanOrEqual(0);
      });

      it('should calculate exact score for known error/warning counts', () => {
        // 1개 구조 에러, 1개 품질 에러, 2개 경고
        const knownScript: ScriptResult = {
          success: true,
          script: '삼성전자 급락 문제. 영향. 그냥.',
          sections: {
            hook: '', // 구조 에러: -30
            problem: '문제입니다.',
            impact: '영향입니다.',
            conclusion: '그냥.', // 품질 에러 (CTA 없음): -20
          },
          metadata: {
            estimatedDuration: 10,
            characterCount: 25, // 품질 에러 (너무 짧음): -20
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 2000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(knownScript);

        // 구조 에러 1개: -30
        // 품질 에러 2개: -40 (너무 짧음, CTA 없음)
        // 나머지 경고들: 여러 개 (-5점씩)
        expect(result.errors).toHaveLength(3); // hook 비어있음, 너무 짧음, CTA 없음
        expect(result.score).toBe(0); // 70 - 경고들 = 0
      });
    });

    describe('Section Length Warnings', () => {
      it('should warn for hook length outside 10-30 chars', () => {
        const tooShortHookScript: ScriptResult = {
          success: true,
          script:
            '금리! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '금리!', // 3자
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 44,
            characterCount: 210,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(tooShortHookScript);

        expect(result.warnings).toContain('Hook 길이가 권장 범위를 벗어남 (현재: 3자, 권장: 10-30자)');
      });

      it('should warn for problem length outside 50-100 chars', () => {
        const shortProblemScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 문제입니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '문제입니다.', // 6자
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 40,
            characterCount: 195,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(shortProblemScript);

        expect(result.warnings).toContain('문제 길이가 권장 범위를 벗어남 (현재: 6자, 권장: 50-100자)');
      });

      it('should warn for impact length outside 100-150 chars', () => {
        const shortImpactScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 당신 월급에 영향. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact: '당신 월급에 영향.', // 10자
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 32,
            characterCount: 155,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(shortImpactScript);

        expect(result.warnings).toContain('영향 길이가 권장 범위를 벗어남 (현재: 10자, 권장: 100-150자)');
      });

      it('should warn for conclusion length outside 20-50 chars', () => {
        const shortConclusionScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 얘기.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!',
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '얘기.', // 3자
          },
          metadata: {
            estimatedDuration: 43,
            characterCount: 207,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(shortConclusionScript);

        expect(result.warnings).toContain('결론 길이가 권장 범위를 벗어남 (현재: 3자, 권장: 20-50자)');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty metadata characterCount', () => {
        const emptyMetadataScript: ScriptResult = {
          success: true,
          script: '',
          sections: {
            hook: '',
            problem: '',
            impact: '',
            conclusion: '',
          },
          metadata: {
            estimatedDuration: 0,
            characterCount: 0,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 1000,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(emptyMetadataScript);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('전체 길이가 너무 짧습니다 (현재: 0자, 최소: 180자)');
      });

      it('should handle regex special characters in sections', () => {
        const specialCharsScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 $10% +급락!!! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 $10% +급락!!!', // 특수 문자
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.',
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 228,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(specialCharsScript);

        // 특수 문자가 있어도 숫자와 감정 트리거는 감지되어야 함
        expect(result.warnings).not.toContain('Hook에 숫자가 없습니다 (충격적 사실 강화 권장)');
        expect(result.warnings).not.toContain('Hook에 감정 트리거가 없습니다 (급락, 위험, 기회 등 권장)');
      });

      it('should handle case-insensitive keyword matching', () => {
        const uppercaseScript: ScriptResult = {
          success: true,
          script:
            '삼성전자 주가 -5% 급락! 엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다. 이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요. 내일 출근해서 동료한테 얘기해보세요.',
          sections: {
            hook: '삼성전자 주가 -5% 급락!', // '급락' 소문자
            problem: '엔비디아가 어제 신제품 발표를 하면서 전 세계 반도체 시장이 요동쳤습니다.',
            impact:
              '이게 당신 월급과 무슨 관계냐면, 삼성전자 하락은 곧 한국 경제 전체의 신호등입니다. IT업계 연봉 동결은 물론이고 취업 시장까지 얼어붙을 수 있어요.',
            conclusion: '내일 출근해서 동료한테 얘기해보세요.', // '얘기', '내일' 소문자
          },
          metadata: {
            estimatedDuration: 45,
            characterCount: 225,
            newsCount: 3,
            generatedAt: new Date(),
            processingTime: 3200,
          },
          validation: { isValid: true, errors: [], warnings: [], score: 0 },
        };

        const validator = new ScriptValidator();
        const result = validator.validateScript(uppercaseScript);

        // 대소문자 구분 없이 감지되어야 함
        expect(result.warnings).not.toContain('Hook에 감정 트리거가 없습니다 (급락, 위험, 기회 등 권장)');
        expect(result.errors).not.toContain('결론에 행동 동사가 없습니다 (CTA 필수)');
        expect(result.warnings).not.toContain('결론에 긴급성 표현이 없습니다 (지금, 내일 등 권장)');
      });
    });
  });
});
