import React from 'react';
import { ImageIcon, ExclamationTriangleIcon, DownloadIcon } from './Icons';

interface GeneratedImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-8 text-brand-text-secondary">
        <svg className="animate-spin h-10 w-10 text-brand-secondary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-xl font-semibold text-brand-text">Crafting your portrait...</h3>
        <p className="mt-2">This magical process can take a moment. Please wait.</p>
    </div>
);

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ imageUrl, isLoading, error }) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 text-red-400">
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold text-red-300">An Error Occurred</h3>
        <p className="mt-2 max-w-md">{error}</p>
      </div>
    );
  }

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'mid-autumn-portrait.jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (imageUrl) {
    return (
      <div className="w-full h-full p-2 relative group">
        <img src={imageUrl} alt="Generated mid-autumn portrait" className="w-full h-full object-contain rounded-lg shadow-lg" />
        <button
            onClick={handleDownload}
            className="absolute top-4 right-4 bg-brand-primary text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:bg-brand-primary-hover hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-secondary"
            aria-label="Download image"
            title="Download Image"
        >
            <DownloadIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 text-brand-text-secondary">
      <ImageIcon className="w-16 h-16 mb-4" />
      <h3 className="text-xl font-semibold text-brand-text">Your portrait will appear here</h3>
      <p className="mt-2 max-w-md">Upload a photo and click "Generate Portrait" to see the result.</p>
    </div>
  );
};

export default GeneratedImageDisplay;