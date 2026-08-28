const express = require('express');
const router = express.Router();
const { autosaveChapter, getBooks } = require('../controllers/book.controller');
const requireAuth = require('../middlewares/requireAuth');

router.get('/', requireAuth, getBooks);

// Autosave a chapter
router.post('/chapters/:chapterId/autosave', requireAuth, autosaveChapter);

module.exports = router;
