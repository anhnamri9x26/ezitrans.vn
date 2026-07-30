import { prisma } from './prisma';
import { compressContent, reconstructRevisions } from './diff';

/**
 * Creates a new revision for a post if the content has changed.
 * Automatically handles deduplication, delta compression for older revisions (> 5),
 * and capping the total revisions at 50.
 */
export async function createRevision(
  postId: number,
  title: string,
  content: string | null,
  slug: string
) {
  try {
    // 1. Fetch the latest revision for deduplication
    const latestRevision = await prisma.revision.findFirst({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    let latestContent = latestRevision?.content || '';
    if (latestRevision?.isDelta) {
      const allRevs = await prisma.revision.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
      });
      const reconstructed = reconstructRevisions(allRevs);
      latestContent = reconstructed[0]?.content || '';
    }

    // Deduplication check: if no change, don't create a new revision
    if (
      latestRevision &&
      latestRevision.title === title &&
      latestContent === (content || '') &&
      latestRevision.slug === slug
    ) {
      return null;
    }

    // 2. Create the new revision (always full snapshot initially)
    const newRevision = await prisma.revision.create({
      data: {
        postId,
        title,
        content,
        slug,
        isDelta: false,
      },
    });

    // 3. Fetch all revisions to compress older ones and enforce the limit
    const revisions = await prisma.revision.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Delta compress revisions older than the 5 most recent ones
    for (let i = 5; i < revisions.length; i++) {
      const rev = revisions[i];
      if (!rev.isDelta) {
        const reconstructed = reconstructRevisions(revisions);
        const newerContent = reconstructed[i - 1].content || '';
        const olderContent = reconstructed[i].content || '';
        const patch = compressContent(newerContent, olderContent);

        await prisma.revision.update({
          where: { id: rev.id },
          data: {
            content: patch,
            isDelta: true,
          },
        });

        // Update local object so next iterations have the correct data
        revisions[i].content = patch;
        revisions[i].isDelta = true;
      }
    }

    // 5. Enforce limit of 50 revisions
    if (revisions.length > 50) {
      const deleteIds = revisions.slice(50).map((r) => r.id);
      await prisma.revision.deleteMany({
        where: { id: { in: deleteIds } },
      });
    }

    return newRevision;
  } catch (error) {
    console.error('Error in createRevision helper:', error);
    throw error;
  }
}

/**
 * Deletes one or multiple revisions from the database and heals the delta compression chain
 * to ensure that all remaining revisions can still be reconstructed perfectly.
 */
export async function deleteRevisions(postId: number, revisionIds: number[]) {
  try {
    // 1. Fetch all current revisions for the post
    const revisions = await prisma.revision.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Reconstruct all of them in memory before deleting anything
    const reconstructed = reconstructRevisions(revisions);

    // 3. Delete the requested revisions from the database
    await prisma.revision.deleteMany({
      where: {
        id: { in: revisionIds },
        postId, // Safety check
      },
    });

    // 4. Filter the in-memory reconstructed array to remove deleted ones
    const remaining = reconstructed.filter(r => !revisionIds.includes(r.id));

    // 5. Update the remaining revisions in the database to heal the delta chain
    for (let i = 0; i < remaining.length; i++) {
      const rev = remaining[i];
      const dbRev = revisions.find(r => r.id === rev.id);
      
      const shouldBeDelta = i >= 5;
      
      if (shouldBeDelta) {
        // We always re-compress relative to the new i - 1 to heal the chain perfectly
        const newerContent = remaining[i - 1].content || '';
        const olderContent = remaining[i].content || '';
        const patch = compressContent(newerContent, olderContent);
        
        await prisma.revision.update({
          where: { id: rev.id },
          data: {
            content: patch,
            isDelta: true,
          },
        });
      } else {
        // Must be full snapshot
        // Only update if it was delta in the database before
        if (dbRev && dbRev.isDelta) {
          await prisma.revision.update({
            where: { id: rev.id },
            data: {
              content: rev.content,
              isDelta: false,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in deleteRevisions helper:', error);
    throw error;
  }
}
