const mongoose = require('mongoose');

const exportJobSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    format: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    fileUrl: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExportJob', exportJobSchema);
