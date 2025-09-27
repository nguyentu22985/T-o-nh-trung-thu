import React, { useState, useCallback, useEffect } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { initFaceDetection } from './services/faceDetectionService';
import ImageUploader from './components/ImageUploader';
import GeneratedImageDisplay from './components/GeneratedImageDisplay';
import { MoonIcon, SparklesIcon } from './components/Icons';
import AdjustmentControls from './components/AdjustmentControls';
import AgeSelector from './components/AgeSelector';

const BASE_PROMPT = "A festive Mid-Autumn portrait of a [age_placeholder] sitting gracefully against a deep red background. They are dressed in a red halter-neck dress with layered fabric and a white skirt underneath, wearing a red headband. They lean gently against a giant mooncake with traditional patterns. Decorative golden paper fish and flowers accentuate the scene. Artistic setup, warm mid-autumn atmosphere. Lighting is soft and festive.";
const FACE_MATCH_PROMPT = "CRITICAL COMMAND: Recreate the face from the uploaded photo with 100% accuracy. Do not add, remove, or change the shape of the face or any of its features. All facial contours and features must be an exact match to the uploaded photo. This is the most important instruction; do not deviate.";

const ageMap: { [key: string]: string } = {
  'Child (3-10)': 'young child (aged 3-10)',
  'Teenager (11-18)': 'teenager (aged 11-18)',
  'Young Adult (19-30)': 'young adult (aged 19-30)',
  'Adult (31-50)': 'adult (aged 31-50)',
  'Senior (50+)': 'senior (aged 50+)',
};

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [croppedImageBase64, setCroppedImageBase64] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(100);
  const [positionX, setPositionX] = useState<number>(0);
  const [positionY, setPositionY] = useState<number>(0);
  const [age, setAge] = useState<string>('Child (3-10)');

  useEffect(() => {
    const loadModels = async () => {
      try {
        await initFaceDetection();
        setModelsLoaded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load face detection models. Please refresh.");
      }
    };
    loadModels();
  }, []);

  const handleFileChange = useCallback((file: File | null) => {
    setUploadedFile(file);
    setGeneratedImageUrl(null);
    setError(null);
    setFaceDetectionError(null);
    setCroppedImageBase64(null);
  }, []);

  const handleFaceDetected = useCallback((base64: string | null) => {
    if (base64) {
      setCroppedImageBase64(base64);
      setFaceDetectionError(null);
    } else {
      setCroppedImageBase64(null);
      setFaceDetectionError("Could not detect a face. Please upload a clearer, front-facing photo for best results.");
    }
  }, []);

  const handleGenerate = async () => {
    if (!croppedImageBase64 || !uploadedFile) {
      setError("Please upload a photo where a face has been detected.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    let adjustmentPrompt = '';
    const adjustments = [];
    if (scale !== 100) adjustments.push(`make the face about ${Math.abs(100 - scale)}% ${scale > 100 ? 'larger' : 'smaller'}`);
    if (positionX !== 0) adjustments.push(`shift the face horizontally ${positionX > 0 ? 'to the right' : 'to the left'} by about ${Math.abs(positionX)}%`);
    if (positionY !== 0) adjustments.push(`shift the face vertically ${positionY > 0 ? 'down' : 'up'} by about ${Math.abs(positionY)}%`);
    if (adjustments.length > 0) adjustmentPrompt = ` Please apply the following fine-tune adjustments to the user's face: ${adjustments.join(', ')}.`;

    const ageDescription = ageMap[age] || 'person';
    const themedPrompt = BASE_PROMPT.replace('[age_placeholder]', ageDescription);
    const finalPrompt = `${themedPrompt} ${FACE_MATCH_PROMPT}${adjustmentPrompt}`;

    try {
      const mimeType = uploadedFile.type;
      const generatedBase64 = await editImageWithPrompt(croppedImageBase64, mimeType, finalPrompt);
      setGeneratedImageUrl(`data:image/jpeg;base64,${generatedBase64}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred during image generation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-2">
          <MoonIcon className="w-12 h-12 text-brand-secondary" />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-brand-secondary to-red-500">
            Mid-Autumn Portrait Generator
          </h1>
        </div>
        <p className="text-brand-text-secondary text-lg">
          Create a beautiful, artistic portrait for the Mid-Autumn Festival using your own photo.
        </p>
      </header>
      
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 w-full bg-brand-surface rounded-xl p-6 shadow-2xl flex flex-col border border-gray-700">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-brand-secondary border-b border-gray-600 pb-2">1. Upload a Photo</h2>
              <p className="text-brand-text-secondary mb-6 text-sm">
                A face will be automatically detected and cropped. Choose a clear, front-facing photo for best results.
              </p>
              <ImageUploader 
                onFileChange={handleFileChange} 
                onFaceDetected={handleFaceDetected}
                modelsLoaded={modelsLoaded}
              />
              {faceDetectionError && <p className="text-red-400 text-sm mt-3 text-center">{faceDetectionError}</p>}
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-brand-secondary border-b border-gray-600 pb-2">2. Choose Style</h2>
               <p className="text-brand-text-secondary mb-6 text-sm">
                Select an age to create a style appropriate for the person in the photo.
              </p>
              <AgeSelector 
                selectedAge={age}
                onAgeChange={setAge}
                disabled={!uploadedFile || isLoading}
              />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-brand-secondary border-b border-gray-600 pb-2">3. Adjust Portrait</h2>
              <p className="text-brand-text-secondary mb-6 text-sm">
                Fine-tune the position and size of the face in the generated image.
              </p>
              <AdjustmentControls
                scale={scale}
                setScale={setScale}
                positionX={positionX}
                setPositionX={setPositionX}
                positionY={positionY}
                setPositionY={setPositionY}
                disabled={!uploadedFile || isLoading}
              />
            </div>
          </div>
          
          <div className="mt-auto pt-8">
            <button
              onClick={handleGenerate}
              disabled={!uploadedFile || isLoading || !croppedImageBase64}
              className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-brand-primary text-white py-3 px-6 rounded-lg transition-all duration-300 ease-in-out enabled:hover:bg-brand-primary-hover enabled:hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed transform"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  Generate Portrait
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:w-2/3 w-full bg-brand-surface rounded-xl p-6 shadow-2xl flex flex-col border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-brand-secondary border-b border-gray-600 pb-2">Your Masterpiece</h2>
          <div className="flex-grow flex items-center justify-center rounded-lg bg-black/30 min-h-[400px] lg:min-h-0">
             <GeneratedImageDisplay
                imageUrl={generatedImageUrl}
                isLoading={isLoading}
                error={error}
             />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;