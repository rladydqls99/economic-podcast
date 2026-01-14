import { env } from '@/config/env.js';
import { GoogleGenAI } from '@google/genai';
import z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const gemini = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const groundingTool = {
  googleSearch: {},
};

const responseSchema = z.object({
  hook: z.string().describe('첫 3초 문장 (충격적 사실, 긴급성 강조)'),
  problem: z.string().describe('문제 설명 (배경, 맥락, 쉬운 용어, 2-3문장)'),
  impact: z.string().describe('개인 영향 (내 지갑 관련성, 구체적 숫자, 3-4문장)'),
  conclusion: z.string().describe('결론 및 CTA (즉각적 행동 유도)'),
});

/**
 * Gemini API 호출 옵션
 */
export interface GeminiChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Gemini API로 텍스트 생성
 *
 * @param message - 입력 메시지 또는 프롬프트
 * @param options - 생성 옵션 (model, temperature, maxTokens)
 * @returns 생성된 텍스트
 *
 * @throws {Error} API 호출 실패 시
 *
 * @example
 * const result = await chat('경제 뉴스를 요약해줘');
 * console.log(result);
 *
 * @example
 * // 옵션 사용
 * const result = await chat('뉴스 분석', {
 *   model: 'gemini-3-flash-preview',
 *   temperature: 0.3,
 *   maxTokens: 1000
 * });
 */
export const chat = async (prompt: string, options?: GeminiChatOptions): Promise<string> => {
  try {
    const response = await gemini.models.generateContent({
      model: options?.model || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        tools: [groundingTool],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned empty response');
    }

    return text;
  } catch (error) {
    const errorMessage = `Gemini API 호출 실패: ${(error as Error).message}`;
    console.error(`[Gemini] ${errorMessage}`);
    throw new Error(errorMessage);
  }
};

/**
 * Gemini API로 JSON 형식 응답 받기
 *
 * @param message - 입력 메시지 (JSON 응답 요청 포함 권장)
 * @param options - 생성 옵션
 * @returns 파싱된 JSON 객체
 *
 * @throws {Error} API 호출 실패 또는 JSON 파싱 실패 시
 *
 * @example
 * interface NewsSelection {
 *   selectedIndices: number[];
 *   reason: string;
 * }
 *
 * const result = await chatJSON<NewsSelection>(
 *   '다음 뉴스 중 중요한 것을 선택하고 JSON으로 응답해줘'
 * );
 * console.log(result.selectedIndices);
 */
export const chatJSON = async <T = unknown>(prompt: string, options?: GeminiChatOptions): Promise<T> => {
  try {
    const response = await gemini.models.generateContent({
      model: options?.model || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(responseSchema),
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error('Gemini API returned empty response');
    }

    return responseSchema.parse(JSON.parse(text)) as T;
  } catch (error) {
    const errorMessage = `Gemini API JSON 호출 실패: ${(error as Error).message}`;
    console.error(`[Gemini] ${errorMessage}`);
    throw new Error(errorMessage);
  }
};
