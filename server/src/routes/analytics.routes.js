const express = require('express');
const router = express.Router();
const { getUsageStats } = require('../controllers/analytics.controller');
const requireAuth = require('../middlewares/requireAuth');

router.get('/usage', requireAuth, getUsageStats);

module.exports = router;
