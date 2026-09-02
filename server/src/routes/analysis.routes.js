const express = require('express');
const router = express.Router();
const { runConsistencyCheck } = require('../controllers/analysis.controller');
const requireAuth = require('../middlewares/requireAuth');

router.post('/books/:bookId/consistency-check', requireAuth, runConsistencyCheck);

module.exports = router;
