const mongoose = require('mongoose');

const chapterVersionSchema = new mongoose.Schema(
  {
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChapterVersion = mongoose.model('ChapterVersion', chapterVersionSchema);
module.exports = ChapterVersion;
