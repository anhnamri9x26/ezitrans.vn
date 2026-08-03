import React from 'react';
import Link from 'next/link';
import { buildMenuTree } from '@/lib/navigation/menuTree';
import type { NavigationMenuItem } from '@/lib/navigation/types';

export interface ManagedMenuViewProps {
  items: NavigationMenuItem[];
  config?: Record<string, any>;
}

export default function ManagedMenuView({ items, config = {} }: ManagedMenuViewProps) {
  const tree = buildMenuTree(items);
  const layout = config.menuLayout || 'horizontal';
  const align = config.align || 'left';
  const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : align === 'space-between' ? 'space-between' : 'flex-start';
  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: layout === 'horizontal' ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent,
    gap: config.itemGap || '20px',
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };
  const itemStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    color: config.textColor || '#334155',
    background: config.itemBgColor || 'transparent',
    fontSize: config.fontSize || '14px',
    fontWeight: config.fontWeight || '600',
    padding: `${config.itemPaddingTop || '8px'} ${config.itemPaddingRight || '12px'} ${config.itemPaddingBottom || '8px'} ${config.itemPaddingLeft || '12px'}`,
    borderRadius: config.itemBorderRadius || '0px',
    textDecoration: 'none',
  };

  return (
    <nav className="managed-navigation-menu" aria-label="Menu điều hướng">
      <ul style={listStyle}>
        {tree.map((item) => (
          <li key={item.id} style={{ position: 'relative' }}>
            <Link href={item.url || '#'} style={itemStyle}>{item.label}</Link>
            {item.children.length > 0 && (
              <ul style={{ listStyle: 'none', margin: 0, padding: '8px', minWidth: 220, background: config.dropdownBgColor || '#fff', color: config.dropdownTextColor || '#334155', borderRadius: 8 }}>
                {item.children.map((child) => (
                  <li key={child.id}>
                    <Link href={child.url || '#'} style={{ ...itemStyle, width: '100%', color: config.dropdownTextColor || '#334155' }}>{child.label}</Link>
                    {child.children.length > 0 && (
                      <ul style={{ listStyle: 'none', paddingLeft: 16 }}>
                        {child.children.map((grandchild) => <li key={grandchild.id}><Link href={grandchild.url || '#'} style={{ ...itemStyle, width: '100%', color: config.dropdownTextColor || '#334155' }}>{grandchild.label}</Link></li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
