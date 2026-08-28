const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a chapter title'],
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'generating', 'completed'],
      default: 'draft',
    },
    estimatedWords: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

const Chapter = mongoose.model('Chapter', chapterSchema);
module.exports = Chapter;
