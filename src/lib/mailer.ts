import { sendMail as pluginSendMail } from '@/plugins/email-smtp/lib/mailer';

export async function sendMail(args: Parameters<typeof pluginSendMail>[0]) {
  return pluginSendMail(args);
}
