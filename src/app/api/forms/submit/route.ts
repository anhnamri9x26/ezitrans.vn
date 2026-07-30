import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formId, formName, pageUrl, fields, config } = body;

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // 1. Collect to Database
    if (config?.actions?.includes('collect')) {
      const dataObj: any = { ...fields };
      
      if (config.collectMetadata) {
        dataObj._metadata = {
          ip: ipAddress,
          userAgent: userAgent,
          pageUrl: pageUrl,
          submittedAt: new Date().toISOString()
        };
      }

      await prisma.formSubmission.create({
        data: {
          formId: formId || 'unknown',
          formName: formName || 'Khong ten',
          pageUrl: pageUrl || '',
          ipAddress: ipAddress,
          userAgent: userAgent,
          data: JSON.stringify(dataObj)
        }
      });
    }

    // 2. Send Email
    if (config?.actions?.includes('email') && config?.email) {
      const { to, subject, message, from, fromName, replyTo } = config.email;

      // Replace shortcodes
      const replaceTokens = (str: string) => {
        let result = str;
        
        // Replace [all-fields]
        if (result.includes('[all-fields]')) {
          let allFieldsHtml = '<table style="width:100%; border-collapse: collapse;">';
          for (const [key, value] of Object.entries(fields)) {
            const valStr = Array.isArray(value) ? value.join(', ') : value;
            allFieldsHtml += `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">${key}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${valStr}</td>
              </tr>
            `;
          }
          allFieldsHtml += '</table>';
          result = result.replace(/\[all-fields\]/g, allFieldsHtml);
        }

        // Replace specific field tokens e.g. [field id="email"]
        const fieldRegex = /\[field\s+id="([^"]+)"\]/g;
        result = result.replace(fieldRegex, (match, id) => {
          const val = fields[id];
          if (!val) return '';
          return Array.isArray(val) ? val.join(', ') : String(val);
        });

        // Replace metadata
        result = result.replace(/\[date\]/g, new Date().toLocaleDateString('vi-VN'));
        result = result.replace(/\[time\]/g, new Date().toLocaleTimeString('vi-VN'));
        result = result.replace(/\[page_url\]/g, pageUrl || '');
        result = result.replace(/\[user_agent\]/g, userAgent);
        result = result.replace(/\[remote_ip\]/g, ipAddress);

        return result;
      };

      const finalSubject = replaceTokens(subject);
      const finalMessage = replaceTokens(message);
      const finalTo = replaceTokens(to);
      const finalFrom = replaceTokens(from);
      const finalFromName = replaceTokens(fromName);
      const finalReplyTo = replaceTokens(replyTo);

      if (finalTo) {
        const emails = finalTo.split(',').map(e => e.trim()).filter(Boolean);
        for (const email of emails) {
          await sendMail({
            to: email,
            subject: finalSubject,
            html: finalMessage,
            fromName: finalFromName !== '[site-title]' ? finalFromName : undefined,
            fromEmail: finalFrom !== '[admin-email]' ? finalFrom : undefined,
            replyTo: finalReplyTo || undefined,
          });
        }
      }
    }

    // 3. Webhook Trigger
    if (config?.actions?.includes('webhook') && config?.webhookUrl) {
      try {
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId,
            formName,
            pageUrl,
            fields,
            metadata: { ip: ipAddress, userAgent }
          })
        });
      } catch (e) {
        console.error("Webhook trigger failed", e);
      }
    }

    // 4. Redirect
    let redirectUrl = null;
    if (config?.actions?.includes('redirect') && config?.redirectUrl) {
      redirectUrl = config.redirectUrl;
    }

    return NextResponse.json({ success: true, redirectUrl });

  } catch (error: any) {
    console.error("Form submit error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
