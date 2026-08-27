const { GoogleGenAI } = require('@google/genai');

const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

// Strips markdown json blocks if the model hallucinates them despite structured output mode
const stripMarkdownFences = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(/^```json\s*/m, '').replace(/```\s*$/m, '').trim();
};

const outlineSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "The main title of the book." },
    subtitle: { type: "string", description: "A catchy subtitle for the book." },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          order: { type: "integer", description: "Chapter sequence number." },
          title: { type: "string", description: "Specific, non-generic chapter title." },
          summary: { type: "string", description: "A detailed 40-60 word summary of what happens in this chapter." },
          estimatedWords: { type: "integer", description: "Estimated word count for this chapter." }
        },
        required: ["order", "title", "summary", "estimatedWords"]
      }
    }
  },
  required: ["title", "subtitle", "chapters"]
};

const chapterSchema = {
  type: "object",
  properties: {
    order: { type: "integer" },
    title: { type: "string" },
    summary: { type: "string" },
    estimatedWords: { type: "integer" }
  },
  required: ["order", "title", "summary", "estimatedWords"]
};

/**
 * Executes an AI call with automatic retry on JSON parsing failures.
 */
const executeWithRetry = async (prompt, schema, retryCount = 1) => {
  const client = getAiClient();
  let attempt = 0;
  
  while (attempt <= retryCount) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const rawOutput = response.text;
      const strippedOutput = stripMarkdownFences(rawOutput);
      
      // Attempt to parse to verify it's valid JSON matching the schema conceptually
      return JSON.parse(strippedOutput);
    } catch (error) {
      console.warn(`AI Output Parsing Failed (Attempt ${attempt + 1}/${retryCount + 1}):`, error.message);
      attempt++;
      if (attempt > retryCount) {
        throw new Error('Failed to generate valid structured data from AI after retries.');
      }
    }
  }
};

/**
 * Generates a full book outline.
 */
const generateOutline = async ({ topic, genre, tone, targetChapterCount, audience }) => {
  const prompt = `You are an expert book editor and outline architect. Generate a complete ebook outline.

Book topic: ${topic}
Genre: ${genre}
Target audience: ${audience}
Tone: ${tone}
Number of chapters: ${targetChapterCount}

Rules:
- Return ONLY valid JSON, no markdown fences, no commentary.
- Chapter titles must be specific and non-generic (no "Introduction", "Conclusion" — make them reflect actual content).
- Ensure logical progression between chapters (no repetition, coherent narrative/argument arc).`;

  return await executeWithRetry(prompt, outlineSchema);
};

/**
 * Regenerates a single chapter based on feedback or a new prompt, while retaining context.
 */
const regenerateSingleChapter = async ({ topic, genre, tone, previousChapterTitle, feedback }) => {
  const prompt = `You are an expert ghostwriter. We are writing a book about "${topic}" (Genre: ${genre}, Tone: ${tone}).
    
The user wants to regenerate a specific chapter that was previously titled "${previousChapterTitle}".
User feedback for this new chapter: "${feedback || 'Make it more specific and detailed.'}"

Rules:
- Return ONLY valid JSON, no markdown fences, no commentary.
- Return a single chapter object matching the schema.`;

  return await executeWithRetry(prompt, chapterSchema);
};

/**
 * Generates chapter content (streaming).
 * Supports modes: 'full_draft', 'expand_text', 'rewrite_tone'
 */
const generateChapterStream = async ({
  mode = 'full_draft',
  bookTitle,
  chapterTitle,
  chapterSummary,
  prevChapterExcerpt = '',
  nextChapterTitle = '',
  targetWords = 1000,
  tone,
  selectedText = '' // used for expand_text and rewrite_tone
}) => {
  const client = getAiClient();
  let prompt = '';

  if (mode === 'full_draft') {
    prompt = `You are ghostwriting a chapter for a non-fiction/fiction ebook (writing in ${tone} tone).

Book title: ${bookTitle}
Chapter title: ${chapterTitle}
Chapter summary/goal: ${chapterSummary}
Context from previous chapter ending: ${prevChapterExcerpt || 'None'}
Context for next chapter title: ${nextChapterTitle || 'None'}
Target length: ~${targetWords} words

Write the full chapter content in Markdown. Use headers (##) for sub-sections where natural, keep paragraphs readable (3-5 sentences), and end with a natural transition line into the next chapter. Do not repeat the chapter title as the first line — the app displays it separately.`;
  } else if (mode === 'expand_text') {
    prompt = `You are editing a chapter for the ebook "${bookTitle}" (Tone: ${tone}).
Chapter: ${chapterTitle}
Summary: ${chapterSummary}

The user wants to expand the following specific text to be more detailed and comprehensive, aiming to add about ${targetWords} words to it.
Ensure the expanded text flows naturally.

TEXT TO EXPAND:
"""
${selectedText}
"""

Return ONLY the expanded text in Markdown, without repeating the original text unless necessary for flow.`;
  } else if (mode === 'rewrite_tone') {
    prompt = `You are editing a chapter for the ebook "${bookTitle}".
The user wants to rewrite the following text in a strictly **${tone}** tone. 

TEXT TO REWRITE:
"""
${selectedText}
"""

Return ONLY the rewritten text in Markdown. Keep the length roughly similar.`;
  } else {
    throw new Error('Invalid generation mode');
  }

  const responseStream = await client.models.generateContentStream({
    model: 'gemini-3.6-flash',
    contents: prompt
  });

  return responseStream;
};

module.exports = {
  generateOutline,
  regenerateSingleChapter,
  generateChapterStream
};
