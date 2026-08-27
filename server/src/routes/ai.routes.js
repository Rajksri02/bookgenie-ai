const express = require('express');
const { generateOutline, regenerateChapter } = require('../controllers/ai.controller');
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

// Temporarily bypassing requireAuth for Phase 5 Testing
router.use(aiRateLimiter);

router.post('/outline', validateRequest(outlineSchema), generateOutline);
router.post('/outline/regenerate-chapter', validateRequest(regenerateSchema), regenerateChapter);

module.exports = router;
