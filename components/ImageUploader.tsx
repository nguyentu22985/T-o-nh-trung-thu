import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, ExclamationTriangleIcon, PeopleIcon } from './Icons';
import { detectAllFaces, cropImageToFace } from '../services/faceDetectionService';

interface ImageUploaderProps {
  onFileChange: (file: File | null) => void;
  onFaceDetected: (croppedBase64: string | null) => void;
  modelsLoaded: boolean;
}

const StatusOverlay: React.FC<{ status: 'detecting' | 'not_found' | 'loading_models' | 'multiple_faces' }> = ({ status }) => {
    let icon;
    let text;
    let subtext;

    switch (status) {
        case 'detecting':
            icon = <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
            text = "Analyzing image...";
            break;
        case 'not_found':
            icon = <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />;
            text = "No face found";
            break;
        case 'loading_models':
            icon = <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
            text = "Initializing advanced face detector...";
            break;
        case 'multiple_faces':
            icon = <PeopleIcon className="w-8 h-8 text-brand-secondary" />;
            text = "Multiple Faces Detected";
            subtext = "Please click on the face you wish to use.";
            break;
    }

    return (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white font-semibold z-10 p-4 text-center">
            {icon}
            <span className="mt-2 text-lg">{text}</span>
            {subtext && <span className="mt-1 text-sm text-brand-text-secondary">{subtext}</span>}
        </div>
    );
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileChange, onFaceDetected, modelsLoaded }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'detected' | 'not_found' | 'multiple_faces'>('idle');
  const [detections, setDetections] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<Array<{ top: number; left: number; width: number; height: number; }> | null>(null);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState<number | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [showCroppedPreview, setShowCroppedPreview] = useState<boolean>(false);
  const [croppedFacePreviews, setCroppedFacePreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const currentFileRef = useRef<File | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const cropAndCallback = useCallback((detection: any, image: HTMLImageElement, file: File) => {
    const croppedBase64 = cropImageToFace(image, detection, file.type);
    onFaceDetected(croppedBase64);

    // Show temporary preview of the cropped face
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    setCroppedPreviewUrl(`data:${file.type};base64,${croppedBase64}`);
    setShowCroppedPreview(true);
    previewTimeoutRef.current = window.setTimeout(() => {
      setShowCroppedPreview(false);
    }, 2500); // Start fading out after 2.5 seconds
  }, [onFaceDetected]);
  
  const handleFaceSelect = useCallback((index: number) => {
    if (!previewUrl || !currentFileRef.current || !detections[index]) return;

    const image = new Image();
    image.src = previewUrl;
    image.onload = () => {
        setSelectedDetectionIndex(index);
        setDetectionStatus('detected');
        cropAndCallback(detections[index], image, currentFileRef.current!);
    };
  }, [previewUrl, detections, cropAndCallback]);

  const processFile = useCallback(async (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    // Clear any existing preview
    if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
    }
    setShowCroppedPreview(false);
    setCroppedPreviewUrl(null);
    setCroppedFacePreviews([]);
    
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setDetectionStatus('detecting');
    setBoxes(null);
    setDetections([]);
    setSelectedDetectionIndex(null);
    onFileChange(file);
    currentFileRef.current = file;

    const image = new Image();
    image.src = newPreviewUrl;
    image.onload = async () => {
      try {
        const allDetections = await detectAllFaces(image);
        
        if (allDetections.length === 0) {
          setDetectionStatus('not_found');
          onFaceDetected(null);
          return;
        }

        setDetections(allDetections);
        
        if (imageRef.current) {
          const { naturalWidth, naturalHeight } = image;
          const { width: displayWidth, height: displayHeight } = imageRef.current.getBoundingClientRect();
          
          const wrh = displayWidth / naturalWidth;
          const hrh = displayHeight / naturalHeight;
          const ratio = Math.min(wrh, hrh);
          const newWidth = naturalWidth * ratio;
          const newHeight = naturalHeight * ratio;
          const xOffset = (displayWidth - newWidth) / 2;
          const yOffset = (displayHeight - newHeight) / 2;

          const calculatedBoxes = allDetections.map(detection => {
            const box = detection.detection.box; // Box is nested inside detection property now
            return {
              left: box.left * ratio + xOffset,
              top: box.top * ratio + yOffset,
              width: box.width * ratio,
              height: box.height * ratio,
            };
          });
          setBoxes(calculatedBoxes);
        }

        if (allDetections.length === 1) {
            setSelectedDetectionIndex(0);
            setDetectionStatus('detected');
            setCroppedFacePreviews([]);
            cropAndCallback(allDetections[0], image, file);
        } else {
            setDetectionStatus('multiple_faces');
            const previews = allDetections.map(detection =>
              `data:${file.type};base64,${cropImageToFace(image, detection, file.type)}`
            );
            setCroppedFacePreviews(previews);
            onFaceDetected(null);
        }
      } catch (e) {
        console.error(e);
        setDetectionStatus('not_found');
        onFaceDetected(null);
      }
    };
  }, [onFileChange, onFaceDetected, previewUrl, cropAndCallback]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      {previewUrl ? (
        <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-600 relative group bg-black">
          <img src={previewUrl} ref={imageRef} alt="Image preview" className="w-full h-full object-contain" />
          {boxes && (detectionStatus === 'detected' || detectionStatus === 'multiple_faces') && boxes.map((box, index) => {
              const isSelected = index === selectedDetectionIndex;
              return (
                <div
                    key={index}
                    onClick={() => handleFaceSelect(index)}
                    className={`absolute transition-all duration-200
                        ${isSelected
                            ? 'border-4 border-brand-secondary shadow-lg pointer-events-none' 
                            : 'border-2 border-yellow-200 opacity-70 hover:opacity-100 hover:border-yellow-100'}
                        ${detectionStatus === 'multiple_faces' ? 'cursor-pointer' : ''}
                    `}
                    style={{
                        top: `${box.top}px`,
                        left: `${box.left}px`,
                        width: `${box.width}px`,
                        height: `${box.height}px`,
                    }}
                    aria-label={`Select face ${index + 1}`}
                >
                  {detectionStatus === 'multiple_faces' && (
                    <span className="absolute -top-3 -left-3 bg-brand-secondary text-brand-bg font-bold w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-md ring-2 ring-brand-surface">
                      {index + 1}
                    </span>
                  )}
                </div>
              );
          })}
          {(detectionStatus === 'detecting' || detectionStatus === 'not_found' || detectionStatus === 'multiple_faces' || !modelsLoaded) && (
            <StatusOverlay status={!modelsLoaded ? 'loading_models' : detectionStatus as 'detecting' | 'not_found' | 'multiple_faces'} />
          )}

          {croppedPreviewUrl && (
            <div className={`absolute bottom-4 right-4 z-30 transition-opacity duration-500 ease-in-out ${showCroppedPreview ? 'opacity-100' : 'opacity-0'}`}>
                <div className="relative p-1 bg-brand-surface rounded-lg shadow-2xl ring-2 ring-brand-secondary">
                  <img 
                      src={croppedPreviewUrl} 
                      alt="Cropped face preview" 
                      className="w-24 h-24 rounded-md object-cover"
                  />
                  <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-secondary text-brand-bg text-xs font-bold px-2 py-0.5 rounded-full">
                      Selected
                  </p>
                </div>
            </div>
          )}

          <button 
            onClick={handleClick} 
            className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold z-20"
          >
            Change Photo
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={!modelsLoaded}
          className="w-full aspect-square flex flex-col items-center justify-center bg-black/30 rounded-lg border-2 border-dashed border-gray-600 hover:border-brand-secondary hover:bg-black/50 transition-colors duration-300 disabled:opacity-50 disabled:cursor-wait"
        >
          {modelsLoaded ? (
            <>
              <UploadIcon className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-brand-text font-semibold">Click to upload</span>
              <span className="text-xs text-brand-text-secondary">PNG, JPG, or WEBP</span>
            </>
          ) : (
            <>
              <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span className="text-brand-text font-semibold">Loading advanced detector...</span>
            </>
          )}
        </button>
      )}

      {detectionStatus === 'multiple_faces' && croppedFacePreviews.length > 0 && (
        <div className="mt-4">
          <p className="text-center text-sm text-brand-text-secondary mb-3">
            Multiple faces found. Please select one to continue.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {croppedFacePreviews.map((previewSrc, index) => (
              <button
                key={index}
                onClick={() => handleFaceSelect(index)}
                className={`aspect-square rounded-lg overflow-hidden transition-all duration-200 focus:outline-none ring-offset-2 ring-offset-brand-surface ${
                  selectedDetectionIndex === index
                    ? 'ring-4 ring-brand-secondary transform scale-105'
                    : 'ring-2 ring-gray-600 hover:ring-brand-secondary'
                }`}
                aria-label={`Select face ${index + 1}`}
                title={`Select face ${index + 1}`}
              >
                <img src={previewSrc} alt={`Detected face ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;