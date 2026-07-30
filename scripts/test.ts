import { generatePostUrl } from '../src/lib/permalink';
const post = { type: 'PRODUCT', slug: 'thep-hop-khong-gi-sus304', createdAt: new Date() };
console.log("TEST BASE: ", generatePostUrl(post as any, '/%postname%.html', '/san-pham'));
console.log("TEST FULL: ", generatePostUrl(post as any, '/%postname%.html', '/san-pham/%postname%/'));
