const express = require('express');
const { generateOutline, regenerateChapter, generateChapterContent } = require('../controllers/ai.controller');
const requireAuth = require('../middlewares/requireAuth');
const { aiRateLimiter } = require('../middlewares/rateLimiter');
const validateRequest = require('../middlewares/validateRequest');
const { z } = require('zod');

const router = express.Router();

const outlineSchema = z.object({
  body: z.object({
    topic: z.string().min(3, "Topic is too short"),
    genre: z.string().min(2, "Genre is required"),
    tone: z.string().min(2, "Tone is required"),
    targetChapterCount: z.number().min(1).max(20).optional().default(5),
    audience: z.string().optional(),
  })
});

const regenerateSchema = z.object({
  body: z.object({
    topic: z.string(),
    genre: z.string(),
    tone: z.string(),
    previousChapterTitle: z.string(),
    feedback: z.string().optional(),
  })
});

const generateChapterSchema = z.object({
  body: z.object({
    mode: z.enum(['full_draft', 'expand_text', 'rewrite_tone']).optional(),
    bookTitle: z.string().min(1),
    chapterTitle: z.string().min(1),
    chapterSummary: z.string().min(1),
    prevChapterExcerpt: z.string().optional(),
    nextChapterTitle: z.string().optional(),
    targetWords: z.number().min(100).max(5000).optional(),
    tone: z.string().min(1),
    selectedText: z.string().optional()
  })
});

// Temporarily bypassing requireAuth for Phase 5 Testing
router.use(aiRateLimiter);

router.post('/outline', validateRequest(outlineSchema), generateOutline);
router.post('/outline/regenerate-chapter', validateRequest(regenerateSchema), regenerateChapter);
router.post('/chapter/:chapterId/generate', validateRequest(generateChapterSchema), generateChapterContent);

module.exports = router;
