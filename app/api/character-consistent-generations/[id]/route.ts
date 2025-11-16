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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await params
    const requestId = parseInt(id)

    // Parse multipart form data
    const formData = await req.formData()
    const prompt = formData.get("prompt") as string
    const strengthType = formData.get("strengthType") as string
    const modelId = formData.get("modelId") as string | null
    const width = parseInt(formData.get("width") as string)
    const height = parseInt(formData.get("height") as string)
    const photoReal = formData.get("photoReal") === "true"
    const alchemy = formData.get("alchemy") === "true"
    const referenceImage = formData.get("referenceImage") as File | null

    // Validation
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (!["Low", "Mid", "High"].includes(strengthType)) {
      return NextResponse.json(
        { error: "Invalid strength type" },
        { status: 400 }
      )
    }

    // Verify the request belongs to the user
    const existingRequest = await prisma.characterConsistentImageRequest.findUnique({
      where: { id: requestId },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Character consistent image request not found" },
        { status: 404 }
      )
    }

    if (existingRequest.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 })
    }

    let leonardoImageId = existingRequest.leonardoImageId
    let referenceImageUrl = existingRequest.referenceImageUrl

    // If a new reference image was provided, upload it
    if (referenceImage) {
      // Upload to Vercel Blob for permanent storage
      const blob = await put(`character-reference/${session.user.id}/${Date.now()}-${referenceImage.name}`, referenceImage, {
        access: "public",
      })
      referenceImageUrl = blob.url

      // Get presigned URL from Leonardo
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
      const { id: newLeonardoImageId, url: presignedUrl, fields } = initImageData.uploadInitImage

      // Upload image to S3 using presigned URL
      const uploadFormData = new FormData()
      const parsedFields = JSON.parse(fields)

      Object.entries(parsedFields).forEach(([key, value]) => {
        uploadFormData.append(key, value as string)
      })

      uploadFormData.append("file", referenceImage)

      const uploadResponse = await fetch(presignedUrl, {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadResponse.ok && uploadResponse.status !== 204) {
        throw new Error(`Failed to upload image to S3: ${uploadResponse.statusText}`)
      }

      leonardoImageId = newLeonardoImageId
    }

    // Generate a new name if the prompt changed
    const openai = getOpenAI()
    let generatedName = existingRequest.name

    if (prompt !== existingRequest.prompt) {
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

      generatedName = (
        nameResponse.choices[0]?.message?.content || "Character Image"
      ).slice(0, 50)
    }

    // Delete all existing generated images
    await prisma.characterConsistentGeneratedImage.deleteMany({
      where: { characterConsistentImageRequestId: requestId },
    })

    // Fetch model configuration from database
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

    // Generate new images with Leonardo using Character Reference
    // Build the request body conditionally
    const requestBody: any = {
      height: height,
      width: width,
      modelId: leonardoModel.modelId,
      prompt: prompt,
      photoReal: photoReal,
      alchemy: photoReal, // Alchemy must match PhotoReal (API requirement)
      num_images: 1,
      controlnets: [
        {
          initImageId: leonardoImageId,
          initImageType: "UPLOADED",
          preprocessorId: leonardoModel.preprocessorId,
          strengthType: strengthType,
        },
      ],
    }

    // Only include photoRealVersion when photoReal is true
    if (photoReal) {
      requestBody.photoRealVersion = leonardoModel.photoRealVersion
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

    // Poll for completion
    const generatedImages = await pollGenerationStatus(generationId)

    // Store generated images
    await Promise.all(
      generatedImages.map((image: any) =>
        prisma.characterConsistentGeneratedImage.create({
          data: {
            characterConsistentImageRequestId: requestId,
            imageUrl: image.url,
          },
        })
      )
    )

    // Update the request
    const updatedRequest = await prisma.characterConsistentImageRequest.update({
      where: { id: requestId },
      data: {
        name: generatedName,
        prompt: prompt,
        referenceImageUrl: referenceImageUrl,
        leonardoImageId: leonardoImageId,
        strengthType: strengthType,
        modelId: leonardoModel.modelId,
        width: width,
        height: height,
        photoReal: photoReal,
        alchemy: photoReal, // Alchemy must match PhotoReal (API requirement)
      },
      include: {
        characterConsistentGeneratedImages: true,
      },
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Error updating character consistent generation:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update character consistent generation",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await params
    const requestId = parseInt(id)

    // Verify the request belongs to the user before deleting
    const request = await prisma.characterConsistentImageRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return NextResponse.json(
        { error: "Character consistent image request not found" },
        { status: 404 }
      )
    }

    if (request.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 })
    }

    // Delete the request (cascade will delete all generated images)
    await prisma.characterConsistentImageRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting character consistent generation:", error)
    return NextResponse.json(
      { error: "Failed to delete character consistent generation" },
      { status: 500 }
    )
  }
}

// Extend the timeout for this route
export const maxDuration = 180 // 3 minutes
