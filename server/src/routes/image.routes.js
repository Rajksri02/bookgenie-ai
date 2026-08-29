const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage, generateAiCover } = require('../controllers/image.controller');

// Use temp storage since we will upload to cloudinary and delete
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), uploadImage);
router.post('/generate', generateAiCover);

module.exports = router;
