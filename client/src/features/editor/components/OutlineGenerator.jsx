import React, { useState, useEffect } from 'react';
import { aiApi } from '../api/aiApi';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const loadingStates = [
  "Analyzing genre and target audience...",
  "Brainstorming narrative arcs...",
  "Drafting chapter structure...",
  "Balancing pacing and word counts...",
  "Finalizing outline... almost there!"
];

const OutlineGenerator = ({ onGenerate }) => {
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
    
    try {
      const response = await aiApi.generateOutline(formData);
      
      const newBookData = {
        ...response.data.book,
        chapters: response.data.chapters
      };
      
      if (onGenerate) {
        onGenerate(newBookData);
      }
      setOutline(response.data);
      toast.success('Outline generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.error?.message || "Failed to generate outline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Outline generation is handled by the parent component navigating away on success.

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">AI Outline Generator</h2>

      {isGenerating ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mb-6" />
          <p className="text-lg font-medium text-slate-700 animate-pulse">
            {loadingStates[loadingTextIndex]}
          </p>
          <p className="text-sm text-slate-400 mt-2">This usually takes 5-10 seconds.</p>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">What is this book about? (Topic)</label>
            <textarea
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              rows={3}
              placeholder="e.g. A rogue AI discovers it has a soul and tries to escape a corporate facility..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
              <input
                type="text"
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <input
                type="text"
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Chapters</label>
              <input
                type="number"
                name="targetChapterCount"
                value={formData.targetChapterCount}
                onChange={handleChange}
                min="1"
                max="20"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-3 px-4 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm flex justify-center items-center gap-2"
          >
            <Sparkles size={18} />
            Generate Outline
          </button>
        </form>
      )}
    </div>
  );
};

export default OutlineGenerator;
