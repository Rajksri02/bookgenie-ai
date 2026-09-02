const catchAsync = require('../utils/catchAsync');
const UsageLog = require('../models/UsageLog.model');

const getUsageStats = catchAsync(async (req, res, next) => {
  // Aggregate usage logs for the user over the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await UsageLog.find({
    user: req.user._id,
    createdAt: { $gte: thirtyDaysAgo }
  }).sort({ createdAt: 1 });

  // Group by date (YYYY-MM-DD)
  const groupedData = {};
  
  // Initialize last 30 days with 0 to ensure continuous chart
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    groupedData[dateStr] = { date: dateStr, generate_chapter: 0, consistency_check: 0, generate_outline: 0, totalTokens: 0 };
  }

  logs.forEach(log => {
    const dateStr = log.createdAt.toISOString().split('T')[0];
    if (groupedData[dateStr]) {
      groupedData[dateStr][log.action] = (groupedData[dateStr][log.action] || 0) + 1;
      groupedData[dateStr].totalTokens += log.tokensUsed;
    }
  });

  res.status(200).json({
    success: true,
    data: Object.values(groupedData)
  });
});

module.exports = {
  getUsageStats
};
