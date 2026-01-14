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

/**
 * Gemini API 호출 옵션
 */
export interface GeminiChatOptions<T = unknown> {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseMimeType?: string;
  responseJsonSchema?: z.ZodType<T>;
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
export const chatJSON = async <T = unknown>(prompt: string, options?: GeminiChatOptions<T>): Promise<T> => {
  try {
    const response = await gemini.models.generateContent({
      model: options?.model || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        responseMimeType: options?.responseMimeType || 'application/json',
        responseJsonSchema: options?.responseJsonSchema ? zodToJsonSchema(options.responseJsonSchema) : undefined,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error('Gemini API returned empty response');
    }

    if (!options?.responseJsonSchema) {
      return JSON.parse(text) as T;
    }

    return options.responseJsonSchema.parse(JSON.parse(text)) as T;
  } catch (error) {
    const errorMessage = `Gemini API JSON 호출 실패: ${(error as Error).message}`;
    console.error(`[Gemini] ${errorMessage}`);
    throw new Error(errorMessage);
  }
};
