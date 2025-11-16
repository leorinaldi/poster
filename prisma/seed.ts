import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create Text summarizer tool
  const textSummarizerTool = await prisma.tool.upsert({
    where: { name: 'Text summarizer' },
    update: {},
    create: {
      name: 'Text summarizer',
      description: 'Summarize text content',
    },
  })

  console.log('Created tool:', textSummarizerTool)

  // Create Text to Image tool
  const textToImageTool = await prisma.tool.upsert({
    where: { name: 'Text to Image' },
    update: {},
    create: {
      name: 'Text to Image',
      description: 'Generate images from text prompts using AI',
    },
  })

  console.log('Created tool:', textToImageTool)

  // Create Character Consistent Image tool
  const characterConsistentImageTool = await prisma.tool.upsert({
    where: { name: 'Character Consistent Image' },
    update: {},
    create: {
      name: 'Character Consistent Image',
      description: 'Generate images with consistent character appearance using reference image',
    },
  })

  console.log('Created tool:', characterConsistentImageTool)

  // Create Leonardo AI models for character-consistent image generation
  const models = [
    {
      name: 'Leonardo Lightning XL',
      modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Leonardo Kino XL',
      modelId: 'aa77f04e-3eec-4034-9c07-d0f619684628',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Leonardo Vision XL',
      modelId: '5c232a9e-9061-4777-980a-ddc8e65647c6',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      isActive: true,
      displayOrder: 3,
    },
    {
      name: 'Leonardo Anime XL',
      modelId: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      isActive: true,
      displayOrder: 4,
    },
  ]

  for (const model of models) {
    const leonardoModel = await prisma.leonardoModel.upsert({
      where: { modelId: model.modelId },
      update: {},
      create: model,
    })
    console.log('Created Leonardo model:', leonardoModel.name)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
