// This service uses the face-api.js library loaded globally from the script tag in index.html
// We declare faceapi here to inform TypeScript that it exists on the global scope.
declare const faceapi: any;

let modelsLoaded = false;
// Models are loaded from a CDN. This URL points to the weights for the models.
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

/**
 * Initializes the face detection models. This must be called once before any detection is performed.
 */
export const initFaceDetection = async (): Promise<void> => {
    if (modelsLoaded || typeof faceapi === 'undefined') {
        return;
    }
    try {
        // We are using a more accurate model (SsdMobilenetv1) and loading landmarks for better detection.
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        modelsLoaded = true;
    } catch (error) {
        console.error("Error loading face detection models:", error);
        throw new Error("Could not load face detection models.");
    }
};

/**
 * Detects all faces in an HTMLImageElement.
 * @param image The image to process.
 * @returns An array of detection objects, or an empty array if no faces are found.
 */
export const detectAllFaces = async (image: HTMLImageElement): Promise<any[]> => {
    if (!modelsLoaded) {
        console.warn("Face detection models are not loaded yet.");
        return [];
    }
    try {
        // Use the default (SsdMobilenetv1) detector and also find landmarks.
        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks();
        return detections;
    } catch (error) {
        console.error("Error during face detection:", error);
        return [];
    }
};

/**
 * Crops an image to a square centered on the detected face.
 * @param image The original image element.
 * @param detection The detection object from face-api.js.
 * @param fileType The MIME type of the output image (e.g., 'image/jpeg').
 * @returns A base64-encoded string of the cropped image, without the data URL prefix.
 */
export const cropImageToFace = (
    image: HTMLImageElement,
    detection: any,
    fileType: string = 'image/jpeg'
): string => {
    // The detection object now has a `detection` property containing the box when landmarks are used.
    const box = detection.detection.box;
    
    // Determine the size of the square crop box with padding
    const biggerBoxSize = Math.max(box.width, box.height);
    const padding = biggerBoxSize * 0.5; // 50% padding around the largest dimension
    const size = Math.min(biggerBoxSize + padding, image.naturalWidth, image.naturalHeight);

    // Center the crop box on the face
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    let cropX = centerX - size / 2;
    let cropY = centerY - size / 2;

    // Ensure the crop box is within the image bounds
    if (cropX < 0) cropX = 0;
    if (cropY < 0) cropY = 0;
    if (cropX + size > image.naturalWidth) cropX = image.naturalWidth - size;
    if (cropY + size > image.naturalHeight) cropY = image.naturalHeight - size;

    // Create an off-screen canvas to perform the crop
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context for cropping.');

    // Draw the cropped portion of the original image onto the canvas
    ctx.drawImage(
        image,
        cropX,
        cropY,
        size,
        size,
        0,
        0,
        size,
        size
    );
    
    // Convert the canvas content to a base64 string and strip the data URL prefix
    const base64String = canvas.toDataURL(fileType, 0.95).split(',')[1];
    if (!base64String) {
        throw new Error('Could not create base64 string from cropped image.');
    }
    return base64String;
};