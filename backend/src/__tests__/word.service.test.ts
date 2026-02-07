import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis service before importing word service
vi.mock('../services/redis.service', () => ({
  redisService: {
    listRange: vi.fn().mockResolvedValue([]),
    listPushAndTrim: vi.fn().mockResolvedValue(undefined),
    deleteKey: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the AnagramGroupModel
vi.mock('../models', () => {
  const mockSkip = vi.fn();
  const mockLean = vi.fn();
  const mockFindOne = vi.fn();

  // Chain: findOne().skip().lean()
  mockLean.mockResolvedValue({
    lang: 'en',
    difficulty: 'easy',
    signature: 'aet',
    words: ['eat', 'tea', 'eta'],
  });
  mockSkip.mockReturnValue({ lean: mockLean });
  mockFindOne.mockReturnValue({ skip: mockSkip });

  return {
    AnagramGroupModel: {
      countDocuments: vi.fn().mockResolvedValue(10),
      findOne: mockFindOne,
      aggregate: vi.fn().mockResolvedValue([
        { lang: 'en', difficulty: 'easy', signature: 'aet', words: ['eat', 'tea', 'eta'] },
      ]),
    },
  };
});

import { wordService } from '../services/word.service';
import { redisService } from '../services/redis.service';
import { AnagramGroupModel } from '../models';

describe('WordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Restore default mock return values
    vi.mocked(redisService.listRange).mockResolvedValue([]);
    vi.mocked(AnagramGroupModel.countDocuments).mockResolvedValue(10);
    vi.mocked(AnagramGroupModel.aggregate).mockResolvedValue([
      { lang: 'en', difficulty: 'easy', signature: 'aet', words: ['eat', 'tea', 'eta'] },
    ]);
  });

  describe('pickWordForUser (seeded path)', () => {
    it('returns scrambled word and answers', async () => {
      const result = await wordService.pickWordForUser('user1', 'en', 'easy', 'test-seed');

      expect(result).toHaveProperty('scrambled');
      expect(result).toHaveProperty('answers');
      expect(result.answers).toEqual(['eat', 'tea', 'eta']);
      expect(result.scrambled).toBeTruthy();
    });

    it('produces deterministic results with same seed', async () => {
      const result1 = await wordService.pickWordForUser('user1', 'en', 'easy', 'fixed-seed');
      const result2 = await wordService.pickWordForUser('user1', 'en', 'easy', 'fixed-seed');

      expect(result1.scrambled).toBe(result2.scrambled);
      expect(result1.answers).toEqual(result2.answers);
    });

    it('queries MongoDB with exclusion filter when Redis has recent signatures', async () => {
      vi.mocked(redisService.listRange).mockResolvedValue(['abc', 'def']);

      await wordService.pickWordForUser('user1', 'en', 'easy', 'test-seed');

      expect(AnagramGroupModel.countDocuments).toHaveBeenCalledWith({
        lang: { $eq: 'en' },
        difficulty: { $eq: 'easy' },
        signature: { $nin: ['abc', 'def'] },
      });
    });

    it('pushes signature to Redis after picking', async () => {
      await wordService.pickWordForUser('user1', 'en', 'easy', 'test-seed');

      expect(redisService.listPushAndTrim).toHaveBeenCalledWith(
        'user:user1:en:easy:recent',
        'aet',
        100
      );
    });

    it('falls back without exclusion when all signatures exhausted', async () => {
      vi.mocked(AnagramGroupModel.countDocuments)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5);

      const result = await wordService.pickWordForUser('user1', 'en', 'easy', 'test-seed');

      expect(result.answers).toEqual(['eat', 'tea', 'eta']);
      expect(AnagramGroupModel.countDocuments).toHaveBeenCalledTimes(2);
    });

    it('throws when no anagram groups exist at all', async () => {
      vi.mocked(AnagramGroupModel.countDocuments)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await expect(
        wordService.pickWordForUser('user1', 'en', 'easy', 'test-seed')
      ).rejects.toThrow('No anagram groups found');
    });

    it('continues working if Redis is unavailable for reads', async () => {
      vi.mocked(redisService.listRange).mockRejectedValue(new Error('Redis down'));

      const result = await wordService.pickWordForUser('user1', 'en', 'easy', 'test-seed');

      expect(result).toHaveProperty('scrambled');
      expect(result).toHaveProperty('answers');
    });

    it('continues working if Redis is unavailable for writes', async () => {
      vi.mocked(redisService.listPushAndTrim).mockRejectedValue(new Error('Redis down'));

      const result = await wordService.pickWordForUser('user1', 'en', 'easy', 'test-seed');

      expect(result).toHaveProperty('scrambled');
    });
  });

  describe('pickWordForUser (random path)', () => {
    it('uses $sample aggregation when no seed provided', async () => {
      const result = await wordService.pickWordForUser('user1', 'en', 'easy');

      expect(AnagramGroupModel.aggregate).toHaveBeenCalled();
      expect(result).toHaveProperty('scrambled');
      expect(result.answers).toEqual(['eat', 'tea', 'eta']);
    });
  });

  describe('resetUser', () => {
    it('deletes the Redis key for the user', async () => {
      await wordService.resetUser('user1', 'en', 'easy');

      expect(redisService.deleteKey).toHaveBeenCalledWith('user:user1:en:easy:recent');
    });

    it('uses correct key format for different lang/difficulty', async () => {
      await wordService.resetUser('user42', 'en', 'hard');

      expect(redisService.deleteKey).toHaveBeenCalledWith('user:user42:en:hard:recent');
    });
  });
});
