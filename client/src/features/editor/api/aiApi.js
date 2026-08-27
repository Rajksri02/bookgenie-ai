import apiClient from '../../../lib/apiClient';

export const aiApi = {
  generateOutline: async (params) => {
    return apiClient.post('/ai/outline', params);
  },
  
  regenerateChapter: async (params) => {
    return apiClient.post('/ai/outline/regenerate-chapter', params);
  },

  generateChapterContentStream: async (chapterId, params, onChunk, onComplete, onError) => {
    try {
      const token = localStorage.getItem('token');
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

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          // SSE format is data: JSON_STRING\n\n
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
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
                // Ignore incomplete JSON chunks or parse errors from split chunking
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
