import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { bookApi } from '../api/bookApi';
import { ImagePlus, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { heicTo } from 'heic-to';
import ImageCropModal from './ImageCropModal';

const BookMetadataForm = ({ metadata, setMetadata, initialBookContext = {} }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Convert HEIC/HEIF to JPEG first
      if (
        file.type === 'image/heic' || 
        file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') || 
        file.name.toLowerCase().endsWith('.heif')
      ) {
        const convertedBlob = await heicTo({
          blob: file,
          type: 'image/jpeg',
          quality: 0.8
        });
        
        file = new File([convertedBlob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
      }

      // Create an object URL for the crop modal
      const imageUrl = URL.createObjectURL(file);
      setSelectedImageForCrop(imageUrl);
      setCropModalOpen(true);
      
    } catch (error) {
      console.error('Error preparing image:', error);
      toast.error(error?.message || 'Failed to prepare image. Please try another format.');
    } finally {
      setIsUploading(false);
    }
    
    // Reset file input so selecting the same file again works
    e.target.value = '';
  };

  const handleCropComplete = async (processedBlob) => {
    setCropModalOpen(false);
    if (!processedBlob) return;

    try {
      setIsUploading(true);
      const options = {
        maxSizeMB: 5,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        initialQuality: 0.95
      };
      
      // Convert Blob to File for browser-image-compression
      const file = new File([processedBlob], 'cover.jpg', { type: 'image/jpeg' });
      const compressedFile = await imageCompression(file, options);
      
      const response = await bookApi.uploadCoverImage(compressedFile);
      if (response.success) {
        setMetadata(prev => ({ ...prev, coverImage: response.url }));
        toast.success("Cover image updated successfully!");
      }
    } catch (error) {
      console.error('Error uploading cropped image:', error);
      toast.error(error?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      // Clean up object URL
      if (selectedImageForCrop) {
        URL.revokeObjectURL(selectedImageForCrop);
        setSelectedImageForCrop(null);
      }
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (selectedImageForCrop) {
      URL.revokeObjectURL(selectedImageForCrop);
      setSelectedImageForCrop(null);
    }
  };

  const handleGenerateCover = async () => {
    if (!metadata.title) {
      toast.error("Please provide a book title first.");
      return;
    }
    
    try {
      setIsGenerating(true);
      const response = await bookApi.generateCoverImage({
        title: metadata.title,
        subtitle: metadata.subtitle || '',
        description: metadata.description || '',
        genre: metadata.genre || initialBookContext.genre || 'General Fiction',
        tone: initialBookContext.tone || 'Professional',
      });
      
      if (response.success) {
        setMetadata(prev => ({ ...prev, coverImage: response.url }));
      }
    } catch (error) {
      console.error('Error generating cover:', error);
      toast.error('Failed to generate cover. Check server logs.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 mb-8 flex flex-col md:flex-row gap-8">
      
      {/* Form Fields */}
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Book Title *</label>
          <input 
            type="text" 
            name="title"
            value={metadata.title || ''} 
            onChange={handleChange}
            className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
            placeholder="Enter book title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtitle</label>
          <input 
            type="text" 
            name="subtitle"
            value={metadata.subtitle || ''} 
            onChange={handleChange}
            className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
            placeholder="Enter subtitle (optional)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Author</label>
            <input 
              type="text" 
              name="author"
              value={metadata.author || ''} 
              onChange={handleChange}
              className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              placeholder="Author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Genre</label>
            <input 
              type="text" 
              name="genre"
              value={metadata.genre || ''} 
              onChange={handleChange}
              className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              placeholder="e.g. Science Fiction"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea 
            name="description"
            value={metadata.description || ''} 
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-transparent dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
            placeholder="Brief book synopsis or description"
          />
        </div>
      </div>

      {/* Cover Image Section */}
      <div className="w-full md:w-64 flex flex-col gap-4 shrink-0">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cover Image (2:3 Ratio)</label>
        
        <div className="relative aspect-[2/3] w-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden flex items-center justify-center group">
          {metadata.coverImage ? (
            <img 
              src={metadata.coverImage} 
              alt="Book Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4 text-slate-400 dark:text-slate-500">
              <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span className="text-xs">No cover selected</span>
            </div>
          )}

          {/* Upload Overlay */}
          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-white">
            <span className="text-sm font-medium">Upload Image</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageSelect}
              disabled={isUploading || isGenerating}
            />
          </label>
          
          {(isUploading || isGenerating) && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isGenerating ? 'AI Generating...' : 'Uploading...'}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerateCover}
          disabled={isUploading || isGenerating || !metadata.title}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          AI Generate Cover
        </button>
      </div>
      
    </div>
      
      {/* Crop Modal */}
      <ImageCropModal 
        isOpen={cropModalOpen}
        imageSrc={selectedImageForCrop}
        onClose={handleCropCancel}
        onComplete={handleCropComplete}
      />
    </>
  );
};

export default BookMetadataForm;
