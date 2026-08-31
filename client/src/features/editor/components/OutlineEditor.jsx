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

  // Re-initialize if the underlying book changes (e.g. creating a new book after an old one)
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

  // Poll for export job status
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
              
              // Automatically trigger the download
              const a = document.createElement('a');
              a.href = fullUrl;
              a.download = ''; // Browser will use filename from URL or headers
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);

              toast.success((t) => (
                <span className="flex items-center gap-2">
                  Export complete! 
                  <a href={fullUrl} target="_blank" rel="noreferrer" className="underline font-bold text-primary-300">Download manually if it didn't start</a>
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
      }, 3000); // poll every 3 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [exportJobId]);

  // Autosave to localStorage
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
      
      // Optimistic UI update
      setChapters(newChapters);

      // Persist to backend if we have a book context
      if (initialOutline.book?._id || bookContext?._id) {
        try {
          const bookId = initialOutline.book?._id || bookContext?._id;
          const chapterIds = newChapters.map(c => c._id);
          await bookApi.reorderChapters(bookId, chapterIds);
        } catch (error) {
          console.error('Failed to save reordered chapters:', error);
          toast.error('Failed to save the new chapter order.');
          // Rollback
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
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      const newChapters = [...chapters];
      newChapters.splice(index, 1);
      setChapters(newChapters);
    }
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
        // Clear draft
        localStorage.removeItem(DRAFT_KEY);
        toast.success(existingBookId ? "Book successfully updated!" : "Book successfully saved to the database!");
        if (!existingBookId && res.data?.book?._id) {
          setTimeout(() => window.location.href = `/dashboard/edit/${res.data.book._id}`, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to save book:', error);
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
      console.error('Export error:', error);
      toast.error('Failed to start export.');
      setIsExporting(false);
    }
  };

  if (writingChapterIndex !== null) {
    const chapter = chapters[writingChapterIndex];
    const prevChapter = writingChapterIndex > 0 ? chapters[writingChapterIndex - 1] : null;
    const nextChapter = writingChapterIndex < chapters.length - 1 ? chapters[writingChapterIndex + 1] : null;
    
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 h-screen flex flex-col">
        <button 
          onClick={() => setWritingChapterIndex(null)}
          className="mb-4 text-primary-600 hover:text-primary-700 hover:underline self-start flex items-center gap-1 font-medium transition-colors"
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
      </div>
    );
  }

  // Ensure each chapter has an id for SortableContext.
  // The backend gives us _id, but if it doesn't exist, fallback to index+title (not ideal for strict sorting but works for local)
  const items = chapters.map((c, i) => c._id || `chapter-${i}-${c.title}`);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Book Details</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              localStorage.removeItem(DRAFT_KEY);
              onStartOver();
            }}
            className="px-4 py-2 flex items-center gap-2 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RotateCcw size={16} />
            Start Over
          </button>
          <button 
            onClick={handleCommitToBook}
            disabled={isSaving || isExporting}
            className="px-6 py-2 flex items-center gap-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : (initialOutline._id || bookContext?._id) ? 'Save Changes' : 'Create Book'}
          </button>
          {(initialOutline._id || bookContext?._id) && (
            <div className="relative group">
              <button 
                disabled={isExporting}
                className="px-4 py-2 flex items-center gap-2 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-50"
              >
                <FileDown size={18} />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium border-b border-slate-100">PDF Document</button>
                <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium">Word (DOCX)</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BookMetadataForm 
        metadata={metadata} 
        setMetadata={setMetadata} 
        initialBookContext={bookContext}
      />

      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chapters ({chapters.length})</h2>
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
          <div className="min-h-[200px]">
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
      
      <div className="mt-8 text-center text-sm text-slate-400">
        Total estimated words: {chapters.reduce((acc, curr) => acc + (curr.estimatedWords || 0), 0).toLocaleString()}
      </div>
    </div>
  );
};

export default OutlineEditor;
