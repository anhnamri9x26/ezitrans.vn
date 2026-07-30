import { useEffect } from 'react';

/**
 * A custom React hook to prevent accidental navigation when there are unsaved changes.
 * Protects against:
 * 1. Browser reload, tab close, or external link navigation (beforeunload)
 * 2. SPA internal link clicks (Next.js client-side Link clicks)
 * 3. Browser Back/Forward buttons (popstate history locking)
 * 
 * @param hasUnsavedChanges Boolean flag indicating if the form has unsaved changes.
 */
export function useNavigationGuard(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // 1. Browser hard reload, tab close, external links
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // 2. SPA internal client-side Link clicks
    const handleClientSideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          const confirmLeave = confirm('Thay đổi của bạn chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?');
          if (!confirmLeave) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('click', handleClientSideClick, true); // Capture phase to preempt Next.js router

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleClientSideClick, true);
    };
  }, [hasUnsavedChanges]);

  // 3. Browser Back/Forward button history locking
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Push a dummy state to block the first back trigger
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      const confirmLeave = confirm('Thay đổi của bạn chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?');
      if (!confirmLeave) {
        window.history.pushState(null, '', window.location.href);
      } else {
        window.removeEventListener('popstate', handlePopState);
        window.history.back(); // Go back to the real previous page
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);
}
