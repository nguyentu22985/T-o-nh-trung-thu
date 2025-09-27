import { GoogleGenAI, Modality } from "@google/genai";

// The API key is expected to be set in the environment, so we check for its presence.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Loop through the response parts to find the generated image data
    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return part.inlineData.data;
            }
        }
    }

    // If no image is found in the response, throw an error
    throw new Error("The API did not return an image. It's possible the request was filtered for safety reasons.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Provide a more user-friendly error message
    throw new Error("Failed to generate the portrait. The model may be unavailable or the request could not be processed.");
  }
};