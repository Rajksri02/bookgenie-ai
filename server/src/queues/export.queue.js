const { Queue, Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const exportService = require('../services/export.service');
const Book = require('../models/Book.model');
const Chapter = require('../models/Chapter.model');
const ExportJob = require('../models/ExportJob.model');

// Create the Queue
const exportQueue = new Queue('exportQueue', { connection: redisConnection });

// Create the Worker
const exportWorker = new Worker('exportQueue', async (job) => {
  const { bookId, format, exportJobId } = job.data;
  console.log(`[Export Queue] Processing job ${job.id} for book ${bookId} format ${format}`);

  try {
    const book = await Book.findById(bookId).lean();
    if (!book) {
      throw new Error(`Book ${bookId} not found`);
    }

    const chapters = await Chapter.find({ book: bookId }).sort({ order: 1 }).lean();

    if (format === 'pdf') {
      await exportService.generatePDF(book, chapters, exportJobId);
    } else if (format === 'docx') {
      await exportService.generateDOCX(book, chapters, exportJobId);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    console.log(`[Export Queue] Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`[Export Queue] Job ${job.id} failed:`, error);
    // Optionally update export job status to failed here if the service didn't catch it
    await ExportJob.findByIdAndUpdate(exportJobId, { status: 'failed', error: error.message });
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2 // Limit concurrent Puppeteer/DOCX generation to 2 to prevent memory overload
});

exportWorker.on('failed', (job, err) => {
  console.error(`[Export Worker] Job ${job?.id} has failed with ${err.message}`);
});

module.exports = {
  exportQueue,
  exportWorker
};
