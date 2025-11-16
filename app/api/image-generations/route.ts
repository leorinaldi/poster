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

    const imageGenerationRequests = await prisma.imageGenerationRequest.findMany({
      where: {
        projectId: parseInt(projectId),
        userId: session.user.id,
      },
      include: {
        generatedImages: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(imageGenerationRequests)
  } catch (error) {
    console.error("Error fetching image generation requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch image generation requests" },
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
    const { projectId, prompt, numberOfImages } = await req.json()

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

    const openai = getOpenAI()

    // Generate a short name for the request using Grok
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

    const generatedName = (nameResponse.choices[0]?.message?.content || "Generated Image").slice(0, 50)

    // Create the image generation request record
    const imageGenerationRequest = await prisma.imageGenerationRequest.create({
      data: {
        projectId: parseInt(projectId),
        userId: session.user.id,
        name: generatedName,
        prompt: prompt,
        numberOfImages: parseInt(numberOfImages),
      },
    })

    // Generate images using Grok (direct API call since OpenAI SDK images API doesn't work with custom baseURL)
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

    // Create GeneratedImage records for each image URL
    const generatedImages = await Promise.all(
      imageResponse.data.map((image: any) =>
        prisma.generatedImage.create({
          data: {
            imageGenerationRequestId: imageGenerationRequest.id,
            imageUrl: image.url || "",
          },
        })
      )
    )

    // Return the request with all generated images
    const result = await prisma.imageGenerationRequest.findUnique({
      where: { id: imageGenerationRequest.id },
      include: {
        generatedImages: true,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating image generation:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate images" },
      { status: 500 }
    )
  }
}
