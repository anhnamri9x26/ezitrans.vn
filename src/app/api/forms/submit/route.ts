import { NextResponse } from 'next/server';
import { collectFormSubmission, SubmissionError, type SubmissionInput } from '@/lib/forms/submission';

function getClientIp(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'Unknown').trim();
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ success: false, error: 'Định dạng yêu cầu không hợp lệ.' }, { status: 415 });
    }
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 64 * 1024) {
      return NextResponse.json({ success: false, error: 'Dữ liệu biểu mẫu quá lớn.' }, { status: 413 });
    }

    const input = await req.json() as SubmissionInput;
    const submission = await collectFormSubmission(input, {
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Yêu cầu đã được tiếp nhận.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof SubmissionError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Form submit error', error);
    return NextResponse.json({ success: false, error: 'Không thể tiếp nhận yêu cầu lúc này.' }, { status: 500 });
  }
}
