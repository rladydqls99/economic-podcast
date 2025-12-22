import { jest } from '@jest/globals';

// Mock dotenv to prevent errors during test runs
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));
