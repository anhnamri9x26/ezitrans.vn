export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function diffWords(oldStr: string, newStr: string): DiffChange[] {
  // Simple word-based diff using Longest Common Subsequence (LCS)
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);
  
  const dp: number[][] = Array(oldWords.length + 1)
    .fill(null)
    .map(() => Array(newWords.length + 1).fill(0));
    
  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const changes: DiffChange[] = [];
  let i = oldWords.length;
  let j = newWords.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      changes.unshift({ value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ value: newWords[j - 1], added: true });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      changes.unshift({ value: oldWords[i - 1], removed: true });
      i--;
    }
  }
  
  return changes;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderDiffHtml(oldStr: string, newStr: string): string {
  const changes = diffWords(oldStr || '', newStr || '');
  return changes.map(change => {
    if (change.added) {
      return `<ins class="bg-emerald-100 text-emerald-800 px-1 rounded no-underline font-semibold dark:bg-emerald-950/60 dark:text-emerald-300 break-words">${escapeHtml(change.value)}</ins>`;
    }
    if (change.removed) {
      return `<del class="bg-rose-100 text-rose-800 line-through px-1 rounded font-semibold dark:bg-rose-950/60 dark:text-rose-300 break-words">${escapeHtml(change.value)}</del>`;
    }
    return escapeHtml(change.value);
  }).join('');
}

export function renderLeftDiffHtml(oldStr: string, newStr: string): string {
  const changes = diffWords(oldStr || '', newStr || '');
  return changes.map(change => {
    if (change.removed) {
      return `<del class="bg-rose-100 text-rose-800 line-through px-1 rounded font-semibold dark:bg-rose-950/60 dark:text-rose-300 break-words">${escapeHtml(change.value)}</del>`;
    }
    if (change.added) {
      return ''; // Hide additions on the old side
    }
    return escapeHtml(change.value);
  }).join('');
}

export function renderRightDiffHtml(oldStr: string, newStr: string): string {
  const changes = diffWords(oldStr || '', newStr || '');
  return changes.map(change => {
    if (change.added) {
      return `<ins class="bg-emerald-100 text-emerald-800 px-1 rounded no-underline font-semibold dark:bg-emerald-950/60 dark:text-emerald-300 break-words">${escapeHtml(change.value)}</ins>`;
    }
    if (change.removed) {
      return ''; // Hide deletions on the new side
    }
    return escapeHtml(change.value);
  }).join('');
}

export function stripHtml(htmlStr: string): string {
  if (!htmlStr) return '';
  let text = htmlStr
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
    
  if (typeof window !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(htmlStr, 'text/html');
      text = doc.body.textContent || text;
    } catch (e) {
      // ignore
    }
  }
  return text;
}

export function compressContent(newerContent: string, olderContent: string): string {
  const { createPatch } = require('diff');
  return createPatch('content.html', newerContent || '', olderContent || '');
}

export function decompressContent(newerContent: string, patch: string): string {
  const { applyPatch } = require('diff');
  const result = applyPatch(newerContent || '', patch);
  if (result === false) {
    console.error('Failed to apply diff patch');
    return patch;
  }
  return result;
}

interface RevisionLike {
  id: number;
  postId: number;
  title: string;
  content: string | null;
  slug: string;
  isDelta: boolean;
  createdAt: Date;
}

export function reconstructRevisions<T extends RevisionLike>(revisions: T[]): T[] {
  const reconstructed = revisions.map(r => ({ ...r }));
  for (let i = 0; i < reconstructed.length; i++) {
    if (reconstructed[i].isDelta) {
      if (i > 0) {
        const newerContent = reconstructed[i - 1].content || '';
        const patch = reconstructed[i].content || '';
        reconstructed[i].content = decompressContent(newerContent, patch);
        reconstructed[i].isDelta = false;
      } else {
        console.warn(`Revision at index 0 is marked as delta: id=${reconstructed[i].id}`);
      }
    }
  }
  return reconstructed;
}
