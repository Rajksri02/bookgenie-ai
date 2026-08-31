const Book = require('../models/Book.model');
const Chapter = require('../models/Chapter.model');
const ExportJob = require('../models/ExportJob.model');
const catchAsync = require('../utils/catchAsync');
const exportService = require('../services/export.service');
const createBook = catchAsync(async (req, res) => {
  const { metadata, chapters } = req.body;

  if (!metadata || !metadata.title) {
    return res.status(400).json({ success: false, error: 'Book metadata with title is required' });
  }

  // 1. Create the book document
  const book = await Book.create({
    user: req.user._id,
    title: metadata.title,
    subtitle: metadata.subtitle,
    author: metadata.author,
    description: metadata.description,
    coverImage: metadata.coverImage,
    genre: metadata.genre,
    tone: metadata.tone,
    topic: metadata.topic
  });

  // 2. Create the chapters
  let savedChapters = [];
  if (chapters && chapters.length > 0) {
    const chaptersToInsert = chapters.map((ch, index) => ({
      book: book._id,
      order: ch.order !== undefined ? ch.order : index,
      title: ch.title,
      summary: ch.summary,
      content: ch.content || '',
      estimatedWords: ch.estimatedWords,
      status: ch.status || 'draft'
    }));
    savedChapters = await Chapter.insertMany(chaptersToInsert);
  }

  res.status(201).json({
    success: true,
    data: {
      book,
      chapters: savedChapters
    }
  });
});

const updateBook = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  const { metadata, chapters } = req.body;

  // 1. Update the book document
  const book = await Book.findOneAndUpdate(
    { _id: bookId, user: req.user._id },
    {
      title: metadata.title,
      subtitle: metadata.subtitle,
      author: metadata.author,
      description: metadata.description,
      coverImage: metadata.coverImage,
      genre: metadata.genre,
      tone: metadata.tone,
      topic: metadata.topic
    },
    { new: true }
  );

  if (!book) {
    return res.status(404).json({ success: false, error: 'Book not found' });
  }

  // 2. Update chapters
  // For simplicity, we assume chapters are just updated. We update by _id.
  if (chapters && chapters.length > 0) {
    const bulkOps = chapters.map((ch, index) => ({
      updateOne: {
        filter: { _id: ch._id, book: book._id },
        update: {
          $set: {
            title: ch.title,
            summary: ch.summary,
            content: ch.content || '',
            estimatedWords: ch.estimatedWords,
            order: ch.order !== undefined ? ch.order : index
          }
        }
      }
    }));
    await Chapter.bulkWrite(bulkOps);
  }

  res.status(200).json({
    success: true,
    data: { book }
  });
});

const autosaveChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required for autosave' });
    }

    if (chapterId === 'temp') {
      // Simulate success for temp chapters during testing
      await new Promise((resolve) => setTimeout(resolve, 300));
    } else {
      // Real database update
      await Chapter.findByIdAndUpdate(chapterId, {
        content,
        status: 'draft' // ensure status is draft or keep existing
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chapter autosaved successfully',
      data: {
        chapterId,
        contentPreview: content.substring(0, 50) + '...',
        savedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

const getBooks = catchAsync(async (req, res) => {
  const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  
  for (let i = 0; i < books.length; i++) {
    const chapters = await Chapter.find({ book: books[i]._id }).sort({ order: 1 }).lean();
    books[i].chapters = chapters;
  }

  res.status(200).json({
    success: true,
    data: books,
  });
});

const reorderChapters = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;
  const { chapterIds } = req.body;

  if (!chapterIds || !Array.isArray(chapterIds)) {
    return res.status(400).json({ success: false, error: 'chapterIds array is required' });
  }

  // Update order for each chapter
  const bulkOps = chapterIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, book: bookId },
      update: { $set: { order: index } }
    }
  }));

  if (bulkOps.length > 0) {
    await Chapter.bulkWrite(bulkOps);
  }

  res.status(200).json({
    success: true,
    message: 'Chapters reordered successfully'
  });
});



const deleteBook = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;
  
  const book = await Book.findOne({ _id: bookId, user: req.user._id });
  
  if (!book) {
    return res.status(404).json({ success: false, error: 'Book not found' });
  }

  // Cascade delete chapters
  await Chapter.deleteMany({ book: bookId });
  
  // Delete book
  await book.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

const exportBook = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;
  const { format } = req.body;

  if (!['pdf', 'docx'].includes(format)) {
    return res.status(400).json({ success: false, error: 'Invalid export format' });
  }

  const book = await Book.findOne({ _id: bookId, user: req.user._id });
  if (!book) {
    return res.status(404).json({ success: false, error: 'Book not found' });
  }

  const chapters = await Chapter.find({ book: bookId }).sort({ order: 1 }).lean();

  const exportJob = await ExportJob.create({
    bookId,
    userId: req.user._id,
    format,
    status: 'pending'
  });

  // Run in background without awaiting
  if (format === 'pdf') {
    exportService.generatePDF(book, chapters, exportJob._id);
  } else if (format === 'docx') {
    exportService.generateDOCX(book, chapters, exportJob._id);
  }

  res.status(202).json({
    success: true,
    data: {
      jobId: exportJob._id,
      status: exportJob.status
    }
  });
});

const getExportJobStatus = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  
  const job = await ExportJob.findOne({ _id: jobId, userId: req.user._id });
  if (!job) {
    return res.status(404).json({ success: false, error: 'Export job not found' });
  }

  res.status(200).json({
    success: true,
    data: {
      jobId: job._id,
      status: job.status,
      fileUrl: job.fileUrl,
      error: job.error
    }
  });
});

module.exports = {
  createBook,
  updateBook,
  autosaveChapter,
  getBooks,
  reorderChapters,
  deleteBook,
  exportBook,
  getExportJobStatus
};
