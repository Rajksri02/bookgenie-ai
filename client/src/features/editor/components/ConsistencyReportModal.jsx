import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConsistencyReportModal = ({ isOpen, onClose, report }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <CheckCircle size={22} className="text-primary-500" />
              AI Writing Style Consistency Report
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!report ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-5 rounded-xl border border-primary-100 dark:border-primary-800/50">
                  <h3 className="text-sm font-bold text-primary-800 dark:text-primary-400 uppercase tracking-wider mb-2">Overall Assessment</h3>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {report.overallAssessment}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Flagged Chapters ({report.inconsistentChapters?.length || 0})
                  </h3>
                  
                  {(!report.inconsistentChapters || report.inconsistentChapters.length === 0) ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <CheckCircle size={40} className="mx-auto text-green-500 mb-3 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">All chapters look consistent!</p>
                      <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">No major style deviations found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {report.inconsistentChapters.map((issue, idx) => (
                        <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                          <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white">
                            Chapter: {issue.chapterTitle}
                          </div>
                          <div className="p-4 space-y-4">
                            <div>
                              <span className="text-xs font-bold uppercase text-red-500 mb-1 block">Identified Issue</span>
                              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{issue.issue}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                              <span className="text-xs font-bold uppercase text-green-600 dark:text-green-500 mb-1 block">Suggestion</span>
                              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{issue.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm"
            >
              Close Report
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConsistencyReportModal;
