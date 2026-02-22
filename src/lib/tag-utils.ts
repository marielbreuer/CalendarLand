import type { PrismaClient } from "@/generated/prisma/client";

export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

export function serializeTags(tags?: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

export function parseParticipants(
  participants: string | null
): { name: string; email: string }[] {
  if (!participants) return [];
  try {
    return JSON.parse(participants);
  } catch {
    return [];
  }
}

export function serializeParticipants(
  participants?: { name: string; email: string }[]
): string | null {
  if (!participants || participants.length === 0) return null;
  return JSON.stringify(participants);
}

/**
 * Sync tag registry: upsert tag names into the Tag table and update usage counts.
 * Call after creating/updating/deleting entities that have tags.
 *
 * @param prisma - Prisma client instance
 * @param addedTags - Tag names that were added (new tags on the entity)
 * @param removedTags - Tag names that were removed (old tags no longer on the entity)
 * @param userId - Owner user ID for per-user tag isolation
 */
export async function syncTagUsageCounts(
  prisma: PrismaClient,
  addedTags: string[],
  removedTags: string[],
  userId: string
): Promise<void> {
  const ops: Promise<unknown>[] = [];

  // Upsert added tags (create if new, increment usage)
  for (const name of addedTags) {
    ops.push(
      prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { name, userId, usageCount: 1 },
        update: { usageCount: { increment: 1 } },
      })
    );
  }

  // Decrement removed tags
  for (const name of removedTags) {
    ops.push(
      prisma.tag.updateMany({
        where: { userId, name, usageCount: { gt: 0 } },
        data: { usageCount: { decrement: 1 } },
      })
    );
  }

  if (ops.length > 0) {
    await Promise.all(ops);
  }
}

/**
 * Compute added and removed tags between old and new tag arrays.
 */
export function diffTags(
  oldTags: string[],
  newTags: string[]
): { added: string[]; removed: string[] } {
  const oldSet = new Set(oldTags);
  const newSet = new Set(newTags);
  const added = newTags.filter((t) => !oldSet.has(t));
  const removed = oldTags.filter((t) => !newSet.has(t));
  return { added, removed };
}
