import React, { useState, useEffect } from 'react';
import { aiApi } from '../api/aiApi';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    let interval;
    if (isGenerating) {
      setLoadingTextIndex(0);
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev < loadingStates.length - 1 ? prev + 1 : prev));
      }, 2500); 
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
      toast.success('Outline generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.error?.message || "Failed to generate outline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-8"
    >
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">AI Outline Generator</h2>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center justify-center text-center"
          >
            <Loader2 className="animate-spin h-12 w-12 text-primary-600 dark:text-primary-400 mb-6" />
            <motion.p 
              key={loadingTextIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-medium text-slate-700 dark:text-slate-300"
            >
              {loadingStates[loadingTextIndex]}
            </motion.p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">This usually takes 5-10 seconds.</p>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleGenerate} 
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">What is this book about? (Topic)</label>
              <textarea
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                required
                rows={3}
                placeholder="e.g. A rogue AI discovers it has a soul and tries to escape a corporate facility..."
                className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Genre</label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tone</label>
                <input
                  type="text"
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                <input
                  type="text"
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Chapters</label>
                <input
                  type="number"
                  name="targetChapterCount"
                  value={formData.targetChapterCount}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  required
                  className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
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
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OutlineGenerator;
