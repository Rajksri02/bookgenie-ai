require('dotenv').config({ path: '.env' });
const { generateOutline } = require('./src/services/geminiService');

const run = async () => {
  try {
    const res = await generateOutline({ topic: "A love story", genre: "Romance", tone: "Sweet", targetChapterCount: 5, audience: "Adults" });
    console.log("SUCCESS:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
};
run();
