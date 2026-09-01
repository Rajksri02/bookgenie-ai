import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import OutlineCard from './OutlineCard';
import ChapterGenerator from './ChapterGenerator';
import BookMetadataForm from './BookMetadataForm';
import { bookApi } from '../api/bookApi';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, RotateCcw, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OutlineEditor = ({ initialOutline, onStartOver, bookContext }) => {
  const bookId = initialOutline?._id || bookContext?._id || initialOutline?.book?._id || 'new';
  const DRAFT_KEY = `bookgenie_draft_${bookId}`;

  const getInitialState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key]) return parsed[key];
      }
    } catch (e) {
      console.error('Failed to parse draft from local storage', e);
    }
    return fallback;
  };

  const [chapters, setChapters] = useState(() => 
    getInitialState('chapters', initialOutline.chapters || [])
  );
  
  const [metadata, setMetadata] = useState(() => 
    getInitialState('metadata', {
      title: initialOutline.book?.title || initialOutline.title || '',
      subtitle: initialOutline.book?.subtitle || initialOutline.subtitle || '',
      author: initialOutline.book?.author || initialOutline.author || '',
      genre: initialOutline.book?.genre || initialOutline.genre || bookContext?.genre || '',
      description: initialOutline.book?.description || initialOutline.description || '',
      coverImage: initialOutline.book?.coverImage || initialOutline.coverImage || '',
      tone: bookContext?.tone || initialOutline.tone || 'Professional',
      topic: bookContext?.topic || initialOutline.topic || ''
    })
  );
  
  const [writingChapterIndex, setWritingChapterIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState(null);

  useEffect(() => {
    const chaptersInitial = getInitialState('chapters', initialOutline.chapters || []);
    setChapters(chaptersInitial);
    
    const metadataInitial = getInitialState('metadata', {
      title: initialOutline.book?.title || initialOutline.title || '',
      subtitle: initialOutline.book?.subtitle || initialOutline.subtitle || '',
      author: initialOutline.book?.author || initialOutline.author || '',
      genre: initialOutline.book?.genre || initialOutline.genre || bookContext?.genre || '',
      description: initialOutline.book?.description || initialOutline.description || '',
      coverImage: initialOutline.book?.coverImage || initialOutline.coverImage || '',
      tone: bookContext?.tone || initialOutline.tone || 'Professional',
      topic: bookContext?.topic || initialOutline.topic || ''
    });
    setMetadata(metadataInitial);
  }, [bookId]);

  useEffect(() => {
    let intervalId;
    if (exportJobId) {
      intervalId = setInterval(async () => {
        try {
          const res = await bookApi.getExportJobStatus(exportJobId);
          if (res.success) {
            const { status, fileUrl, error } = res.data;
            if (status === 'completed') {
              clearInterval(intervalId);
              setIsExporting(false);
              setExportJobId(null);
              const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5050';
              const fullUrl = `${backendUrl}${fileUrl}`;
              
              const a = document.createElement('a');
              a.href = fullUrl;
              a.download = ''; 
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);

              toast.success((t) => (
                <span className="flex items-center gap-2">
                  Export complete! 
                  <a href={fullUrl} target="_blank" rel="noreferrer" className="underline font-bold text-primary-400">Download manually if it didn't start</a>
                </span>
              ), { duration: 10000 });
            } else if (status === 'failed') {
              clearInterval(intervalId);
              setIsExporting(false);
              setExportJobId(null);
              toast.error(`Export failed: ${error}`);
            }
          }
        } catch (err) {
          console.error("Failed to check export status", err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [exportJobId]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ metadata, chapters }));
  }, [metadata, chapters]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex(c => c._id === active.id);
      const newIndex = chapters.findIndex(c => c._id === over.id);

      const oldChapters = [...chapters];
      const newChapters = arrayMove(chapters, oldIndex, newIndex);
      
      setChapters(newChapters);

      if (initialOutline.book?._id || bookContext?._id) {
        try {
          const bookId = initialOutline.book?._id || bookContext?._id;
          const chapterIds = newChapters.map(c => c._id);
          await bookApi.reorderChapters(bookId, chapterIds);
        } catch (error) {
          toast.error('Failed to save the new chapter order.');
          setChapters(oldChapters);
        }
      }
    }
  };

  const handleUpdateChapter = (index, updatedChapter) => {
    const newChapters = [...chapters];
    newChapters[index] = updatedChapter;
    setChapters(newChapters);
  };

  const handleDeleteChapter = (index) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Delete Chapter?</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Are you sure you want to delete this chapter?</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              const newChapters = [...chapters];
              newChapters.splice(index, 1);
              setChapters(newChapters);
            }}
            className="w-full border border-transparent rounded-none rounded-tr-xl p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleCommitToBook = async () => {
    if (!metadata.title) {
      toast.error("Book title is required.");
      return;
    }
    try {
      setIsSaving(true);
      const existingBookId = initialOutline._id || bookContext?._id;
      let res;
      
      if (existingBookId) {
        res = await bookApi.updateBook(existingBookId, metadata, chapters);
      } else {
        res = await bookApi.createBook(metadata, chapters);
      }

      if (res.success) {
        localStorage.removeItem(DRAFT_KEY);
        toast.success(existingBookId ? "Book successfully updated!" : "Book successfully saved to the database!");
        if (!existingBookId && res.data?.book?._id) {
          setTimeout(() => window.location.href = `/dashboard/edit/${res.data.book._id}`, 1000);
        }
      }
    } catch (error) {
      toast.error(error.error || 'Failed to save book to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format) => {
    const existingBookId = initialOutline._id || bookContext?._id;
    if (!existingBookId) {
      toast.error("Please save the book first before exporting.");
      return;
    }
    try {
      setIsExporting(true);
      const res = await bookApi.exportBook(existingBookId, format);
      if (res.success) {
        setExportJobId(res.data.jobId);
        toast.success(`Started generating ${format.toUpperCase()}...`);
      }
    } catch (error) {
      toast.error('Failed to start export.');
      setIsExporting(false);
    }
  };

  if (writingChapterIndex !== null) {
    const chapter = chapters[writingChapterIndex];
    const prevChapter = writingChapterIndex > 0 ? chapters[writingChapterIndex - 1] : null;
    const nextChapter = writingChapterIndex < chapters.length - 1 ? chapters[writingChapterIndex + 1] : null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-5xl mx-auto py-8 px-4 sm:px-6 min-h-screen flex flex-col"
      >
        <button 
          onClick={() => setWritingChapterIndex(null)}
          className="mb-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline self-start flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Outline
        </button>
        <div className="flex-1">
          <ChapterGenerator 
            chapter={chapter}
            bookContext={{ ...bookContext, title: metadata.title }}
            previousChapter={prevChapter}
            nextChapter={nextChapter}
            onUpdateContent={(content) => {
              const newChapters = [...chapters];
              newChapters[writingChapterIndex] = { ...newChapters[writingChapterIndex], content };
              setChapters(newChapters);
            }}
          />
        </div>
      </motion.div>
    );
  }

  const items = chapters.map((c, i) => c._id || `chapter-${i}-${c.title}`);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-8 px-4 sm:px-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Book Details</h1>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              localStorage.removeItem(DRAFT_KEY);
              onStartOver();
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Start Over</span>
          </button>
          
          {(initialOutline._id || bookContext?._id) && (
            <div className="relative group flex-1 sm:flex-none">
              <button 
                disabled={isExporting}
                className="w-full px-4 py-2.5 flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
              >
                <FileDown size={18} />
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium border-b border-slate-100 dark:border-slate-700">PDF Document</button>
                <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">Word (DOCX)</button>
              </div>
            </div>
          )}

          <button 
            onClick={handleCommitToBook}
            disabled={isSaving || isExporting}
            className="flex-1 sm:flex-none px-6 py-2.5 flex items-center justify-center gap-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : (initialOutline._id || bookContext?._id) ? 'Save Changes' : 'Create Book'}
          </button>
        </div>
      </div>

      <BookMetadataForm 
        metadata={metadata} 
        setMetadata={setMetadata} 
        initialBookContext={bookContext}
      />

      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Chapters ({chapters.length})</h2>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[200px] flex flex-col gap-3">
            {chapters.map((chapter, index) => (
              <OutlineCard
                key={items[index]}
                id={items[index]}
                index={index}
                chapter={chapter}
                onUpdate={handleUpdateChapter}
                onDelete={handleDeleteChapter}
                onWrite={() => setWritingChapterIndex(index)}
                bookContext={bookContext}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
        Total estimated words: {chapters.reduce((acc, curr) => acc + (curr.estimatedWords || 0), 0).toLocaleString()}
      </div>
    </motion.div>
  );
};

export default OutlineEditor;
