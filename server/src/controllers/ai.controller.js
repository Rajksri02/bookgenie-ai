const catchAsync = require('../utils/catchAsync');
const geminiService = require('../services/geminiService');

/**
 * @route   POST /api/ai/outline
 * @access  Private
 */
const generateOutline = catchAsync(async (req, res) => {
  const { topic, genre, tone, targetChapterCount, audience } = req.body;

  // Wait for Gemini to return the structured JSON array
  const outline = await geminiService.generateOutline({
    topic,
    genre,
    tone,
    targetChapterCount: parseInt(targetChapterCount, 10) || 5,
    audience
  });

  res.status(200).json({
    success: true,
    data: outline,
  });
});

/**
 * @route   POST /api/ai/outline/regenerate-chapter
 * @access  Private
 */
const regenerateChapter = catchAsync(async (req, res) => {
  const { topic, genre, tone, previousChapterTitle, feedback } = req.body;

  const newChapter = await geminiService.regenerateSingleChapter({
    topic,
    genre,
    tone,
    previousChapterTitle,
    feedback
  });

  res.status(200).json({
    success: true,
    data: newChapter,
  });
});

module.exports = {
  generateOutline,
  regenerateChapter,
};
