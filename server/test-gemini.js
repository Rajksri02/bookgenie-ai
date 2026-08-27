require('dotenv').config({ path: '.env' });
const { GoogleGenAI } = require('@google/genai');

const run = async () => {
  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "hello",
    });
    console.log(response.text);
  } catch (e) {
    console.error("ERROR:", e);
  }
};
run();
