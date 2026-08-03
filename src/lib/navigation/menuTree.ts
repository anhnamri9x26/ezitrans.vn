import type { NavigationMenuItem } from './types';

export interface NavigationMenuTreeItem extends NavigationMenuItem {
  children: NavigationMenuTreeItem[];
}

export function normalizeMenuItems(input: unknown): NavigationMenuItem[] {
  if (!Array.isArray(input)) return [];

  const normalized = input.slice(0, 500).map((raw, index) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: typeof item.id === 'string' && item.id.trim()
        ? item.id.trim().slice(0, 120)
        : `menu_item_${Date.now()}_${index}`,
      label: typeof item.label === 'string' ? item.label.trim().slice(0, 180) : '',
      url: typeof item.url === 'string' ? item.url.trim().slice(0, 2048) : '',
      indent: Number.isFinite(Number(item.indent)) ? Math.min(2, Math.max(0, Number(item.indent))) : 0,
      isMega: item.isMega === true || item.isMega === 'true',
      description: typeof item.description === 'string' ? item.description.trim().slice(0, 500) : '',
      icon: typeof item.icon === 'string' ? item.icon.trim().slice(0, 80) : '',
    } satisfies NavigationMenuItem;
  });

  if (normalized.length > 0) normalized[0].indent = 0;
  for (let index = 1; index < normalized.length; index += 1) {
    normalized[index].indent = Math.min(normalized[index].indent, normalized[index - 1].indent + 1);
  }

  return normalized;
}

export function parseMenuItems(value: string | null | undefined): NavigationMenuItem[] {
  if (!value) return [];
  try {
    return normalizeMenuItems(JSON.parse(value));
  } catch {
    return [];
  }
}

export function buildMenuTree(items: NavigationMenuItem[]): NavigationMenuTreeItem[] {
  const roots: NavigationMenuTreeItem[] = [];
  const stack: NavigationMenuTreeItem[] = [];

  normalizeMenuItems(items).forEach((item) => {
    const node: NavigationMenuTreeItem = { ...item, children: [] };
    if (item.indent === 0 || stack.length === 0) {
      roots.push(node);
      stack.length = 0;
      stack[0] = node;
      return;
    }

    const parent = stack[item.indent - 1] || stack[0];
    if (!parent) {
      node.indent = 0;
      roots.push(node);
      stack.length = 0;
      stack[0] = node;
      return;
    }

    parent.children.push(node);
    stack.length = item.indent;
    stack[item.indent] = node;
  });

  return roots;
}
