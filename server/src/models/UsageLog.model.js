const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['generate_chapter', 'consistency_check', 'generate_outline'],
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

const UsageLog = mongoose.model('UsageLog', usageLogSchema);
module.exports = UsageLog;
