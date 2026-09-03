import React, { useState, useRef, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { aiApi } from '../api/aiApi';
import { bookApi } from '../api/bookApi';
import { RefreshCw, Play, Settings2, CheckCircle2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../hooks/useTheme';

const ChapterGenerator = ({ chapter, bookContext, previousChapter, nextChapter, onUpdateContent }) => {
  const [content, setContent] = useState(chapter.content || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState('full_draft');
  const [targetWords, setTargetWords] = useState(1000);
  const [selectedText, setSelectedText] = useState('');
  const [generationsRemaining, setGenerationsRemaining] = useState(null);
  const { theme } = useTheme();

  const contentRef = useRef(chapter.content || '');
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setContent(chapter.content || '');
  }, [chapter._id]);
  
  const textareaRef = useRef(null);

  const [saveStatus, setSaveStatus] = useState('saved');
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
        if (onUpdateContent) {
          onUpdateContent(content);
        }
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
        setContent(prev => {
          const newContent = prev + textChunk;
          contentRef.current = newContent;
          return newContent;
        });
        if (remaining) {
          setGenerationsRemaining(remaining);
        }
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      },
      (remaining) => {
        setIsGenerating(false);
        if (remaining) {
          setGenerationsRemaining(remaining);
        }
        if (contentRef.current && chapter._id && chapter._id !== 'temp') {
          bookApi.saveChapterVersion(chapter._id, contentRef.current, `AI Generation: ${mode}`)
            .then(() => toast.success('New version saved to history'))
            .catch(err => console.error('Failed to save version', err));
        }
      },
      (error) => {
        toast.error('Failed to generate chapter. ' + (error.message || ''));
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
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{chapter.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{chapter.summary}</p>
        </div>
        
        {generationsRemaining !== null && (
          <div className="text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-full shrink-0">
            {generationsRemaining} generations remaining today
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Generation Mode</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 dark:text-white rounded-xl shadow-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm outline-none px-3 py-2 transition-colors"
          >
            <option value="full_draft">Write Full Draft</option>
            <option value="expand_text">Expand Selected Text</option>
            <option value="rewrite_tone">Rewrite in Different Tone</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Word Count</label>
            <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">{targetWords} words</span>
          </div>
          <input 
            type="range" 
            min="200" 
            max="3000" 
            step="100"
            value={targetWords}
            onChange={(e) => setTargetWords(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
          />
        </div>
      </div>

      {mode !== 'full_draft' && selectedText && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl">
          <h4 className="text-xs font-bold text-primary-800 dark:text-primary-400 uppercase mb-1">Selected Text:</h4>
          <p className="text-sm text-primary-900 dark:text-primary-300 italic line-clamp-3">"{selectedText}"</p>
        </div>
      )}

      {mode !== 'full_draft' && !selectedText && (
        <div className="mb-4 text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/50">
          Please select some text in the editor below to use this mode.
        </div>
      )}

      <div className="flex-1 flex flex-col mb-4 min-h-[450px]" data-color-mode={theme}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => handleEditorViewChange('edit')} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${editorView === 'edit' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Edit Only</button>
            <button onClick={() => handleEditorViewChange('live')} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${editorView === 'live' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Split View</button>
            <button onClick={() => handleEditorViewChange('preview')} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${editorView === 'preview' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Preview Only</button>
          </div>
          <div className="flex items-center justify-end w-full sm:w-auto gap-2 text-xs font-medium mt-1 sm:mt-0">
            <button 
              onClick={() => {
                if (content && chapter._id && chapter._id !== 'temp') {
                  const summary = window.prompt("Enter a brief description for this version:", "Manual Save");
                  if (summary) {
                    bookApi.saveChapterVersion(chapter._id, content, summary)
                      .then(() => toast.success('Version saved successfully'))
                      .catch(() => toast.error('Failed to save version'));
                  }
                }
              }}
              disabled={!content || chapter._id === 'temp'}
              className="mr-2 px-2 py-1 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Save to Version History"
            >
              <Save size={14} /> Save Version
            </button>
            {saveStatus === 'saving' && <span className="text-amber-500 flex items-center gap-1.5"><RefreshCw size={14} className="animate-spin" /> Autosaving...</span>}
            {saveStatus === 'saved' && <span className="text-green-500 flex items-center gap-1.5"><CheckCircle2 size={14} /> Saved</span>}
            {saveStatus === 'waiting' && <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><Save size={14} /> Unsaved...</span>}
          </div>
        </div>

        <MDEditor
          value={!content && editorView === 'preview' ? '_No content to preview yet. Generate a chapter or switch to Edit mode to start writing._' : content}
          onChange={(val) => {
            if (val !== '_No content to preview yet. Generate a chapter or switch to Edit mode to start writing._') {
              setContent(val || '');
            }
          }}
          preview={editorView === 'preview' ? 'live' : editorView}
          height={400}
          className={`flex-1 w-full border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden ${editorView === 'preview' ? 'force-preview-mode' : ''}`}
          textareaProps={{
            ref: textareaRef,
            onSelect: handleTextSelection,
            placeholder: "Your chapter content will appear here..."
          }}
        />
        <div className="flex justify-end gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>{content.length} characters</span>
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            generationsRemaining === 0 ||
            (mode !== 'full_draft' && !selectedText)
          }
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-sm
            ${
              isGenerating
                ? 'bg-primary-400 dark:bg-primary-500/50 cursor-not-allowed'
                : generationsRemaining === 0
                  ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 hover:shadow-md'
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
