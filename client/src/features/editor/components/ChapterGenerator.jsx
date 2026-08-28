import React, { useState, useRef, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { aiApi } from '../api/aiApi';
import { bookApi } from '../api/bookApi';
import { RefreshCw, Play, Settings2, CheckCircle2, Save } from 'lucide-react';

const ChapterGenerator = ({ chapter, bookContext, previousChapter, nextChapter }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState('full_draft');
  const [targetWords, setTargetWords] = useState(1000);
  const [selectedText, setSelectedText] = useState('');
  const [generationsRemaining, setGenerationsRemaining] = useState(null);
  
  const textareaRef = useRef(null);

  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'waiting'
  const autosaveTimeoutRef = useRef(null);

  const [editorView, setEditorView] = useState(() => {
    return localStorage.getItem('bookgenie_editor_view') || 'live';
  });

  const handleEditorViewChange = (view) => {
    setEditorView(view);
    localStorage.setItem('bookgenie_editor_view', view);
  };

  useEffect(() => {
    if (!content) return;
    
    setSaveStatus('waiting');
    
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    autosaveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await bookApi.autosaveChapter(chapter._id || 'temp', content);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Autosave failed:', error);
        setSaveStatus('waiting');
      }
    }, 3000);
    
    return () => clearTimeout(autosaveTimeoutRef.current);
  }, [content, chapter._id]);

  const handleGenerate = () => {
    if (isGenerating) return;

    setContent('');
    setIsGenerating(true);

    const params = {
      mode,
      bookTitle: bookContext.title || 'Untitled Book',
      chapterTitle: chapter.title,
      chapterSummary: chapter.summary,
      prevChapterExcerpt: previousChapter ? `End of chapter ${previousChapter.title}` : '',
      nextChapterTitle: nextChapter ? nextChapter.title : '',
      targetWords,
      tone: bookContext.tone || 'Professional',
      selectedText: mode !== 'full_draft' ? selectedText : undefined
    };

    aiApi.generateChapterContentStream(
      chapter._id || 'temp', 
      params,
      (textChunk, remaining) => {
        setContent(prev => prev + textChunk);
        if (remaining) {
          setGenerationsRemaining(remaining);
        }
        // Auto scroll to bottom
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      },
      (remaining) => {
        setIsGenerating(false);
        if (remaining) {
          setGenerationsRemaining(remaining);
        }
      },
      (error) => {
        console.error('Generation error:', error);
        alert('Failed to generate chapter. ' + (error.message || ''));
        setIsGenerating(false);
      }
    );
  };

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const selectionStart = textareaRef.current.selectionStart;
      const selectionEnd = textareaRef.current.selectionEnd;
      if (selectionStart !== selectionEnd) {
        setSelectedText(content.substring(selectionStart, selectionEnd));
      } else {
        setSelectedText('');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{chapter.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{chapter.summary}</p>
        </div>
        
        {generationsRemaining !== null && (
          <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {generationsRemaining} generations remaining today
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Generation Mode</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="full_draft">Write Full Draft</option>
            <option value="expand_text">Expand Selected Text</option>
            <option value="rewrite_tone">Rewrite in Different Tone</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Word Count</label>
            <span className="text-sm text-blue-600 font-medium">{targetWords} words</span>
          </div>
          <input 
            type="range" 
            min="200" 
            max="3000" 
            step="100"
            value={targetWords}
            onChange={(e) => setTargetWords(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
          />
        </div>
      </div>

      {mode !== 'full_draft' && selectedText && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Selected Text:</h4>
          <p className="text-sm text-blue-900 italic line-clamp-3">"{selectedText}"</p>
        </div>
      )}

      {mode !== 'full_draft' && !selectedText && (
        <div className="mb-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-100">
          Please select some text in the editor below to use this mode.
        </div>
      )}

      <div className="flex-1 flex flex-col mb-4 min-h-[450px]" data-color-mode="light">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2">
            <button onClick={() => handleEditorViewChange('edit')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${editorView === 'edit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Edit Only</button>
            <button onClick={() => handleEditorViewChange('live')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${editorView === 'live' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Split View</button>
            <button onClick={() => handleEditorViewChange('preview')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${editorView === 'preview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Preview Only</button>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            {saveStatus === 'saving' && <span className="text-amber-500 flex items-center gap-1.5"><RefreshCw size={14} className="animate-spin" /> Saving...</span>}
            {saveStatus === 'saved' && <span className="text-green-500 flex items-center gap-1.5"><CheckCircle2 size={14} /> Saved</span>}
            {saveStatus === 'waiting' && <span className="text-gray-400 flex items-center gap-1.5"><Save size={14} /> Unsaved changes...</span>}
          </div>
        </div>

        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          preview={editorView}
          height={400}
          className="flex-1 w-full border border-gray-200 rounded-lg shadow-sm"
          previewOptions={{
            className: "prose max-w-none prose-blue p-4"
          }}
          textareaProps={{
            ref: textareaRef,
            onSelect: handleTextSelection,
            placeholder: "Your chapter content will appear here..."
          }}
        />
         <div className="flex justify-end gap-4 text-xs text-gray-500 mt-1">
  <span>{content.length} characters</span>
  <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
</div>
      </div>

         <div className="flex justify-end gap-3">

        <button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            generationsRemaining === 0 ||
            (mode !== 'full_draft' && !selectedText)
          }
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all
            ${
              isGenerating
                ? 'bg-blue-400 cursor-not-allowed'
                : generationsRemaining === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
            }`}
        >
          {isGenerating ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Play size={18} />
          )}

          {isGenerating
            ? 'Generating...'
            : mode === 'full_draft'
              ? 'Generate Chapter'
              : 'Apply AI Edit'}
        </button>
      </div>
    </div>
  );
};

export default ChapterGenerator;
