import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookApi } from '../api/bookApi';

const VersionHistoryDrawer = ({ isOpen, onClose, chapterId, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (isOpen && chapterId && chapterId !== 'temp') {
      fetchVersions();
    }
  }, [isOpen, chapterId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await bookApi.getChapterVersions(chapterId);
      if (res.success) {
        setVersions(res.data);
      }
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version) => {
    if (!window.confirm('Are you sure you want to restore this version? Current unsaved changes will be lost.')) return;
    
    try {
      const res = await bookApi.restoreChapterVersion(chapterId, version._id);
      if (res.success) {
        toast.success('Version restored successfully');
        if (onRestore) {
          onRestore(res.data.content);
        }
        onClose();
      }
    } catch (error) {
      toast.error('Failed to restore version');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-left">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
            <Clock size={20} className="text-primary-500" />
            Version History
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center p-8 text-slate-500 dark:text-slate-400">
              <Clock size={40} className="mx-auto mb-3 opacity-20" />
              <p>No version history available.</p>
              <p className="text-sm mt-1">Versions are saved automatically when AI generates content, or you can save manually.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, idx) => (
                <div 
                  key={version._id}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedVersion?._id === version._id 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                  onClick={() => setSelectedVersion(selectedVersion?._id === version._id ? null : version)}
                >
                  <div className="flex justify-between items-start mb-2 cursor-pointer">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {version.summary || 'Saved version'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatDate(version.createdAt)} {idx === 0 && '• Latest'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedVersion?._id === version._id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                      <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs text-slate-700 dark:text-slate-300 font-mono mb-3 whitespace-pre-wrap">
                        {version.content.substring(0, 300)}
                        {version.content.length > 300 && '...'}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <RotateCcw size={16} />
                        Restore This Version
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryDrawer;
