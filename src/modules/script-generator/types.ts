import z from 'zod';
import { NewsItem } from '@/modules/news-collector/types.js';

/**
 * Script Generator Type Definitions
 *
 * Contains all Zod schemas and TypeScript types for the script generator module.
 * Types are inferred from schemas for runtime validation.
 *
 * @module script-generator/types
 */

// =================================================================
// Configuration Types
// =================================================================

export type ScriptTone = 'URGENT' | 'INFORMATIVE' | 'CONVERSATIONAL' | (string & {});

/**
 * Script Generator Configuration
 *
 * Configuration options for the script generator.
 *
 * @property temperature - LLM temperature (0.0-1.0, default: 0.7). Controls creativity.
 * @property maxTokens - Maximum tokens to generate (default: 500).
 * @property timeout - API call timeout in milliseconds (default: 5000).
 */
export const ScriptGeneratorConfigSchema = z.object({
  temperature: z.number().min(0).max(1).optional().default(0.7),
  maxTokens: z.number().int().positive().optional().default(500),
  timeout: z.number().int().positive().optional().default(5000),
});

export type ScriptGeneratorConfig = z.infer<typeof ScriptGeneratorConfigSchema>;

// =================================================================
// Script Section Types
// =================================================================

/**
 * Script Sections (4-Stage Structure)
 *
 * 45-second viral shorts script structure:
 * - Hook (0-3s): Shocking fact to grab attention (10-30 chars)
 * - Problem (3-15s): Background explanation (50-100 chars)
 * - Impact (15-40s): Personal relevance to viewer (100-150 chars)
 * - Conclusion (40-45s): Call-to-action (20-50 chars)
 *
 * @property hook - Opening hook (0-3 seconds)
 * @property problem - Problem explanation (3-15 seconds)
 * @property impact - Personal impact (15-40 seconds)
 * @property conclusion - Conclusion with CTA (40-45 seconds)
 */
export const ScriptSectionsSchema = z.object({
  hook: z
    .string()
    .min(1, 'Hook cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Hook cannot be empty or whitespace only' }),
  problem: z
    .string()
    .min(1, 'Problem section cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Problem section cannot be empty or whitespace only' }),
  impact: z
    .string()
    .min(1, 'Impact section cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Impact section cannot be empty or whitespace only' }),
  conclusion: z
    .string()
    .min(1, 'Conclusion cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Conclusion cannot be empty or whitespace only' }),
});

export type ScriptSections = z.infer<typeof ScriptSectionsSchema>;

// =================================================================
// Metadata Types
// =================================================================

/**
 * Script Metadata
 *
 * Metadata about the generated script.
 *
 * @property estimatedDuration - Estimated duration in seconds (based on character count)
 * @property characterCount - Total character count of the script
 * @property newsCount - Number of news items used (3-5)
 * @property generatedAt - Timestamp when script was generated
 * @property processingTime - Time taken to generate script in milliseconds
 */
export const ScriptMetadataSchema = z.object({
  estimatedDuration: z.number().int().positive(),
  characterCount: z.number().int().nonnegative(),
  newsCount: z.number().int().min(3).max(5),
  generatedAt: z.date(),
  processingTime: z.number().int().nonnegative(),
});

export type ScriptMetadata = z.infer<typeof ScriptMetadataSchema>;

// =================================================================
// Validation Types
// =================================================================

/**
 * Validation Result
 *
 * Result of script validation checks.
 *
 * @property isValid - Whether the script passes all validation checks
 * @property errors - Critical errors that invalidate the script
 * @property warnings - Non-critical issues that don't invalidate the script
 * @property score - Quality score (0-100)
 */
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  score: z.number().int().min(0).max(100),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// =================================================================
// Script Result Types
// =================================================================

/**
 * Script Result
 *
 * Complete result of script generation including all sections, metadata, and validation.
 *
 * @property success - Whether the script generation was successful
 * @property script - Complete script text (all sections combined)
 * @property sections - Individual script sections (4-stage structure)
 * @property metadata - Script metadata (duration, character count, etc.)
 * @property validation - Validation result (isValid, errors, warnings, score)
 */
export const ScriptResultSchema = z.object({
  success: z.boolean(),
  script: z.string().min(1, 'Script cannot be empty'),
  sections: ScriptSectionsSchema,
  metadata: ScriptMetadataSchema,
  validation: ValidationResultSchema,
});

export type ScriptResult = z.infer<typeof ScriptResultSchema>;

// =================================================================
// Type Exports (for convenience)
// =================================================================

export type { NewsItem };
