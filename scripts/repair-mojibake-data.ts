import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from '../src/lib/prisma';
import { hasMojibake, mojibakeScore, repairSerializedText } from '../src/lib/text/repairMojibake';

type Row = Record<string, unknown> & { id: string | number };
type ModelSpec = {
  name: string;
  fields: string[];
  findMany: () => Promise<Row[]>;
  update: (client: any, id: Row['id'], data: Record<string, string>) => Promise<unknown>;
};

const specs: ModelSpec[] = [
  { name: 'Setting', fields: ['value'], findMany: () => prisma.setting.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.setting.update({ where: { id: Number(id) }, data }) },
  { name: 'Post', fields: ['title','content','excerpt','seoTitle','seoDescription','seoKeywords','builderData'], findMany: () => prisma.post.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.post.update({ where: { id: Number(id) }, data }) },
  { name: 'Category', fields: ['name','description'], findMany: () => prisma.category.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.category.update({ where: { id: Number(id) }, data }) },
  { name: 'Tag', fields: ['name'], findMany: () => prisma.tag.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.tag.update({ where: { id: Number(id) }, data }) },
  { name: 'NavigationMenu', fields: ['name','items'], findMany: () => prisma.navigationMenu.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.navigationMenu.update({ where: { id: Number(id) }, data }) },
  { name: 'Revision', fields: ['title','content'], findMany: () => prisma.revision.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.revision.update({ where: { id: Number(id) }, data }) },
  { name: 'Comment', fields: ['content','authorName'], findMany: () => prisma.comment.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.comment.update({ where: { id: Number(id) }, data }) },
  { name: 'Template', fields: ['name','htmlContent','builderData'], findMany: () => prisma.template.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.template.update({ where: { id: Number(id) }, data }) },
  { name: 'PageAutosave', fields: ['title','content','builderData','htmlContent'], findMany: () => prisma.pageAutosave.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.pageAutosave.update({ where: { id: String(id) }, data }) },
  { name: 'PageRevision', fields: ['revisionName','builderData','htmlContent','cssContent','commitMessage'], findMany: () => prisma.pageRevision.findMany() as Promise<Row[]>, update: (client: any, id, data) => client.pageRevision.update({ where: { id: String(id) }, data }) },
];

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const changes: Array<{ model: string; id: string | number; before: Record<string, string>; after: Record<string, string> }> = [];
  for (const spec of specs) {
    for (const row of await spec.findMany()) {
      const before: Record<string, string> = {};
      const after: Record<string, string> = {};
      for (const field of spec.fields) {
        const value = row[field];
        if (typeof value !== 'string' || !hasMojibake(value)) continue;
        const repaired = repairSerializedText(value);
        if (repaired !== value && mojibakeScore(repaired) < mojibakeScore(value)) {
          before[field] = value;
          after[field] = repaired;
        }
      }
      if (Object.keys(after).length) changes.push({ model: spec.name, id: row.id, before, after });
    }
  }

  const summary = Object.entries(Object.groupBy(changes, change => change.model)).map(([model, rows]) => `${model}: ${rows?.length ?? 0}`).join(', ');
  console.log(`${write ? 'Applying' : 'Would apply'} ${changes.length} row updates${summary ? ` (${summary})` : ''}.`);
  if (!write || changes.length === 0) return;

  const backupDir = join(process.cwd(), 'staging-data', 'encoding-backups');
  await mkdir(backupDir, { recursive: true });
  const backupPath = join(backupDir, `mojibake-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), changes }, null, 2), 'utf8');
  console.log(`Backup: ${backupPath}`);

  await prisma.$transaction(async transaction => {
    for (const change of changes) {
      const spec = specs.find(item => item.name === change.model)!;
      await spec.update(transaction, change.id, change.after);
    }
  });
  console.log(`Updated ${changes.length} rows successfully.`);
}

void main().finally(() => prisma.$disconnect());
