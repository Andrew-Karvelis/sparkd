import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { Buffer } from 'buffer';
import { validateProfilePhoto } from "@/lib/face-detection";
import { APP_CONFIG, ENHANCED_THEMES, ERROR_MESSAGES, HYPER_REALISTIC_PROMPT } from "@/lib/config";

// Ensure this route runs on the Node.js runtime (native modules allowed)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const selectedThemes = JSON.parse(formData.get("themes") as string || "[]");

    // Optional client-provided mask for background (preferred)
    const uploadedMask = formData.get("mask") as File | null;
    // Validation
    if (!file) {
      return NextResponse.json({ error: ERROR_MESSAGES.noFile }, { status: 400 });
    }
    if (!selectedThemes.length) {
      return NextResponse.json({ error: ERROR_MESSAGES.noThemes }, { status: 400 });
    }
    if (selectedThemes.length > APP_CONFIG.imageGeneration.maxThemes) {
      return NextResponse.json({ error: ERROR_MESSAGES.tooManyThemes }, { status: 400 });
    }

    const sharp = (await import("sharp")).default;

    const processedImageBuffer: Buffer = await sharp(
      Buffer.from(await file.arrayBuffer()) // ✅ force Node Buffer
    )
      // Preserve full image without cropping: pad to square instead of cover
      .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Check OpenAI upload size limit (4MB)
    if (processedImageBuffer.length > 4 * 1024 * 1024) {
      return NextResponse.json({
        error: "Image too large for processing. Please use a smaller image.",
      }, { status: 400 });
    }

    const base64DataUrl = `data:image/png;base64,${processedImageBuffer.toString("base64")}`;

    // Face validation
    const faceValidation = await validateProfilePhoto(base64DataUrl);
    if (!faceValidation.isValid) {
      return NextResponse.json({
        error: faceValidation.message,
        faceDetection: faceValidation.result,
      }, { status: 400 });
    }

    // Get mask: prefer client-provided; otherwise attempt server-side background removal, else fallback to no mask
    let maskBuffer: Buffer | null = null;
    try {
      const sharpLocal = (await import("sharp")).default;

      if (uploadedMask) {
        console.log("Using client-provided mask");
        const maskArrayBuffer = await uploadedMask.arrayBuffer();
        maskBuffer = Buffer.from(maskArrayBuffer);
        // Normalize to target size and format
        maskBuffer = await sharpLocal(maskBuffer).resize(1024, 1024).png().toBuffer();
        // Feather 1px to avoid halos
        maskBuffer = await sharpLocal(maskBuffer).blur(1).toBuffer();
      } else {
        console.log("No client mask. Attempting server-side background removal...");
        const { removeBackground } = await import("@imgly/background-removal-node");
        const rawMask = await removeBackground(processedImageBuffer, {
          output: { format: 'image/png', quality: 100 },
        });

        if (Buffer.isBuffer(rawMask)) {
          maskBuffer = rawMask as Buffer;
        } else if (rawMask instanceof Uint8Array) {
          maskBuffer = Buffer.from(rawMask);
        } else if (typeof (rawMask as any)?.arrayBuffer === 'function') {
          const ab = await (rawMask as any).arrayBuffer();
          maskBuffer = Buffer.from(ab);
        } else {
          throw new Error("Unexpected mask type returned from background removal");
        }

        maskBuffer = await sharpLocal(maskBuffer).resize(1024, 1024).png().toBuffer();
        maskBuffer = await sharpLocal(maskBuffer).blur(1).toBuffer();
      }
    } catch (maskErr: any) {
      console.warn("Mask unavailable (client + server attempts failed):", maskErr?.message || maskErr);
      maskBuffer = null;
    }

    const generatedImages: { theme: string; imageUrl: string; success: boolean; method: string }[] = [];
    const errors: { theme: string; error: string }[] = [];

    for (const theme of selectedThemes) {
      try {
        const themeConfig = ENHANCED_THEMES[theme as keyof typeof ENHANCED_THEMES];
        if (!themeConfig) {
          errors.push({ theme, error: "Unknown theme" });
          continue;
        }

        console.log(`Generating themed ${theme} image via gpt-image-1 edit...`);

        // Require a mask so we only change background and preserve the subject exactly
        if (!maskBuffer) {
          errors.push({ theme, error: "No mask available (enable client-side mask generation to preserve likeness)" });
          continue;
        }

        // Combine global hyper-realistic guidance with theme
        const editPrompt = `${HYPER_REALISTIC_PROMPT}\n\nReplace ONLY the background/environment with a hyper-realistic scene that fits this theme:\n${themeConfig.prompt}\n\nStrict rules:\n- Do NOT alter the person’s face, skin tone, eye color, hair color/length, body or clothing\n- Keep the original person exactly as in the uploaded photo\n- Ultra-realistic, photographic quality (not AI-rendered look)`;

        const featheredMask = await (await import("sharp")).default(maskBuffer).blur(1).toBuffer();

        // When building the edit request:
        const editResp = await openai.images.edit({
          model: APP_CONFIG.imageGeneration.editModel || "gpt-image-1",
          prompt: editPrompt,
          image: new File([new Uint8Array(processedImageBuffer)], "image.png", { type: "image/png" }),
          mask: new File([new Uint8Array(featheredMask)], "mask.png", { type: "image/png" }),
          size: APP_CONFIG.imageGeneration.imageSize,
          n: 3, // generate 3 variations per theme
        });



        // let imageUrl = editResp.data?.[0]?.url as string | undefined;
        // if (!imageUrl && editResp.data?.[0]?.b64_json) {
        //   imageUrl = `data:image/png;base64,${editResp.data[0].b64_json}`;
        // }

        // if (!imageUrl) {
        //   errors.push({ theme, error: "gpt-image-1 returned no image" });
        //   continue;
        // }

        // generatedImages.push({
        //   theme,
        //   imageUrl,
        //   success: true,
        //   method: "gpt-image-1 edit (background replacement)"
        // });

        if (editResp.data && Array.isArray(editResp.data)) {
          editResp.data.forEach((result, i) => {
            const imageUrl =
              result.url ||
              (result.b64_json ? `data:image/png;base64,${result.b64_json}` : null);

            if (imageUrl) {
              generatedImages.push({
                theme,
                imageUrl,
                success: true,
                method: `gpt-image-1 edit (background replacement) [variation ${i + 1}]`,
              });
            }
          });
        }


      } catch (themeError: any) {
        console.error(`Error generating image for theme ${theme}:`, themeError);

        let errorMessage = "Failed to generate image";
        if (themeError.error?.message) errorMessage = themeError.error.message;
        else if (themeError.message) errorMessage = themeError.message;

        errors.push({ theme, error: errorMessage });
      }

      // Delay between requests (rate limit safety)
      if (selectedThemes.indexOf(theme) < selectedThemes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, APP_CONFIG.imageGeneration.requestDelay));
      }
    }

    const response = {
      success: generatedImages.length > 0,
      totalRequested: selectedThemes.length,
      successfulGenerations: generatedImages.length,
      failedGenerations: errors.length,
      images: generatedImages,
      errors: errors.length > 0 ? errors : undefined,
      approach: "Inpainting (background replacement)",
      note: "Original likeness preserved; only background changed"
    };

    console.log("Inpainting photo generation completed:", {
      success: response.success,
      successfulGenerations: response.successfulGenerations,
      failedGenerations: response.failedGenerations,
      methods: generatedImages.map(img => img.method),
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Photo Enhancement Error:", error);
    return NextResponse.json({
      error: "Failed to enhance photos",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}
