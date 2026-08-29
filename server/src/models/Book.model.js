const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a book title'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String, // Cloudinary URL
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    genre: {
      type: String,
      trim: true,
    },
    tone: {
      type: String,
      trim: true,
    },
    targetAudience: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
