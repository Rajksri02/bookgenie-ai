import apiClient, { getMemoryToken } from '../../../lib/apiClient';

export const aiApi = {
  generateOutline: async (params) => {
    return apiClient.post('/ai/outline', params);
  },
  
  regenerateChapter: async (params) => {
    return apiClient.post('/ai/outline/regenerate-chapter', params);
  },

  generateChapterContentStream: async (chapterId, params, onChunk, onComplete, onError) => {
    try {
      const token = getMemoryToken();
      const response = await fetch(`${apiClient.defaults.baseURL}/ai/chapter/${chapterId || 'temp'}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check for rate limit headers
      const remaining = response.headers.get('RateLimit-Remaining');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          // SSE format is data: JSON_STRING\n\n
          const parts = buffer.split('\n\n');
          buffer = parts.pop(); // Keep the last incomplete part in the buffer

          for (const part of parts) {
            const dataPrefix = 'data: ';
            let data = part.trim();
            
            if (data.startsWith(dataPrefix)) {
              data = data.slice(dataPrefix.length).trim();
              if (data === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  onChunk(parsed.text, remaining);
                }
              } catch (e) {
                console.warn('Failed to parse chunk:', data, e);
                // Ignore incomplete JSON chunks or parse errors
              }
            }
          }
        }
      }
      
      if (onComplete) onComplete(remaining);
      
    } catch (error) {
      if (onError) onError(error);
    }
  }
};
