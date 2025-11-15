import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prismaAuth: PrismaClient }

export const prismaAuth =
  globalForPrisma.prismaAuth ||
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaAuth = prismaAuth
