import { db, schema } from '@/db/client'
import { eq, and, sql } from 'drizzle-orm'

const { bfTrackerUpdates, bfTrackerUpdateRevisions } = schema

export interface TrackerUpdate {
  id: number
  entityType: string
  entityRef: string
  label: string
  content: string
  sourceKind: string | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  revisionCount?: number
}

export interface TrackerRevision {
  id: number
  trackerUpdateId: number
  oldLabel: string
  oldContent: string
  newLabel: string
  newContent: string
  editedBy: string
  editedAt: Date
}

export async function getTrackerUpdates(
  entityType: string,
  entityRef: string,
): Promise<TrackerUpdate[]> {
  const rows = await db
    .select({
      id: bfTrackerUpdates.id,
      entityType: bfTrackerUpdates.entityType,
      entityRef: bfTrackerUpdates.entityRef,
      label: bfTrackerUpdates.label,
      content: bfTrackerUpdates.content,
      sourceKind: bfTrackerUpdates.sourceKind,
      createdBy: bfTrackerUpdates.createdBy,
      updatedBy: bfTrackerUpdates.updatedBy,
      createdAt: bfTrackerUpdates.createdAt,
      updatedAt: bfTrackerUpdates.updatedAt,
      revisionCount: sql<number>`(SELECT COUNT(*) FROM bf_tracker_update_revisions r WHERE r.tracker_update_id = ${bfTrackerUpdates.id})`,
    })
    .from(bfTrackerUpdates)
    .where(
      and(
        eq(bfTrackerUpdates.entityType, entityType),
        eq(bfTrackerUpdates.entityRef, entityRef),
      ),
    )
    .orderBy(bfTrackerUpdates.createdAt, bfTrackerUpdates.id)

  return rows as TrackerUpdate[]
}

export async function getTrackerRevisions(updateId: number): Promise<TrackerRevision[]> {
  return db
    .select({
      id: bfTrackerUpdateRevisions.id,
      trackerUpdateId: bfTrackerUpdateRevisions.trackerUpdateId,
      oldLabel: bfTrackerUpdateRevisions.oldLabel,
      oldContent: bfTrackerUpdateRevisions.oldContent,
      newLabel: bfTrackerUpdateRevisions.newLabel,
      newContent: bfTrackerUpdateRevisions.newContent,
      editedBy: bfTrackerUpdateRevisions.editedBy,
      editedAt: bfTrackerUpdateRevisions.editedAt,
    })
    .from(bfTrackerUpdateRevisions)
    .where(eq(bfTrackerUpdateRevisions.trackerUpdateId, updateId))
    .orderBy(bfTrackerUpdateRevisions.editedAt)
}

export async function createTrackerUpdate(data: {
  entityType: string
  entityRef: string
  label: string
  content: string
  sourceKind?: string
  userId: number
  userName: string
}): Promise<number> {
  const now = new Date()
  const result = await db.insert(bfTrackerUpdates).values({
    entityType: data.entityType,
    entityRef: data.entityRef,
    label: data.label,
    content: data.content,
    sourceKind: data.sourceKind ?? null,
    createdByUserId: data.userId,
    createdBy: data.userName,
    createdAt: now,
    updatedAt: now,
  })
  return (result[0] as unknown as { insertId: number }).insertId
}

export async function updateTrackerUpdate(
  id: number,
  data: { label: string; content: string; userId: number; userName: string },
): Promise<{ ok: boolean; error?: string }> {
  const [existing] = await db
    .select()
    .from(bfTrackerUpdates)
    .where(eq(bfTrackerUpdates.id, id))
    .limit(1)

  if (!existing) return { ok: false, error: 'Not found' }
  if (existing.label === data.label && existing.content === data.content) {
    return { ok: false, error: 'Nothing to update' }
  }

  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.insert(bfTrackerUpdateRevisions).values({
      trackerUpdateId: id,
      oldLabel: existing.label,
      oldContent: existing.content,
      newLabel: data.label,
      newContent: data.content,
      editedByUserId: data.userId,
      editedBy: data.userName,
      editedAt: now,
    })
    await tx
      .update(bfTrackerUpdates)
      .set({
        label: data.label,
        content: data.content,
        updatedByUserId: data.userId,
        updatedBy: data.userName,
        updatedAt: now,
      })
      .where(eq(bfTrackerUpdates.id, id))
  })

  return { ok: true }
}

export async function deleteTrackerUpdate(id: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: bfTrackerUpdates.id })
    .from(bfTrackerUpdates)
    .where(eq(bfTrackerUpdates.id, id))
    .limit(1)

  if (!existing) return false

  await db.delete(bfTrackerUpdateRevisions).where(eq(bfTrackerUpdateRevisions.trackerUpdateId, id))
  await db.delete(bfTrackerUpdates).where(eq(bfTrackerUpdates.id, id))
  return true
}
