import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode;
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackIcon,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isValidSrc = src && typeof src === 'string' && src.trim() !== '' 
    && src !== 'null' && src !== 'undefined';

  if (!isValidSrc || hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400",
        className
      )}>
        {fallbackIcon || <ImageOff className="w-1/3 h-1/3 max-w-8 max-h-8" />}
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={cn("flex items-center justify-center bg-slate-100 dark:bg-slate-800", className)}>
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(className, isLoading && "hidden")}
        onError={() => { setHasError(true); setIsLoading(false); }}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        {...props}
      />
    </>
  );
}