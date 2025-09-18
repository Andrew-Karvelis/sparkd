/**
 * Face detection utilities for validating uploaded photos
 * This uses OpenAI's vision API to detect faces in images
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface FaceDetectionResult {
  hasFace: boolean;
  faceCount: number;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Analyzes an image to detect faces and provide feedback
 */
export async function detectFaces(base64Image: string): Promise<FaceDetectionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image for face detection and photo quality for a dating profile. Please provide:
              
              1. How many faces are visible in the image?
              2. Is there exactly one clear, well-lit face that would work for a dating profile?
              3. Are there any quality issues (blurry, too dark, face too small, etc.)?
              4. Any suggestions for improvement?
              
              Respond in this exact JSON format:
              {
                "faceCount": number,
                "hasClearFace": boolean,
                "confidence": number (0-100),
                "issues": ["list of issues"],
                "suggestions": ["list of suggestions"]
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from face detection API");
    }

    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        hasFace: result.hasClearFace && result.faceCount === 1,
        faceCount: result.faceCount || 0,
        confidence: result.confidence || 0,
        issues: result.issues || [],
        suggestions: result.suggestions || []
      };
    } catch (parseError) {
      // Fallback: analyze the text response
      const lowerContent = content.toLowerCase();
      const hasFace = lowerContent.includes('face') && !lowerContent.includes('no face');
      const hasMultipleFaces = lowerContent.includes('multiple') || lowerContent.includes('several');
      
      return {
        hasFace: hasFace && !hasMultipleFaces,
        faceCount: hasMultipleFaces ? 2 : (hasFace ? 1 : 0),
        confidence: 50, // Low confidence for fallback
        issues: hasFace ? [] : ["Could not clearly detect a face in the image"],
        suggestions: ["Please upload a clear photo with your face visible"]
      };
    }
  } catch (error) {
    console.error("Face detection error:", error);
    
    // Return permissive result if face detection fails
    return {
      hasFace: true, // Allow upload to proceed
      faceCount: 1,
      confidence: 0,
      issues: ["Face detection temporarily unavailable"],
      suggestions: ["Please ensure your photo shows your face clearly"]
    };
  }
}

/**
 * Validates if an image is suitable for dating profile enhancement
 */
export async function validateProfilePhoto(base64Image: string): Promise<{
  isValid: boolean;
  result: FaceDetectionResult;
  message: string;
}> {
  const result = await detectFaces(base64Image);
  
  let isValid = true;
  let message = "Photo looks good!";
  
  if (!result.hasFace) {
    isValid = false;
    if (result.faceCount === 0) {
      message = "No face detected in the image. Please upload a photo that clearly shows your face.";
    } else if (result.faceCount > 1) {
      message = "Multiple faces detected. Please upload a photo with only yourself visible.";
    } else {
      message = "Face is not clear enough. Please upload a clearer photo with better lighting.";
    }
  } else if (result.confidence < 70) {
    message = "Photo quality could be improved. " + (result.suggestions[0] || "Try better lighting or a clearer image.");
  }
  
  return {
    isValid,
    result,
    message
  };
}

/**
 * Quick face detection for client-side validation (simplified)
 */
export function validateImageBasics(file: File): { isValid: boolean; message: string } {
  // Basic file validation
  if (!file.type.startsWith('image/')) {
    return { isValid: false, message: "Please upload an image file." };
  }
  
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, message: "Image file is too large. Maximum size is 10MB." };
  }
  
  if (file.size < 50 * 1024) {
    return { isValid: false, message: "Image file is too small. Please upload a higher quality image." };
  }
  
  return { isValid: true, message: "Image file looks good." };
}
