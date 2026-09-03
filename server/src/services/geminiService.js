const { GoogleGenAI } = require('@google/genai');

const getApiKeys = () => {
  const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  if (!keysString) {
    throw new Error('GEMINI_API_KEY or GEMINI_API_KEYS is missing from environment variables.');
  }
  return keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

const executeWithFallback = async (operationName, executeFn) => {
  const keys = getApiKeys();
  let lastError;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const client = new GoogleGenAI({ apiKey: key });
    
    try {
      return await executeFn(client);
    } catch (error) {
      lastError = error;
      const isRateLimit = error.status === 429 || 
                          (error.message && (error.message.includes('429') || error.message.includes('Quota')));
      
      if (isRateLimit) {
        console.warn(`[Gemini API] Key ${i+1}/${keys.length} hit rate limit during ${operationName}.`);
        if (i < keys.length - 1) {
          console.log(`[Gemini API] Falling back to key ${i+2}...`);
          continue;
        } else {
          console.error(`[Gemini API] All ${keys.length} keys exhausted.`);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  throw lastError;
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
  let attempt = 0;
  
  while (attempt <= retryCount) {
    try {
      const responseText = await executeWithFallback('executeWithRetry', async (client) => {
        const response = await client.interactions.create({
          model: "gemini-3.5-flash-lite",
          input: prompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: schema
          }
        });
        return response.output_text;
      });

      const strippedOutput = stripMarkdownFences(responseText);
      
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
- Chapter titles must be specific, catchy, and natural. Avoid overly formal or flowery language.
- Ensure the tone matches the audience and genre perfectly. If it's a simple story, keep the language accessible and engaging, not overly complex.
- Ensure logical progression between chapters (no repetition, coherent narrative arc).`;

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
  let prompt = '';

  if (mode === 'full_draft') {
    prompt = `You are ghostwriting a chapter for a non-fiction/fiction ebook (writing in ${tone} tone).

Book title: ${bookTitle}
Chapter title: ${chapterTitle}
Chapter summary/goal: ${chapterSummary}
Context from previous chapter ending: ${prevChapterExcerpt || 'None'}
Context for next chapter title: ${nextChapterTitle || 'None'}
Target length: ~${targetWords} words

Write the full chapter content in Markdown. Use headers (##) for sub-sections where natural, keep paragraphs readable (3-5 sentences), and end with a natural transition line into the next chapter. 

Important Style Rules:
- Keep the writing natural, engaging, and accessible.
- Avoid overly complex, flowery, or "advanced" vocabulary unless the tone explicitly demands it.
- Show, don't tell. Focus on genuine emotion and clear actions rather than over-explaining.
- Do not repeat the chapter title as the first line.`;
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

  const responseStream = await executeWithFallback('generateChapterStream', async (client) => {
    return await client.interactions.create({
      model: 'gemini-3.5-flash-lite',
      input: prompt,
      stream: true
    });
  });

  async function* yieldText() {
    for await (const event of responseStream) {
      if ((event.event_type === "step.delta" || event.type === "step.delta") && event.delta?.text) {
        yield { text: event.delta.text };
      }
    }
  }

  return yieldText();
};

const generateCoverImage = async ({ title, subtitle, description, genre, tone }) => {
  console.log(`Generating cover for: "${title}" using Gemini Text + Pollinations AI...`);
  
  // 1. Use free Gemini Text to generate a highly detailed visual prompt
  const textPrompt = `You are an expert book cover designer. I am writing a book.
Title: "${title}"
Subtitle: "${subtitle || 'None'}"
Genre: ${genre}
Tone: ${tone}
Description: ${description || 'None'}

Write a highly detailed, 2-sentence visual prompt describing the perfect book cover image for this book. 
Focus strictly on the visual elements (e.g., subjects, lighting, colors, aesthetic, background). 
If the book features historical, religious, or mythological figures (e.g., God, specific deities, historical leaders), ensure the visual prompt explicitly asks for culturally accurate representations and recognizable, authentic iconography rather than random or generic concepts.
Do NOT include the book title text in the prompt, just the art. Make it cinematic and beautiful.`;

  let visualPrompt = '';
  try {
    const responseText = await executeWithFallback('generateCoverImagePrompt', async (client) => {
      const response = await client.interactions.create({
        model: "gemini-3.5-flash-lite",
        input: textPrompt
      });
      return response.output_text;
    });
    visualPrompt = responseText.trim();
    console.log("Gemini generated visual prompt:", visualPrompt);
  } catch (error) {
    console.error("Failed to generate visual prompt with Gemini, falling back to basic prompt.", error);
    visualPrompt = `A cinematic, aesthetic book cover illustration for a book titled "${title}". Genre: ${genre}. Tone: ${tone}.`;
  }
  
  // 2. Pass the detailed prompt to Pollinations AI
  try {
    const visualEnhancements = "majestic, divine, beautiful, highly detailed, perfect composition, masterpiece, stunning digital art, symmetrical face, flawless anatomy";
    const encodedPrompt = encodeURIComponent(visualPrompt + ", " + visualEnhancements);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1200&nologo=true&model=flux&seed=${Math.floor(Math.random() * 100000)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pollinations API failed with status: ${response.status}`);
    }
    
    // Convert to base64 buffer for Cloudinary upload
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    // Cloudinary expects the data URI format
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Error generating cover image with free alternative:', error);
    throw error;
  }
};


const analyzeStyleConsistency = async (book, chapters) => {
  const prompt = `You are an expert editor and writing coach.
Analyze the following book chapters for writing style consistency, tone, and pacing.

Book Title: ${book.title}
Genre: ${book.genre}
Tone: ${book.tone}

Chapters content:
${chapters.map(c => `Chapter ${c.order} - ${c.title}:
${c.content.substring(0, 1000)}...`).join('\n\n')}

Analyze if the tone and style remain consistent across these excerpts. Provide a score out of 10, an overall assessment, and specific flags for any inconsistencies found. Return these flags as inconsistentChapters including the chapter title, the specific issue, and a suggestion for improvement.`;

  const schema = {
    type: "object",
    properties: {
      consistencyScore: { type: "integer", description: "Score from 1 to 10" },
      overallAssessment: { type: "string" },
      inconsistentChapters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            chapterTitle: { type: "string" },
            issue: { type: "string" },
            suggestion: { type: "string" }
          },
          required: ["chapterTitle", "issue", "suggestion"]
        }
      }
    },
    required: ["consistencyScore", "overallAssessment", "inconsistentChapters"]
  };

  return await executeWithRetry(prompt, schema);
};

module.exports = {
  analyzeStyleConsistency,
  generateOutline,
  regenerateSingleChapter,
  generateChapterStream,
  generateCoverImage
};
