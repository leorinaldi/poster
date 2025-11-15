import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default tool
  const tool = await prisma.tool.upsert({
    where: { name: 'Video clip finder' },
    update: {},
    create: {
      name: 'Video clip finder',
      description: 'Find and extract video clips',
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
