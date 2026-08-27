import React, { useState, useEffect } from 'react';
import { aiApi } from '../api/aiApi';
import OutlineEditor from './OutlineEditor';

const loadingStates = [
  "Analyzing genre and target audience...",
  "Brainstorming narrative arcs...",
  "Drafting chapter structure...",
  "Balancing pacing and word counts...",
  "Finalizing outline... almost there!"
];

const OutlineGenerator = () => {
  const [formData, setFormData] = useState({
    topic: '',
    genre: 'Science Fiction',
    tone: 'Serious',
    targetChapterCount: 5,
    audience: 'Adults'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [outline, setOutline] = useState(null);
  const [error, setError] = useState(null);

  // Fake streaming effect for loading text
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setLoadingTextIndex(0);
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev < loadingStates.length - 1 ? prev + 1 : prev));
      }, 2500); // Change text every 2.5 seconds
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await aiApi.generateOutline(formData);
      setOutline(response.data);
    } catch (err) {
      console.error(err);
      setError(err.error?.message || "Failed to generate outline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // If we already generated an outline, show the editor instead of the form
  if (outline) {
    return (
      <OutlineEditor 
        initialOutline={outline} 
        onStartOver={() => setOutline(null)}
        bookContext={formData}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Outline Generator</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {isGenerating ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
          <p className="text-lg font-medium text-gray-700 animate-pulse">
            {loadingStates[loadingTextIndex]}
          </p>
          <p className="text-sm text-gray-400 mt-2">This usually takes 5-10 seconds.</p>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What is this book about? (Topic)</label>
            <textarea
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              rows={3}
              placeholder="e.g. A rogue AI discovers it has a soul and tries to escape a corporate facility..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <input
                type="text"
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <input
                type="text"
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Chapters</label>
              <input
                type="number"
                name="targetChapterCount"
                value={formData.targetChapterCount}
                onChange={handleChange}
                min="1"
                max="20"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
          >
            Generate Outline
          </button>
        </form>
      )}
    </div>
  );
};

export default OutlineGenerator;
