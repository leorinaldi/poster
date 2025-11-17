import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { put } from "@vercel/blob"

// Lazy instantiation to avoid build-time errors
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
  })
}

// Helper function to poll Leonardo for generation completion
async function pollGenerationStatus(generationId: string, maxAttempts = 40): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
          accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to check generation status: ${response.statusText}`)
    }

    const data = await response.json()
    const generation = data.generations_by_pk

    if (generation.status === "COMPLETE") {
      return generation.generated_images
    }

    if (generation.status === "FAILED") {
      throw new Error("Image generation failed")
    }

    // Wait 3 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  throw new Error("Image generation timeout - please try again")
}

export async function GET(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    const requests = await prisma.characterConsistentImageRequest.findMany({
      where: {
        projectId: parseInt(projectId),
        userId: session.user.id,
      },
      include: {
        characterConsistentGeneratedImages: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching character consistent generations:", error)
    return NextResponse.json(
      { error: "Failed to fetch character consistent generations" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    // Parse multipart form data
    const formData = await req.formData()
    const projectId = formData.get("projectId") as string
    const prompt = formData.get("prompt") as string
    const strengthType = formData.get("strengthType") as string
    const modelId = formData.get("modelId") as string | null
    const width = parseInt(formData.get("width") as string)
    const height = parseInt(formData.get("height") as string)
    const numberOfImages = parseInt(formData.get("numberOfImages") as string) || 1
    const photoReal = formData.get("photoReal") === "true"
    const alchemy = formData.get("alchemy") === "true"
    const presetStyle = formData.get("presetStyle") as string | null
    const styleUuid = formData.get("styleUuid") as string | null
    const contrast = formData.get("contrast") ? parseFloat(formData.get("contrast") as string) : null
    const referenceImage = formData.get("referenceImage") as File

    // Validation
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (!referenceImage) {
      return NextResponse.json(
        { error: "Reference image is required" },
        { status: 400 }
      )
    }

    if (!["Low", "Mid", "High"].includes(strengthType)) {
      return NextResponse.json(
        { error: "Invalid strength type" },
        { status: 400 }
      )
    }

    // Step 1: Upload reference image to Vercel Blob for permanent storage
    const blob = await put(`character-reference/${session.user.id}/${Date.now()}-${referenceImage.name}`, referenceImage, {
      access: "public",
    })
    const referenceImageUrl = blob.url

    // Step 2: Get presigned URL from Leonardo
    const fileExtension = referenceImage.name.split(".").pop() || "jpg"
    const initImageResponse = await fetch(
      "https://cloud.leonardo.ai/api/rest/v1/init-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ extension: fileExtension }),
      }
    )

    if (!initImageResponse.ok) {
      const errorText = await initImageResponse.text()
      throw new Error(`Failed to get presigned URL: ${errorText}`)
    }

    const initImageData = await initImageResponse.json()
    const { id: leonardoImageId, url: presignedUrl, fields } = initImageData.uploadInitImage

    // Step 3: Upload image to S3 using presigned URL
    const uploadFormData = new FormData()
    const parsedFields = JSON.parse(fields)

    // Add all the fields from Leonardo
    Object.entries(parsedFields).forEach(([key, value]) => {
      uploadFormData.append(key, value as string)
    })

    // Add the file last
    uploadFormData.append("file", referenceImage)

    const uploadResponse = await fetch(presignedUrl, {
      method: "POST",
      body: uploadFormData,
    })

    if (!uploadResponse.ok && uploadResponse.status !== 204) {
      throw new Error(`Failed to upload image to S3: ${uploadResponse.statusText}`)
    }

    // Step 3: Generate a name using Grok
    const openai = getOpenAI()
    const namePrompt = `Create a brief, descriptive title (20 characters or less) for a character-consistent image generation with this prompt: ${prompt.slice(0, 200)}`

    const nameResponse = await openai.chat.completions.create({
      model: "grok-4-fast-non-reasoning",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates very short, descriptive titles. Return ONLY the title text, nothing else. Maximum 20 characters.",
        },
        {
          role: "user",
          content: namePrompt,
        },
      ],
      stream: false,
    })

    const generatedName = (
      nameResponse.choices[0]?.message?.content || "Character Image"
    ).slice(0, 50)

    // Step 4: Fetch model configuration from database
    let leonardoModel
    if (modelId) {
      // Use provided model
      leonardoModel = await prisma.leonardoModel.findUnique({
        where: { modelId: modelId },
      })
      if (!leonardoModel) {
        return NextResponse.json(
          { error: "Invalid model selected" },
          { status: 400 }
        )
      }
    } else {
      // Use default model (displayOrder = 1)
      leonardoModel = await prisma.leonardoModel.findFirst({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      })
      if (!leonardoModel) {
        return NextResponse.json(
          { error: "No active models available" },
          { status: 500 }
        )
      }
    }

    // Step 5: Create database record
    const characterRequest = await prisma.characterConsistentImageRequest.create({
      data: {
        projectId: parseInt(projectId),
        userId: session.user.id,
        name: generatedName,
        prompt: prompt,
        referenceImageUrl: referenceImageUrl,
        leonardoImageId: leonardoImageId,
        strengthType: strengthType,
        modelId: leonardoModel.modelId,
        width: width,
        height: height,
        photoReal: photoReal,
        alchemy: alchemy,
        numberOfImages: numberOfImages,
        presetStyle: presetStyle || null,
        styleUuid: styleUuid || null,
        contrast: contrast,
      },
    })

    // Step 6: Generate images with Leonardo using Character Reference
    // Build the request body conditionally based on model type
    const requestBody: any = {
      height: height,
      width: width,
      modelId: leonardoModel.modelId,
      prompt: prompt,
      alchemy: alchemy,
      num_images: numberOfImages,
      controlnets: [
        {
          initImageId: leonardoImageId,
          initImageType: "UPLOADED",
          preprocessorId: leonardoModel.preprocessorId,
          strengthType: strengthType,
        },
      ],
    }

    // Phoenix model uses styleUUID and contrast (no PhotoReal support)
    if (leonardoModel.styleControl === "styleUUID") {
      if (styleUuid) {
        requestBody.styleUUID = styleUuid
      }
      if (contrast !== null) {
        requestBody.contrast = contrast
      }
    } else {
      // SDXL models use PhotoReal and presetStyle
      requestBody.photoReal = photoReal

      if (photoReal) {
        requestBody.photoRealVersion = leonardoModel.photoRealVersion
      }

      if (presetStyle) {
        requestBody.presetStyle = presetStyle
      }
    }

    const generationResponse = await fetch(
      "https://cloud.leonardo.ai/api/rest/v1/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!generationResponse.ok) {
      const errorText = await generationResponse.text()
      throw new Error(`Image generation request failed: ${errorText}`)
    }

    const generationData = await generationResponse.json()
    const generationId = generationData.sdGenerationJob.generationId

    // Step 7: Poll for completion
    const generatedImages = await pollGenerationStatus(generationId)

    // Step 8: Store generated images
    await Promise.all(
      generatedImages.map((image: any) =>
        prisma.characterConsistentGeneratedImage.create({
          data: {
            characterConsistentImageRequestId: characterRequest.id,
            imageUrl: image.url,
          },
        })
      )
    )

    // Step 9: Return the complete request with images
    const result = await prisma.characterConsistentImageRequest.findUnique({
      where: { id: characterRequest.id },
      include: {
        characterConsistentGeneratedImages: true,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating character consistent generation:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate character consistent images",
      },
      { status: 500 }
    )
  }
}

// Extend the timeout for this route
export const maxDuration = 180 // 3 minutes
