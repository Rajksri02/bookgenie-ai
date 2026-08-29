require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
console.log(Object.keys(client));
console.log(typeof client.interactions);
if (client.interactions) {
  console.log(Object.keys(client.interactions));
}
