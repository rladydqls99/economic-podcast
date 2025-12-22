import { isNorm, Norm } from '@/types/primitives.js';
import { compareTwoStrings } from 'string-similarity';

export const calculateSimilarity = (text1: string, text2: string) => {
  const normalizedText1 = normalizeText(text1);
  const normalizedText2 = normalizeText(text2);

  const similarity = compareTwoStrings(normalizedText1, normalizedText2);
  if (!isNorm(similarity)) {
    throw new RangeError(`Similarity value ${similarity} is out of normalized range [0, 1]`);
  }

  return similarity;
};

export const normalizeText = (text: string) => {
  return text.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
};

export const isDuplicate = (text1: string, text2: string, threshold: Norm) => {
  const similarity = calculateSimilarity(text1, text2);
  return similarity >= threshold;
};
