const express = require('express');
const router = express.Router();
const { createBook, updateBook, autosaveChapter, getBooks, reorderChapters, deleteBook, exportBook, getExportJobStatus, duplicateBook, reorderBooks } = require('../controllers/book.controller');
const requireAuth = require('../middlewares/requireAuth');

router.get('/', requireAuth, getBooks);
router.post('/', requireAuth, createBook);
router.put('/reorder', requireAuth, reorderBooks);
router.put('/:bookId', requireAuth, updateBook);
router.delete('/:bookId', requireAuth, deleteBook);
router.post('/:bookId/duplicate', requireAuth, duplicateBook);

// Export book
router.post('/:bookId/export', requireAuth, exportBook);
router.get('/export-job/:jobId', requireAuth, getExportJobStatus);

// Autosave a chapter
router.post('/chapters/:chapterId/autosave', requireAuth, autosaveChapter);

// Reorder chapters in a book
router.put('/:bookId/chapters/reorder', requireAuth, reorderChapters);

module.exports = router;
