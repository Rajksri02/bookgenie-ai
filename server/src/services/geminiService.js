const { GoogleGenAI } = require('@google/genai');

/**
 * Initializes the Gemini API client.
 * We throw an error if the key is missing to fail fast on startup/invocation.
 */
const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }
  // The SDK automatically picks up process.env.GEMINI_API_KEY if no options are passed,
  // but explicitly passing it is better for readability and testing mockability.
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

/**
 * Wraps AI calls to abstract away the specific provider (Gemini).
 * If we switch to OpenAI or Anthropic later, we only change this file.
 * 
 * @param {string} prompt - The user prompt to send to the AI.
 * @returns {Promise<string>} - The generated text response.
 */
const generateText = async (prompt) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error('Failed to generate content from AI provider.');
  }
};

module.exports = {
  generateText,
};
