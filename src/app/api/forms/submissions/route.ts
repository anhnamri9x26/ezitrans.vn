import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'view_form_submissions');

    if (!user || !hasCap) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const submissions = await prisma.formSubmission.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    console.error("GET form submissions error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'view_form_submissions');

    if (!user || !hasCap) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    await prisma.formSubmission.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE form submission error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
