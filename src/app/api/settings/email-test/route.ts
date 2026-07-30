import { handleTestEmail } from '@/plugins/email-smtp/api/email-test';

export async function POST(req: Request) {
  return handleTestEmail(req);
}
