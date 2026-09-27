import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { getImageUrl } from '@/lib/imageUrl';
import React, { useState, useEffect } from 'react';

interface ImageGalleryProps {
  images: string[];
  mainImage: string;
  productName: string;
}

export function ImageGallery({ images, mainImage, productName }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(mainImage);
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
  setSelectedImage(mainImage);
  setCurrentIndex(0);
}, [mainImage]);

  // ✅ S'assurer que les images sont un tableau
  const allImages = [mainImage, ...images.filter(img => img !== mainImage)].filter(Boolean);
  const uniqueImages = Array.from(new Set(allImages));

  const handleImageClick = (img: string) => {
    setSelectedImage(img);
    setCurrentIndex(uniqueImages.indexOf(img));
  };

  const handleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + uniqueImages.length) % uniqueImages.length;
    setCurrentIndex(newIndex);
    setSelectedImage(uniqueImages[newIndex]);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % uniqueImages.length;
    setCurrentIndex(newIndex);
    setSelectedImage(uniqueImages[newIndex]);
  };

  if (uniqueImages.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
        <ShoppingBag className="w-20 h-20 text-slate-300" />
      </div>
    );
  }

  return (
    <>
      {/* Main image */}
      <div 
        className="relative w-full aspect-[4/3] md:aspect-auto md:h-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden cursor-zoom-in"
        onClick={handleZoom}
      >
        <SafeImage
  src={getImageUrl(selectedImage)}
  alt={productName}
  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
/>
        
        {/* Navigation arrows - Desktop */}
        {uniqueImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
          🔍 Agrandir
        </div>

        {/* Image counter */}
        {uniqueImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
            {currentIndex + 1} / {uniqueImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {uniqueImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {uniqueImages.map((img, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(img)}
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === img 
                  ? 'border-indigo-600 shadow-md shadow-indigo-200' 
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              <SafeImage
  src={getImageUrl(img)}
  alt={`${productName} - ${index + 1}`}
  className="w-full h-full object-cover"
/>
              {selectedImage === img && (
                <div className="absolute inset-0 bg-indigo-600/10" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={handleZoom}
        >
          <button 
            onClick={handleZoom}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <SafeImage
  src={getImageUrl(selectedImage)}
  alt={productName}
  className="w-full h-full object-contain"
/>
            
            {uniqueImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}