import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, RefreshCw, Edit2, Check } from 'lucide-react';
import { aiApi } from '../api/aiApi';

const OutlineCard = ({ chapter, index, onUpdate, onDelete, bookContext }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editData, setEditData] = useState({ ...chapter });
  const [feedback, setFeedback] = useState('');

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
      console.error('Failed to regenerate chapter:', err);
      alert('Failed to regenerate chapter. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Draggable draggableId={`chapter-${index}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-4 bg-white rounded-lg border shadow-sm ${
            snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'
          }`}
        >
          <div className="flex items-start p-4">
            {/* Drag Handle */}
            <div
              {...provided.dragHandleProps}
              className="pt-1 mr-3 text-gray-400 hover:text-gray-600 cursor-grab"
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
                    className="w-full font-bold text-lg px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <textarea
                    value={editData.summary || ''}
                    onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                    className="w-full text-gray-700 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Word Count:</span>
                    <input
                      type="number"
                      value={editData.estimatedWords || 0}
                      onChange={(e) => setEditData({ ...editData, estimatedWords: parseInt(e.target.value, 10) || 0 })}
                      className="w-24 px-2 py-1 border border-blue-300 rounded focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                    >
                      <Check size={16} /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditData({ ...chapter });
                        setIsEditing(false);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">
                      <span className="text-gray-400 mr-2">{index + 1}.</span>
                      {chapter.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <button onClick={() => setIsEditing(true)} className="hover:text-blue-600 p-1 rounded" title="Edit Manually">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDelete(index)} className="hover:text-red-600 p-1 rounded" title="Delete Chapter">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 text-sm leading-relaxed">{chapter.summary}</p>
                  
                  <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ~{chapter.estimatedWords} words
                    </span>
                    
                    {/* Regenerate Section */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Feedback for AI (optional)" 
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-200 rounded w-48 focus:outline-none focus:border-blue-400"
                      />
                      <button 
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200 ${isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate AI'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default OutlineCard;
