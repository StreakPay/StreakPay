let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const globalForPrisma = globalThis as unknown as { prisma: any };
    db = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
  } catch {
    console.warn("Prisma client not available. Run `npx prisma generate` after installing prisma.");
    db = null;
  }
}

export { db };
