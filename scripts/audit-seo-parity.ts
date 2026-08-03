type AuditResult = {
  path: string;
  status: number;
  title: string;
  canonical: string;
  robots: string;
  h1Count: number;
  jsonLdCount: number;
  leakedDomains: string[];
};

const baseUrl = (process.argv[2] || 'http://localhost:3006').replace(/\/$/, '');
const paths = process.argv.slice(3);
const defaultPaths = ['/', '/mua-ho-hang-trung-quoc.html', '/category/mua-ho-thanh-toan-ho', '/author/ezitrans', '/robots.txt', '/sitemap.xml', '/sitemap_index.xml', '/trang-chu', '/seo-audit-not-found'];

function match(html: string, pattern: RegExp) {
  return pattern.exec(html)?.[1]?.trim() || '';
}

async function auditPath(path: string): Promise<AuditResult> {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  const html = await response.text();
  return {
    path,
    status: response.status,
    title: match(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    canonical: match(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i),
    robots: match(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i),
    h1Count: (html.match(/<h1\b/gi) || []).length,
    jsonLdCount: (html.match(/application\/ld\+json/gi) || []).length,
    leakedDomains: ['lexi.vn', 'localhost:3005', 'example.com'].filter(domain => html.includes(domain)),
  };
}

async function main() {
  const results = await Promise.all((paths.length ? paths : defaultPaths).map(auditPath));
  console.table(results);
  const failures: AuditResult[] = [];
  const expected = new Map([['/trang-chu', 308], ['/seo-audit-not-found', 404]]);
  for (const result of results) {
    if (result.leakedDomains.length) failures.push(result);
    const expectedStatus = expected.get(result.path);
    if (expectedStatus ? result.status !== expectedStatus : result.status >= 400) failures.push(result);
  }
  if (failures.length) {
    console.error('SEO audit failed:', [...new Set(failures.map(result => result.path))].join(', '));
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
