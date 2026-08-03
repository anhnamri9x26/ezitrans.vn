import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
export default async function CustomizeEntryPage(){const active=await prisma.setting.findUnique({where:{key:'active_theme'}});redirect(`/admin/settings/themes/${active?.value||'default'}/customize`)}
