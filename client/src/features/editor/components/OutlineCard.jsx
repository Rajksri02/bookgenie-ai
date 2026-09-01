import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, RefreshCw, Edit2, Check, PenLine } from 'lucide-react';
import { aiApi } from '../api/aiApi';
import toast from 'react-hot-toast';

const OutlineCard = ({ id, chapter, index, onUpdate, onDelete, onWrite, bookContext }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editData, setEditData] = useState({ ...chapter });
  const [feedback, setFeedback] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveEdit = () => {
    onUpdate(index, editData);
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const response = await aiApi.regenerateChapter({
        ...bookContext,
        previousChapterTitle: chapter.title,
        feedback: feedback || undefined,
      });
      onUpdate(index, response.data);
      setFeedback('');
    } catch (err) {
      toast.error('Failed to regenerate chapter. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'reviewed':
        return <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">Reviewed</span>;
      case 'ai-generated':
        return <span className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">AI-Generated</span>;
      case 'draft':
      default:
        return <span className="text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">Draft</span>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm ${
        isDragging ? 'border-primary-500 shadow-lg opacity-80' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start p-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 mr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded flex-shrink-0 touch-none"
          tabIndex={0}
          role="button"
          aria-label={`Drag ${chapter?.title || 'chapter'}`}
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full font-bold text-lg px-3 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              />
              <textarea
                value={editData.summary || ''}
                onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                className="w-full text-slate-700 dark:text-slate-300 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Word Count:</span>
                <input
                  type="number"
                  value={editData.estimatedWords || 0}
                  onChange={(e) => setEditData({ ...editData, estimatedWords: parseInt(e.target.value, 10) || 0 })}
                  className="w-24 px-3 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none text-sm transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 text-sm bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Check size={16} /> Save
                </button>
                <button
                  onClick={() => {
                    setEditData({ ...chapter });
                    setIsEditing(false);
                  }}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 dark:text-slate-500 mr-1">{index + 1}.</span>
                  {chapter.title}
                  {getStatusBadge(chapter.status)}
                </h3>
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 shrink-0">
                  <button onClick={() => setIsEditing(true)} className="hover:text-primary-600 dark:hover:text-primary-400 p-1 rounded transition-colors" title="Edit Manually">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(index)} className="hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors" title="Delete Chapter">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-3 text-sm leading-relaxed">{chapter.summary}</p>
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-3 gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit">
                  ~{chapter.estimatedWords} words
                </span>
                
                <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                  <input 
                    type="text" 
                    placeholder="Feedback for AI (optional)" 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="text-xs px-3 py-2 bg-transparent dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl w-full sm:w-48 focus:outline-none focus:border-primary-400 transition-colors"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className={`flex-1 sm:flex-none justify-center flex items-center gap-1 text-xs px-3 py-2 rounded-xl text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800 ${isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
                      {isRegenerating ? 'Generating...' : 'Regenerate'}
                    </button>
                    <button
                      onClick={onWrite}
                      className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
                    >
                      <PenLine size={14} />
                      Write Chapter
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutlineCard;
