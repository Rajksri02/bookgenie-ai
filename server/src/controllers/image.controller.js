const cloudinary = require('cloudinary').v2;
const { generateCoverImage } = require('../services/geminiService');
const catchAsync = require('../utils/catchAsync');
const fs = require('fs');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image provided' });
  }

  try {
    // Upload image to Cloudinary from the temp local file multer created
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'bookgenie',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic', 'heif'],
    });

    // Delete the temporary file from local storage
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      url: result.secure_url
    });
  } catch (error) {
    // Attempt to clean up temp file if upload fails
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

const generateAiCover = catchAsync(async (req, res, next) => {
  const { title, subtitle, description, genre, tone } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Book title is required for AI generation.' });
  }

  // 1. Generate base64 image from Gemini
  const base64Data = await generateCoverImage({ 
    title, 
    subtitle, 
    description, 
    genre: genre || 'General', 
    tone: tone || 'Professional' 
  });

  // 2. Upload base64 directly to Cloudinary
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: 'bookgenie',
  });

  res.status(200).json({
    success: true,
    url: result.secure_url
  });
});

module.exports = {
  uploadImage,
  generateAiCover
};
