import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import OutlineCard from './OutlineCard';
import ChapterGenerator from './ChapterGenerator';

const OutlineEditor = ({ initialOutline, onStartOver, bookContext }) => {
  const [chapters, setChapters] = useState(initialOutline.chapters || []);
  const [bookTitle, setBookTitle] = useState(initialOutline.title || '');
  const [bookSubtitle, setBookSubtitle] = useState(initialOutline.subtitle || '');
  const [writingChapterIndex, setWritingChapterIndex] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return; // Dropped outside the list

    const newChapters = Array.from(chapters);
    const [reorderedItem] = newChapters.splice(result.source.index, 1);
    newChapters.splice(result.destination.index, 0, reorderedItem);

    setChapters(newChapters);
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

  const handleCommitToBook = () => {
    // In Phase 4, this will call the backend to create a Book and its Chapters
    console.log("Committing to database:", { bookContext, bookTitle, bookSubtitle, chapters });
    alert("This will be wired up to the database in the next phase! Check console for data payload.");
  };

  if (writingChapterIndex !== null) {
    const chapter = chapters[writingChapterIndex];
    const prevChapter = writingChapterIndex > 0 ? chapters[writingChapterIndex - 1] : null;
    const nextChapter = writingChapterIndex < chapters.length - 1 ? chapters[writingChapterIndex + 1] : null;
    
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 h-screen flex flex-col">
        <button 
          onClick={() => setWritingChapterIndex(null)}
          className="mb-4 text-blue-600 hover:underline self-start flex items-center gap-1 font-medium"
        >
          &larr; Back to Outline
        </button>
        <div className="flex-1">
          <ChapterGenerator 
            chapter={chapter}
            bookContext={{ ...bookContext, title: bookTitle }}
            previousChapter={prevChapter}
            nextChapter={nextChapter}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1 mr-8">
          <input 
            type="text" 
            value={bookTitle} 
            onChange={e => setBookTitle(e.target.value)}
            className="text-3xl font-bold text-gray-900 w-full border-none outline-none focus:ring-0 bg-transparent mb-1"
            placeholder="Book Title"
          />
          <input 
            type="text" 
            value={bookSubtitle} 
            onChange={e => setBookSubtitle(e.target.value)}
            className="text-xl text-gray-600 w-full border-none outline-none focus:ring-0 bg-transparent"
            placeholder="Book Subtitle"
          />
        </div>
        <div className="flex gap-3 mt-1">
          <button 
            onClick={onStartOver}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Start Over
          </button>
          <button 
            onClick={handleCommitToBook}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm"
          >
            Create Book
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="outline-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="min-h-[200px]"
            >
              {chapters.map((chapter, index) => (
                <OutlineCard
                  key={index.toString() + (chapter.title || '')} // In a real app, use a unique ID
                  index={index}
                  chapter={chapter}
                  onUpdate={handleUpdateChapter}
                  onDelete={handleDeleteChapter}
                  onWrite={() => setWritingChapterIndex(index)}
                  bookContext={bookContext}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <div className="mt-8 text-center text-sm text-gray-400">
        Total estimated words: {chapters.reduce((acc, curr) => acc + (curr.estimatedWords || 0), 0).toLocaleString()}
      </div>
    </div>
  );
};

export default OutlineEditor;
