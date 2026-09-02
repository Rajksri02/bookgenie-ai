const catchAsync = require('../utils/catchAsync');
const Book = require('../models/Book.model');
const Chapter = require('../models/Chapter.model');
const UsageLog = require('../models/UsageLog.model');
const geminiService = require('../services/geminiService');

const runConsistencyCheck = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;

  const book = await Book.findOne({ _id: bookId, user: req.user._id });
  if (!book) {
    return res.status(404).json({ success: false, error: 'Book not found' });
  }

  const chapters = await Chapter.find({ book: bookId }).sort({ order: 1 });
  
  if (!chapters || chapters.length === 0) {
    return res.status(400).json({ success: false, error: 'Book has no chapters to analyze.' });
  }

  // Filter only chapters with actual content
  const chaptersWithContent = chapters.filter(ch => ch.content && ch.content.trim().length > 0);
  
  if (chaptersWithContent.length === 0) {
    return res.status(400).json({ success: false, error: 'None of the chapters have content to analyze.' });
  }

  const analysisReport = await geminiService.analyzeStyleConsistency(book, chaptersWithContent);

  await UsageLog.create({
    user: req.user._id,
    action: 'consistency_check',
    tokensUsed: 3000
  });

  res.status(200).json({
    success: true,
    data: analysisReport
  });
});

module.exports = {
  runConsistencyCheck
};
