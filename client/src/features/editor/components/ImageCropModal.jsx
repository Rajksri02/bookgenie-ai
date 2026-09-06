import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, getFittedImg } from '../../../utils/cropImage';
import { Loader2, X, Maximize, Crop as CropIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageCropModal = ({ isOpen, imageSrc, onClose, onComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [mode, setMode] = useState('crop'); // 'crop' or 'fit'
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc) return;
    try {
      setIsProcessing(true);
      let finalBlob;
      
      if (mode === 'crop') {
        finalBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      } else {
        finalBlob = await getFittedImg(imageSrc, 2 / 3);
      }
      
      onComplete(finalBlob);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Adjust Cover Image</h3>
              <button 
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="relative w-full h-[50vh] min-h-[400px] bg-slate-950 flex items-center justify-center">
              {mode === 'crop' ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={2 / 3}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="relative w-full h-full max-w-[calc(100%)] max-h-[calc(100%)] flex items-center justify-center">
                    {/* Visual representation of 'fit' mode padding */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img src={imageSrc} className="w-full h-full object-cover blur-3xl opacity-50 scale-110" alt="" />
                    </div>
                    <img 
                      src={imageSrc} 
                      alt="Preview" 
                      className="relative z-10 max-w-full max-h-full object-contain shadow-2xl" 
                      style={{ aspectRatio: '2/3' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 space-y-6">
              
              {/* Mode Toggle */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setMode('crop')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                    mode === 'crop' 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <CropIcon className="w-4 h-4" />
                  Crop to Fit
                </button>
                <button
                  onClick={() => setMode('fit')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                    mode === 'fit' 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Maximize className="w-4 h-4" />
                  Fit Entire Image
                </button>
              </div>

              {/* Zoom Slider (Only in crop mode) */}
              {mode === 'crop' && (
                <div className="flex items-center gap-4 max-w-md mx-auto">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Apply & Upload
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImageCropModal;
