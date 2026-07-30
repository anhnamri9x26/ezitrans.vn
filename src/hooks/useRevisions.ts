import { useState, useEffect, useCallback } from 'react';

interface UseRevisionsProps {
  postId: number | null;
  setTitle?: (title: string) => void;
  setContent?: (content: string) => void;
  setSlug?: (slug: string) => void;
  setHasUnsavedChanges?: (hasUnsavedChanges: boolean) => void;
}

/**
 * A custom React hook to manage revisions state, fetch revisions count,
 * and handle restoration callbacks for posts or pages.
 */
export function useRevisions({
  postId,
  setTitle,
  setContent,
  setSlug,
  setHasUnsavedChanges,
}: UseRevisionsProps) {
  const [revisionsCount, setRevisionsCount] = useState(0);
  const [isRevisionsModalOpen, setIsRevisionsModalOpen] = useState(false);

  // Fetch revisions count from the API
  const fetchRevisionsCount = useCallback(async () => {
    if (!postId) return;
    try {
      const res = await fetch(`/api/posts/${postId}/revisions`);
      const data = await res.json();
      if (data.success) {
        setRevisionsCount(data.revisions.length);
      }
    } catch (err) {
      console.error('Failed to fetch revisions count:', err);
    }
  }, [postId]);

  // Fetch count on mount or when postId changes
  useEffect(() => {
    if (postId) {
      fetchRevisionsCount();
    }
  }, [postId, fetchRevisionsCount]);

  // Handle restoring the revision into the editor states
  const handleRestoreRevision = useCallback(
    (restoredData: { title: string; content: string; slug: string }) => {
      if (setTitle) setTitle(restoredData.title);
      if (setContent) setContent(restoredData.content);
      if (setSlug) setSlug(restoredData.slug);
      if (setHasUnsavedChanges) setHasUnsavedChanges(false); // Restored state is already committed to database!
      
      fetchRevisionsCount();
      alert('Khôi phục bài viết thành công!');
    },
    [setTitle, setContent, setSlug, setHasUnsavedChanges, fetchRevisionsCount]
  );

  return {
    revisionsCount,
    isRevisionsModalOpen,
    setIsRevisionsModalOpen,
    fetchRevisionsCount,
    handleRestoreRevision,
  };
}
export type UseRevisionsReturn = ReturnType<typeof useRevisions>;
