import { NextResponse } from "next/server";
import OpenAI from "openai";
import { validateProfilePhoto } from "@/lib/face-detection";
import { APP_CONFIG, ENHANCED_THEMES, ERROR_MESSAGES } from "@/lib/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * BEST APPROACH: Use GPT-4o Vision to create extremely detailed, realistic prompts
 * that focus on preserving the person's exact appearance while changing the setting
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const selectedThemes = JSON.parse(formData.get("themes") as string || "[]");

    // Validation
    if (!file) {
      return NextResponse.json({ error: ERROR_MESSAGES.noFile }, { status: 400 });
    }

    if (!selectedThemes.length) {
      return NextResponse.json({ error: ERROR_MESSAGES.noThemes }, { status: 400 });
    }

    // Convert image to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;
    const base64DataUrl = `data:${mimeType};base64,${base64Image}`;

    // Face validation
    const faceValidation = await validateProfilePhoto(base64DataUrl);
    if (!faceValidation.isValid) {
      return NextResponse.json({ 
        error: faceValidation.message,
        faceDetection: faceValidation.result
      }, { status: 400 });
    }

    console.log("Creating ultra-realistic prompts with GPT-4o...");

    const generatedImages: { theme: string; imageUrl: string; success: boolean }[] = [];
    const errors: { theme: string; error: string }[] = [];

    // Process each theme with ultra-detailed analysis
    for (const theme of selectedThemes) {
      try {
        const themeConfig = ENHANCED_THEMES[theme as keyof typeof ENHANCED_THEMES];
        if (!themeConfig) {
          errors.push({ theme, error: "Unknown theme" });
          continue;
        }

        console.log(`Creating ultra-realistic ${theme} image...`);

        // Step 1: Get extremely detailed analysis of the person
        const detailedAnalysis = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a professional photographer creating a dating profile photo. Analyze this person's photo and create an ultra-realistic prompt for DALL-E 3.

ANALYZE THESE DETAILS:
1. FACIAL FEATURES: Exact face shape, jawline, cheekbones, nose shape, lip shape, eye color and shape, eyebrow style
2. HAIR: Exact color, texture, style, length, how it falls
3. SKIN: Tone, complexion, any distinctive features
4. AGE & GENDER: Apparent age range and gender presentation
5. EXPRESSION: Current facial expression and mood
6. BODY: Visible body type, posture, clothing style
7. CURRENT SETTING: What's the current background/environment

Then create a DALL-E 3 prompt that will generate a photo of this EXACT SAME PERSON in this new setting: ${themeConfig.prompt}

REQUIREMENTS FOR THE PROMPT:
- Must specify this is a "photograph" not an illustration
- Include "realistic," "photographic," "natural lighting"
- Specify exact physical details to maintain their appearance
- Mention "dating profile photo" for appropriate style
- Include "professional photography" for quality
- Add "natural skin texture" and "realistic details"
- Specify the new environment/setting clearly

Format your response as:
PERSON ANALYSIS: [detailed description]
DALL-E PROMPT: [the exact prompt to use]`
                },
                {
                  type: "image_url",
                  image_url: { url: base64DataUrl }
                }
              ]
            }
          ],
          max_tokens: 600
        });

        const analysisContent = detailedAnalysis.choices[0]?.message?.content || "";
        
        // Extract the DALL-E prompt from the response
        let dallePrompt = "";
        const promptMatch = analysisContent.match(/DALL-E PROMPT:\s*(.*?)(?:\n|$)/);
        if (promptMatch) {
          dallePrompt = promptMatch[1].trim();
        } else {
          // Fallback: use the entire response as prompt
          dallePrompt = analysisContent;
        }

        // Enhance the prompt for maximum realism
        const enhancedPrompt = `${dallePrompt}

CRITICAL REALISM REQUIREMENTS:
- This must be a real photograph, not AI art or illustration
- Natural skin texture with realistic pores and details
- Authentic lighting with natural shadows and highlights
- Real fabric textures and materials
- Genuine human expression and body language
- Professional dating profile photography style
- Shot with a high-end camera with shallow depth of field
- Natural color grading and realistic saturation
- No artificial or cartoon-like qualities whatsoever
- Must look indistinguishable from a real photo taken by a professional photographer`;

        console.log(`Generating ultra-realistic image for ${theme}...`);

        // Generate with DALL-E 3 using the enhanced prompt
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          size: "1024x1024",
          quality: "hd",
          style: "natural", // This is key for realism
          n: 1
        });

        const imageUrl = imageResponse.data?.[0]?.url;
        
        if (imageUrl) {
          generatedImages.push({
            theme,
            imageUrl,
            success: true
          });
          console.log(`Successfully generated ultra-realistic image for theme: ${theme}`);
        } else {
          errors.push({ theme, error: "No image URL returned" });
        }

      } catch (themeError: any) {
        console.error(`Error generating ultra-realistic image for theme ${theme}:`, themeError);
        
        let errorMessage = "Failed to generate realistic image";
        if (themeError.error?.message) {
          errorMessage = themeError.error.message;
        } else if (themeError.message) {
          errorMessage = themeError.message;
        }
        
        errors.push({ theme, error: errorMessage });
      }

      // Longer delay for better quality results
      if (selectedThemes.indexOf(theme) < selectedThemes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const response = {
      success: generatedImages.length > 0,
      totalRequested: selectedThemes.length,
      successfulGenerations: generatedImages.length,
      failedGenerations: errors.length,
      images: generatedImages,
      errors: errors.length > 0 ? errors : undefined,
      approach: "GPT-4o Ultra-Detailed Analysis + DALL-E 3 Realism-Focused",
      note: "Optimized for maximum realism and person preservation"
    };

    console.log('Ultra-realistic generation completed:', {
      success: response.success,
      successfulGenerations: response.successfulGenerations,
      failedGenerations: response.failedGenerations
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Ultra-Realistic Enhancement Error:", error);
    
    return NextResponse.json({
      error: "Failed to create ultra-realistic enhanced photos",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
