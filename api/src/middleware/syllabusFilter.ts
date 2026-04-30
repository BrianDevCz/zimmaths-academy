import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Builds a Prisma 'where' clause that filters content by the user's active syllabus.
 * Content tagged BOTH always appears. Content tagged A or B only appears when it matches.
 */
export async function buildSyllabusFilter(userId?: string): Promise<any> {
  if (!userId) {
    // Not logged in — show only B content by default
    return { syllabus: { in: ["B", "BOTH"] } };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeSyllabus: true },
    });

    if (!user) {
      return { syllabus: { in: ["B", "BOTH"] } };
    }

    return {
      syllabus: { in: [user.activeSyllabus, "BOTH"] },
    };
  } catch {
    return { syllabus: { in: ["B", "BOTH"] } };
  }
}