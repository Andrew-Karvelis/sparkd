/**
 * Configuration settings for the Sparkd Dating app
 *
 * IMPORTANT: OpenAI Model Clarification
 * - GPT-4o: OpenAI's most advanced multimodal model (2024) - for text + image analysis
 * - DALL-E 3: OpenAI's latest image generation model (2023) - NOT old or trash!
 * - DALL-E 2: The older version (2022) - this one is less advanced
 */

export const APP_CONFIG = {
  // Image generation settings
  imageGeneration: {
    maxThemes: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],

    // OpenAI Models (all current and advanced)
    analysisModel: 'gpt-4o', // Latest multimodal model for image analysis
    editModel: 'gpt-image-1', // Use OpenAI image edits for background replacement while preserving subject
    // generateModel: 'dall-e-3',  // Background-only generation if needed for fallbacks

    imageSize: '1024x1024' as const,
    imageQuality: 'hd' as const,
    imageStyle: 'natural' as const,
    requestDelay: 1000, // ms between requests to avoid rate limiting

    // Enhancement options
    useAdvancedPrompting: true,
    preserveLikeness: true, // Focus on maintaining person's appearance
    enhancementStrength: 'conservative', // 'conservative', 'moderate', 'strong'

    // Alternative services (if you want to use non-OpenAI)
    alternativeService: 'none', // 'midjourney', 'stable-diffusion', 'none'
  },

  // Face detection settings
  faceDetection: {
    enabled: true,
    minConfidence: 70,
    allowMultipleFaces: false,
    requireFaceDetection: false, // Set to true for strict validation
  },

  // Storage settings
  storage: {
    useCloudStorage: process.env.NODE_ENV === 'production',
    localStoragePath: '/uploads',
    cloudProvider: process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' :
      process.env.AWS_S3_BUCKET ? 'aws' : 'local',
  },

  // User limits
  userLimits: {
    freeCredits: 3,
    maxImagesPerSession: 10,
    maxFileUploads: 5,
  },

  // UI settings
  ui: {
    showProgressBar: true,
    showFaceDetectionFeedback: true,
    enableImagePreview: true,
    maxPreviewSize: 400, // px
  },

  // API settings
  api: {
    timeout: 60000, // 60 seconds
    retryAttempts: 2,
    rateLimitDelay: 1000,
  }
} as const;
// Global hyper‑realistic prompt guidelines used for image generation
export const HYPER_REALISTIC_PROMPT = `Create a hyper-realistic photo of this exact person for social media.
IMPORTANT: The person's face, body, and identity are locked and may NOT change under any circumstances. Clothing is the ONLY element that may be altered, and only as described.

Guidelines:
- Exact likeness only: replicate the person’s face structure, proportions, eye shape, nose, mouth, jawline, ears, and all defining features
- Do not change hairstyle, hair length, hairline, facial hair, or skin tone
- Do not alter body type, height, posture, or proportions
- Do not change age, weight, or any unique characteristics (scars, freckles, birthmarks)
- Do not stylize, beautify, or exaggerate features in any way
- No alternate interpretations – likeness must match reference with absolute precision

## Style & Format
- Hyper-realistic, ultra-detailed photography
- Wide-angle outdoor shot with natural depth, scale, and authentic textures
- Lighting must be natural, shadows realistic, background indistinguishable from a real photograph
- Image must NOT contain signs of CGI, painting, smooth gradients, or surreal artifacts

## Positioning
- Subject slightly farther from camera (mid-shot to full-body)
- Looking slightly away, candid but face remains unobstructed and fully visible
- No props or objects blocking the face
- Composition should feel natural, like a real candid vacation photo, not AI-generated

## OUTFIT
- Only replace clothing with attire appropriate for the selected setting.
- Do NOT alter the person's face, hair, body, proportions, or unique features in any way.
- The subject’s face, body, and likeness must remain IDENTICAL to the reference image with pixel-level consistency.
- Clothing change must look natural, realistic, and integrated, as if photographed in that outfit.
- No stylization or beautification – hyper-realistic photo only.
`;



// Theme configurations with enhanced prompts
export const ENHANCED_THEMES = {
  nature: {
    id: 'nature',
    name: 'Nature & Outdoors',
    description: 'Scenic outdoor settings with natural beauty',
    icon: '🌿',
    prompt: 'in a stunning natural outdoor setting - hiking on a scenic mountain trail with beautiful vista, standing by a pristine lake at golden hour, or walking through a lush forest. Natural sunlight, breathtaking landscape background, adventure-ready but stylish outfit.',
    category: 'lifestyle',
    popularity: 95
  },
  sports: {
    id: 'sports',
    name: 'Sports & Fitness',
    description: 'Athletic and fitness-focused environments',
    icon: '🏃‍♂️',
    prompt: 'in an active, athletic environment - at a modern fitness gym, on a tennis court, jogging through a park, or at a sports facility. Wearing appropriate athletic wear, showing fitness and energy, dynamic but approachable pose.',
    category: 'lifestyle',
    popularity: 88
  },
  formal: {
    id: 'formal',
    name: 'Professional & Elegant',
    description: 'Sophisticated business and formal settings',
    icon: '👔',
    prompt: 'in an elegant, sophisticated setting - at an upscale restaurant, business district, art gallery, or formal event venue. Wearing sharp, well-fitted formal attire, confident posture, refined atmosphere with warm lighting.',
    category: 'professional',
    popularity: 82
  },
  travel: {
    id: 'travel',
    name: 'Travel & Adventure',
    description: 'Exciting destinations and travel experiences',
    icon: '✈️',
    prompt: 'at an iconic travel destination - in front of famous landmarks, exploring a vibrant city street, at a beautiful beach resort, or discovering cultural sites. Stylish travel outfit, sense of adventure and worldliness.',
    category: 'lifestyle',
    popularity: 90
  },
  casual: {
    id: 'casual',
    name: 'Casual & Relaxed',
    description: 'Comfortable everyday social settings',
    icon: '☕',
    prompt: 'in a relaxed, trendy everyday setting - at a cozy coffee shop, urban park, bookstore, or modern casual dining spot. Comfortable but stylish casual wear, approachable and friendly demeanor, warm inviting atmosphere.',
    category: 'lifestyle',
    popularity: 85
  },
  adventure: {
    id: 'adventure',
    name: 'Adventure Sports',
    description: 'Thrilling outdoor activities and extreme sports',
    icon: '🧗‍♂️',
    prompt: 'engaged in exciting outdoor activities - rock climbing with safety gear, surfing at a beautiful beach, skiing on mountain slopes, or exploring scenic hiking trails. Action-oriented but safe, showing adventurous spirit and confidence.',
    category: 'adventure',
    popularity: 75
  },
  creative: {
    id: 'creative',
    name: 'Creative & Artistic',
    description: 'Artistic environments and creative spaces',
    icon: '🎨',
    prompt: 'in an artistic, creative environment - at an art studio, music venue, creative workspace, or cultural event. Expressing creativity and passion, inspiring and cultured atmosphere.',
    category: 'creative',
    popularity: 70
  },
  foodie: {
    id: 'foodie',
    name: 'Food & Dining',
    description: 'Culinary experiences and food culture',
    icon: '🍽️',
    prompt: 'at a trendy restaurant, food market, cooking class, or wine tasting event. Enjoying culinary experiences, sophisticated taste, warm social setting with great food and ambiance.',
    category: 'lifestyle',
    popularity: 78
  }
} as const;

// Validation rules
export const VALIDATION_RULES = {
  image: {
    minSize: 50 * 1024, // 50KB
    maxSize: APP_CONFIG.imageGeneration.maxFileSize,
    allowedTypes: APP_CONFIG.imageGeneration.supportedFormats,
    minDimensions: { width: 200, height: 200 },
    maxDimensions: { width: 4096, height: 4096 }
  },
  themes: {
    minSelection: 1,
    maxSelection: APP_CONFIG.imageGeneration.maxThemes,
    allowedThemes: Object.keys(ENHANCED_THEMES)
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  noFile: 'Please upload an image file',
  noThemes: 'Please select at least one theme',
  tooManyThemes: `Maximum ${APP_CONFIG.imageGeneration.maxThemes} themes allowed`,
  invalidFileType: 'File must be an image (JPG, PNG, WebP)',
  fileTooLarge: `Image file too large. Maximum size is ${APP_CONFIG.imageGeneration.maxFileSize / (1024 * 1024)}MB`,
  fileTooSmall: 'Image file is too small. Please upload a higher quality image',
  noFaceDetected: 'No face detected in the image. Please upload a photo that clearly shows your face',
  multipleFaces: 'Multiple faces detected. Please upload a photo with only yourself visible',
  faceNotClear: 'Face is not clear enough. Please upload a clearer photo with better lighting',
  generationFailed: 'Failed to generate AI image. Please try again',
  storageFailed: 'Failed to save generated image',
  rateLimited: 'Too many requests. Please wait a moment before trying again',
  serverError: 'Internal server error. Please try again later'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  photoUploaded: 'Photo uploaded successfully!',
  imagesGenerated: (count: number) => `Successfully generated ${count} AI image${count !== 1 ? 's' : ''}!`,
  imageDownloaded: 'Image downloaded successfully!',
  profileUpdated: 'Profile updated successfully!'
} as const;
