import { prisma } from '@/lib/prisma';

const MAX_FIELDS = 30;
const MAX_VALUE_LENGTH = 5000;
const MIN_FILL_TIME_MS = 1200;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

export type SubmissionInput = {
  formId?: unknown;
  formName?: unknown;
  pageUrl?: unknown;
  fields?: unknown;
  website?: unknown;
  startedAt?: unknown;
};

type FormDefinition = {
  name: string;
  required: string[];
  allowed: string[];
};

const FORMS: Record<string, FormDefinition> = {
  'ezitrans-contact': {
    name: 'Liên hệ Ezitrans',
    required: ['ho_ten', 'so_dien_thoai', 'noi_dung'],
    allowed: ['ho_ten', 'so_dien_thoai', 'email', 'chu_de', 'noi_dung'],
  },
  'ezitrans-service-consultation': {
    name: 'Tư vấn dịch vụ Ezitrans',
    required: ['ho_ten', 'so_dien_thoai'],
    allowed: ['ho_ten', 'so_dien_thoai', 'nhu_cau', 'noi_dung', 'dich_vu'],
  },
};

export class SubmissionError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function cleanText(value: unknown, max = MAX_VALUE_LENGTH) {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new SubmissionError('Dữ liệu biểu mẫu không hợp lệ.');
  }
  return String(value).replace(/\0/g, '').trim().slice(0, max);
}

function normalizePageUrl(value: unknown) {
  const raw = cleanText(value ?? '', 2048);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new SubmissionError('Địa chỉ trang gửi không hợp lệ.');
  }
}

function normalizePhone(value: string) {
  const phone = value.replace(/[^0-9+]/g, '');
  if (!/^\+?\d{8,15}$/.test(phone)) throw new SubmissionError('Số điện thoại không hợp lệ.');
  return phone;
}

export async function collectFormSubmission(input: SubmissionInput, context: { ipAddress: string; userAgent: string }) {
  if (cleanText(input.website ?? '', 200)) throw new SubmissionError('Yêu cầu không hợp lệ.');
  const startedAt = Number(input.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_TIME_MS || Date.now() - startedAt > 24 * 60 * 60 * 1000) {
    throw new SubmissionError('Biểu mẫu được gửi quá nhanh. Vui lòng thử lại.', 429);
  }

  const formId = cleanText(input.formId, 100);
  const definition = FORMS[formId];
  const isBuilderForm = /^form_[a-zA-Z0-9_]{1,80}$/.test(formId);
  if (!definition && !isBuilderForm) throw new SubmissionError('Biểu mẫu không được hỗ trợ.');
  if (!input.fields || typeof input.fields !== 'object' || Array.isArray(input.fields)) throw new SubmissionError('Dữ liệu biểu mẫu không hợp lệ.');

  const entries = Object.entries(input.fields as Record<string, unknown>);
  if (entries.length === 0 || entries.length > MAX_FIELDS) throw new SubmissionError('Số trường dữ liệu không hợp lệ.');
  const fields: Record<string, string | string[]> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.replace(/\[\]$/, '');
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(key)) throw new SubmissionError('Tên trường dữ liệu không hợp lệ.');
    if (definition && !definition.allowed.includes(key)) continue;
    fields[key] = Array.isArray(rawValue)
      ? rawValue.slice(0, 20).map(value => cleanText(value, 500))
      : cleanText(rawValue);
  }
  for (const key of definition?.required ?? []) if (!fields[key] || !String(fields[key]).trim()) throw new SubmissionError('Vui lòng điền đầy đủ các trường bắt buộc.');
  if (typeof fields.so_dien_thoai === 'string') fields.so_dien_thoai = normalizePhone(fields.so_dien_thoai);
  if (typeof fields.email === 'string' && fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new SubmissionError('Địa chỉ email không hợp lệ.');
  if (typeof fields.ho_ten === 'string' && fields.ho_ten.length < 2) throw new SubmissionError('Họ và tên không hợp lệ.');
  if (formId === 'ezitrans-contact' && typeof fields.noi_dung === 'string' && fields.noi_dung.length < 10) throw new SubmissionError('Nội dung yêu cầu cần ít nhất 10 ký tự.');

  const ipAddress = context.ipAddress.slice(0, 255);
  const recentCount = await prisma.formSubmission.count({
    where: { formId, ipAddress, createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) } },
  });
  if (recentCount >= RATE_MAX) throw new SubmissionError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.', 429);

  return prisma.formSubmission.create({
    data: {
      formId,
      formName: definition?.name || cleanText(input.formName || 'Form website', 160),
      pageUrl: normalizePageUrl(input.pageUrl),
      ipAddress,
      userAgent: context.userAgent.slice(0, 1000),
      data: JSON.stringify(fields),
    },
    select: { id: true, createdAt: true },
  });
}