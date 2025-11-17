import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const styleControlParam = searchParams.get("styleControlParam")

    if (!styleControlParam) {
      return NextResponse.json(
        { error: "Style control parameter is required" },
        { status: 400 }
      )
    }

    const styleControls = await prisma.leonardoStyleControl.findMany({
      where: {
        styleControlParam: styleControlParam,
      },
      orderBy: { displayOrder: "asc" },
    })

    return NextResponse.json(styleControls)
  } catch (error) {
    console.error("Error fetching style controls:", error)
    return NextResponse.json(
      { error: "Failed to fetch style controls" },
      { status: 500 }
    )
  }
}
