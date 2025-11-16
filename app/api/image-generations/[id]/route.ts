import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import OpenAI from "openai"

// Lazy instantiation to avoid build-time errors
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
  })
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
    const { prompt, numberOfImages } = await req.json()

    // Validation
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (!numberOfImages || numberOfImages < 1 || numberOfImages > 10) {
      return NextResponse.json(
        { error: "Number of images must be between 1 and 10" },
        { status: 400 }
      )
    }

    // Verify the request belongs to the user before updating
    const existingRequest = await prisma.imageGenerationRequest.findUnique({
      where: { id: requestId },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Image generation request not found" },
        { status: 404 }
      )
    }

    if (existingRequest.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 })
    }

    const openai = getOpenAI()

    // Generate a new name if the prompt changed
    let generatedName = existingRequest.name
    if (prompt !== existingRequest.prompt) {
      const namePrompt = `Create a brief, descriptive title (20 characters or less) for images that will be generated from this prompt: ${prompt.slice(0, 200)}`

      const nameResponse = await openai.chat.completions.create({
        model: "grok-4-fast-non-reasoning",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates very short, descriptive titles. Return ONLY the title text, nothing else. Maximum 20 characters."
          },
          {
            role: "user",
            content: namePrompt
          }
        ],
        stream: false,
      })

      generatedName = (nameResponse.choices[0]?.message?.content || "Generated Image").slice(0, 50)
    }

    // Delete all existing generated images for this request
    await prisma.generatedImage.deleteMany({
      where: { imageGenerationRequestId: requestId },
    })

    // Generate new images using Grok
    const imageApiResponse = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2-image",
        prompt: prompt,
        n: parseInt(numberOfImages),
        response_format: "url",
      }),
    })

    if (!imageApiResponse.ok) {
      const errorText = await imageApiResponse.text()
      throw new Error(`Image generation failed: ${errorText}`)
    }

    const imageResponse = await imageApiResponse.json()

    // Create new GeneratedImage records for each image URL
    await Promise.all(
      imageResponse.data.map((image: { url: string }) =>
        prisma.generatedImage.create({
          data: {
            imageGenerationRequestId: requestId,
            imageUrl: image.url || "",
          },
        })
      )
    )

    // Update the image generation request
    const updatedRequest = await prisma.imageGenerationRequest.update({
      where: { id: requestId },
      data: {
        name: generatedName,
        prompt: prompt,
        numberOfImages: parseInt(numberOfImages),
      },
      include: {
        generatedImages: true,
      },
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Error updating image generation request:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update image generation" },
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
    const imageGenerationRequest = await prisma.imageGenerationRequest.findUnique({
      where: { id: requestId },
    })

    if (!imageGenerationRequest) {
      return NextResponse.json(
        { error: "Image generation request not found" },
        { status: 404 }
      )
    }

    if (imageGenerationRequest.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 })
    }

    // Delete the request (cascade will delete all generated images)
    await prisma.imageGenerationRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image generation request:", error)
    return NextResponse.json(
      { error: "Failed to delete image generation request" },
      { status: 500 }
    )
  }
}
