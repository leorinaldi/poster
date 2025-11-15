import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default tool
  const tool = await prisma.tool.upsert({
    where: { name: 'Text summarizer' },
    update: {},
    create: {
      name: 'Text summarizer',
      description: 'Summarize text content',
    },
  })

  console.log('Created tool:', tool)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
