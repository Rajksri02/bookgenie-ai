const express = require('express');
const router = express.Router();
const { 
  createBook, 
  updateBook, 
  autosaveChapter, 
  getBooks, 
  reorderChapters, 
  deleteBook, 
  exportBook, 
  getExportJobStatus, 
  duplicateBook, 
  reorderBooks,
  getChapterVersions,
  saveChapterVersion,
  restoreChapterVersion
} = require('../controllers/book.controller');
const requireAuth = require('../middlewares/requireAuth');
const { runConsistencyCheck } = require('../controllers/analysis.controller');

router.get('/', requireAuth, getBooks);
router.post('/', requireAuth, createBook);
router.put('/reorder', requireAuth, reorderBooks);
router.put('/:bookId', requireAuth, updateBook);
router.delete('/:bookId', requireAuth, deleteBook);
router.post('/:bookId/duplicate', requireAuth, duplicateBook);

// Export book
router.post('/:bookId/export', requireAuth, exportBook);
router.get('/export-job/:jobId', requireAuth, getExportJobStatus);

// Consistency Check
router.post('/:bookId/consistency-check', requireAuth, runConsistencyCheck);

// Autosave a chapter
router.post('/chapters/:chapterId/autosave', requireAuth, autosaveChapter);

// Reorder chapters in a book
router.put('/:bookId/chapters/reorder', requireAuth, reorderChapters);

// Chapter Versions
router.get('/chapters/:chapterId/versions', requireAuth, getChapterVersions);
router.post('/chapters/:chapterId/versions', requireAuth, saveChapterVersion);
router.post('/chapters/:chapterId/versions/:versionId/restore', requireAuth, restoreChapterVersion);

module.exports = router;
