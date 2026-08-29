require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const prompt = "Test cover image generation";
    console.log("Calling Gemini API Lite...");
    const interaction = await client.interactions.create({
      model: "gemini-3.1-flash-lite-image",
      input: prompt,
      response_format: {
        type: "image",
        aspect_ratio: "1:1",
        image_size: "1K"
      }
    });
    console.log("Success! Got image data length:", interaction.output_image.data.length);
  } catch (error) {
    console.error("Error from Gemini API:", error);
  }
}

test();
