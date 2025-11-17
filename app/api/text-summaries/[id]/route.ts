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
    const summaryId = parseInt(id)
    const { projectId, website, textToSummarize, targetWordCount } = await req.json()

    // Validation: at least one of website or textToSummarize must be provided
    if (!website && !textToSummarize) {
      return NextResponse.json(
        { error: "Either website or text to summarize must be provided" },
        { status: 400 }
      )
    }

    // Verify the summary belongs to the user
    const existingSummary = await prisma.textSummary.findUnique({
      where: { id: summaryId },
    })

    if (!existingSummary) {
      return NextResponse.json(
        { error: "Text summary not found" },
        { status: 404 }
      )
    }

    if (existingSummary.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 })
    }

    // Generate a new short name for the summary using Grok
    let namePrompt = "Create a brief, descriptive title (20 characters or less) for this content: "
    if (website && textToSummarize) {
      namePrompt += `Website: ${website}, Text: ${textToSummarize.slice(0, 200)}`
    } else if (website) {
      namePrompt += `Website: ${website}`
    } else {
      namePrompt += textToSummarize?.slice(0, 200) || ""
    }

    const openai = getOpenAI()
    const nameResponse = await openai.chat.completions.create({
      model: "grok-4-fast-reasoning",
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

    const generatedName = (nameResponse.choices[0]?.message?.content || "Summary").slice(0, 50)

    // Build prompt for Grok AI
    let prompt = ``

    if (website && textToSummarize) {
      prompt = `Use web search to access and read the content from this website: ${website}

After reading the website content, also consider this additional text:
${textToSummarize}

Create a comprehensive summary that incorporates insights from both the website and the additional text. Target approximately ${targetWordCount} words.`
    } else if (website) {
      prompt = `Use web search to access and read the full content from this website: ${website}

Create a detailed summary of the website's content. Target approximately ${targetWordCount} words.`
    } else {
      prompt = `Please summarize the following text in approximately ${targetWordCount} words:

${textToSummarize}`
    }

    // Determine search mode: 'on' if website provided, 'auto' otherwise
    const searchMode = website ? 'on' : 'auto'

    // Call Grok AI to generate summary
    const response = await openai.chat.completions.create({
      model: "grok-4-fast-reasoning",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that creates concise, accurate summaries. When given a website URL, you MUST use web search to access and read the actual content from that website before summarizing. Do not make assumptions or invent any material - only summarize the information actually provided or found through web search. Stick strictly to the content available. Aim for the target word count specified by the user."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false,
      search_parameters: {
        mode: searchMode,
        returnCitations: true,
        sources: [{ type: 'web' }]
      }
    } as any)

    const summary = response.choices[0]?.message?.content || "Failed to generate summary"

    // Update the text summary
    const updatedTextSummary = await prisma.textSummary.update({
      where: { id: summaryId },
      data: {
        name: generatedName,
        website: website || null,
        textToSummarize: textToSummarize || null,
        targetWordCount: targetWordCount ? parseInt(targetWordCount) : null,
        summary,
      }
    })

    return NextResponse.json(updatedTextSummary)
  } catch (error) {
    console.error("Error updating text summary:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update summary" },
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
    const summaryId = parseInt(id)

    // Verify the summary belongs to the user before deleting
    const summary = await prisma.textSummary.findUnique({
      where: { id: summaryId },
    })

    if (!summary) {
      return NextResponse.json(
        { error: "Text summary not found" },
        { status: 404 }
      )
    }

    if (summary.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 })
    }

    // Delete the summary
    await prisma.textSummary.delete({
      where: { id: summaryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting text summary:", error)
    return NextResponse.json(
      { error: "Failed to delete text summary" },
      { status: 500 }
    )
  }
}
