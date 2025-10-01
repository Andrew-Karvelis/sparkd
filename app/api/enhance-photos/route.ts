import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { Buffer } from 'buffer';
import { validateProfilePhoto } from "@/lib/face-detection";
import { APP_CONFIG, ENHANCED_THEMES, ERROR_MESSAGES, HYPER_REALISTIC_PROMPT } from "@/lib/config";
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from '@/lib/prisma';
import { useState } from "react";


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
    const session = await getServerSession(authOptions)

    if (!session) return new Response("Unauthorized", { status: 401 })

    // check credits before generating
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { credits: true, id: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const creditsRequired = selectedThemes.length; // or 1 per enhancement
    if (user.credits < creditsRequired) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

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



    const generatedImages: { theme: string; imageUrl: string; success: boolean; method: string }[] = [];
    const errors: { theme: string; error: string }[] = [];

    for (const theme of selectedThemes) {
      try {
        const themeConfig = ENHANCED_THEMES[theme as keyof typeof ENHANCED_THEMES];
        if (!themeConfig) {
          errors.push({ theme, error: "Unknown theme" });
          continue;
        }

        console.log(`Generating hyper-realistic ${theme} image...`);

        const editPrompt = `
${HYPER_REALISTIC_PROMPT}

Generate a **hyper-realistic, photographic-quality** image. Replace ONLY the background/environment with a scene that matches this theme:
${themeConfig.prompt}

Strict rules:
- Do NOT alter the person’s face, body, clothing, or likeness
- Preserve exact identity (facial structure, hair, skin, eyes, proportions)
- Must look like a RAW DSLR photograph, not AI-art
`;


        const editResp = await openai.images.edit({
          model: APP_CONFIG.imageGeneration.editModel || "gpt-image-1",
          prompt: editPrompt,
          image: await toFile(processedImageBuffer, "image.png", { type: "image/png" }),
          size: APP_CONFIG.imageGeneration.imageSize,
          n: 1,
        });
        console.log("OpenAI edit response:", editResp);

        if (!editResp.data?.length) {
          console.error("Empty OpenAI response:", JSON.stringify(editResp, null, 2));
          errors.push({ theme, error: "No image returned" });
          continue;
        }

        const result = editResp.data[0];
        const imageUrl =
          result.url ||
          (result.b64_json ? `data:image/png;base64,${result.b64_json}` : null);

        if (!imageUrl) {
          errors.push({ theme, error: "No usable image (url/b64 missing)" });
          continue;
        }


        // ✅ Deduct only on success
        await prisma.user.update({
          where: { id: user.id },
          data: { credits: { decrement: 1 } },
        });

        const savedImage = await prisma.gallery.create({
          data: {
            url: imageUrl,
            userId: user.id,
          },
        });

        if (editResp.data && Array.isArray(editResp.data)) {
          editResp.data.forEach((result, i) => {
            const imageUrl =
              result.url ||
              (result.b64_json ? `data:image/png;base64,${result.b64_json}` : null);

            if (!imageUrl) {
              errors.push({ theme, error: "No usable image (url/b64 missing)" });
              return;
            }


            generatedImages.push({
              theme,
              imageUrl: savedImage.url,
              success: true,
              method: `gpt-image-1 edit (background replacement) [variation ${i + 1}]`,
            });
          });
        } else {
          errors.push({ theme, error: "No data array returned from OpenAI" });
        }



      } catch (themeError: any) {
        console.error(`Error generating image for theme ${theme}:`, themeError);
        errors.push({ theme, error: themeError.message || "Failed to generate image" });
      }

      // Rate limit safety
      if (selectedThemes.indexOf(theme) < selectedThemes.length - 1) {
        await new Promise(res => setTimeout(res, APP_CONFIG.imageGeneration.requestDelay));
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
