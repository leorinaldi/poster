import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const models = await prisma.leonardoModel.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    })

    return NextResponse.json(models)
  } catch (error) {
    console.error("Error fetching Leonardo models:", error)
    return NextResponse.json(
      { error: "Failed to fetch Leonardo models" },
      { status: 500 }
    )
  }
}
