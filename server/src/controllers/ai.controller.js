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
/**
 * @route   POST /api/ai/chapter/:chapterId/generate
 * @access  Private
 * Streams the generated chapter content back to the client.
 */
const generateChapterContent = catchAsync(async (req, res) => {
  const {
    mode,
    bookTitle,
    chapterTitle,
    chapterSummary,
    prevChapterExcerpt,
    nextChapterTitle,
    targetWords,
    tone,
    selectedText
  } = req.body;

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Flush headers immediately
  res.flushHeaders();

  try {
    const stream = await geminiService.generateChapterStream({
      mode,
      bookTitle,
      chapterTitle,
      chapterSummary,
      prevChapterExcerpt,
      nextChapterTitle,
      targetWords: parseInt(targetWords, 10) || 1000,
      tone,
      selectedText
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        // SSE format: data: JSON_STRING\n\n
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    
    // Signal completion
    res.write(`data: [DONE]\n\n`);
  } catch (error) {
    console.error('Error during generation stream:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate content' })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = {
  generateOutline,
  regenerateChapter,
  generateChapterContent,
};
