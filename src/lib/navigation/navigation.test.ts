import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMenuTree, normalizeMenuItems } from './menuTree';
import { isSafeMenuUrl, slugifyMenuName, validateMenuItems } from './validation';
import { normalizeMenuLocations } from './locations';

test('normalizes legacy items and enforces a three-level hierarchy', () => {
  const items = normalizeMenuItems([
    { label: 'Parent', url: '/', indent: 2 },
    { label: 'Child', url: '/child', indent: 2 },
    { label: 'Grandchild', url: '/grandchild', indent: 9 },
  ]);
  assert.deepEqual(items.map((item) => item.indent), [0, 1, 2]);
  const tree = buildMenuTree(items);
  assert.equal(tree[0].children[0].children[0].label, 'Grandchild');
});

test('accepts site-safe URLs and rejects executable URLs', () => {
  assert.equal(isSafeMenuUrl('/lien-he'), true);
  assert.equal(isSafeMenuUrl('https://example.com'), true);
  assert.equal(isSafeMenuUrl('mailto:test@example.com'), true);
  assert.equal(isSafeMenuUrl('javascript:alert(1)'), false);
  assert.throws(() => validateMenuItems([{ label: 'Bad', url: 'data:text/html,bad', indent: 0 }]));
});

test('creates stable Vietnamese menu slugs', () => {
  assert.equal(slugifyMenuName('Điều hướng Chính'), 'dieu-huong-chinh');
});

test('normalizes declared theme locations and rejects duplicates', () => {
  const locations = normalizeMenuLocations([
    { key: 'header-primary', label: 'Menu chính' },
    { key: 'header-primary', label: 'Trùng' },
  ]);
  assert.equal(locations.length, 1);
  assert.equal(locations[0].key, 'header-primary');
});
