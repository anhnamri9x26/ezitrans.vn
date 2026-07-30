import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGravatarUrl } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'moderate_comments');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý bình luận' }, { status: 403 });
    }

    const { id } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
            legacyId: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bình luận' }, { status: 404 });
    }

    const commentWithAvatar = {
      ...comment,
      avatarUrl: getGravatarUrl(comment.authorEmail)
    };

    return NextResponse.json({ success: true, comment: commentWithAvatar });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'moderate_comments');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý bình luận' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, authorName, authorEmail, authorUrl, status } = body;

    const existingComment = await prisma.comment.findUnique({
      where: { id: Number(id) }
    });

    if (!existingComment) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bình luận cần cập nhật' }, { status: 404 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      // Validate status
      const validStatuses = ['PENDING', 'APPROVED', 'SPAM', 'TRASH'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return NextResponse.json({ success: false, error: 'Trạng thái bình luận không hợp lệ' }, { status: 400 });
      }
      updateData.status = status.toUpperCase();
    }

    if (content !== undefined) {
      if (content.trim() === '') {
        return NextResponse.json({ success: false, error: 'Nội dung bình luận không được để trống' }, { status: 400 });
      }
      updateData.content = content.trim();
    }

    if (authorName !== undefined) {
      updateData.authorName = authorName.trim();
    }

    if (authorEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (authorEmail.trim() !== '' && !emailRegex.test(authorEmail.trim())) {
        return NextResponse.json({ success: false, error: 'Địa chỉ Email không hợp lệ' }, { status: 400 });
      }
      updateData.authorEmail = authorEmail.trim();
    }

    if (authorUrl !== undefined) {
      updateData.authorUrl = authorUrl.trim() || null;
    }

    if (body.rating !== undefined) {
      updateData.rating = body.rating;
    }

    const updatedComment = await prisma.comment.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
            legacyId: true
          }
        }
      }
    });

    // --- BACKGROUND EMAIL TRIGGER ---
    if (existingComment.status !== 'APPROVED' && updatedComment.status === 'APPROVED') {
      (async () => {
        try {
          const settingsList = await prisma.setting.findMany();
          const s = settingsList.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => { acc[cur.key] = cur.value; return acc; }, {});

          const notifyUserApproved = s.email_notify_user_approved !== 'false';
          
          if (notifyUserApproved && updatedComment.authorEmail && updatedComment.authorEmail !== 'anonymous@lexi.vn') {
            const hostUrl = process.env.NEXTAUTH_URL || 'http://localhost:3005';
            
            // Tạo link bài viết
            let articleLink = hostUrl;
            if (updatedComment.post) {
              const permalink = s.permalink_structure || '/%postname%.html';
              if (permalink.includes('%postname%')) {
                articleLink = `${hostUrl}/${updatedComment.post.slug}.html`;
              } else {
                articleLink = `${hostUrl}/?p=${updatedComment.post.id}`;
              }
            }

            const userHtml = `
              <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #10b981; border-bottom: 2px solid #e6f4ea; padding-bottom: 10px; margin-top: 0;">Bình luận của bạn đã được phê duyệt! 🎉</h2>
                <p>Xin chào ${updatedComment.authorName},</p>
                <p>Chúng tôi xin vui mừng thông báo rằng bình luận của bạn trên bài viết <strong>"${updatedComment.post?.title || 'Lexi'}"</strong> đã được duyệt và hiển thị công khai trên website.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; font-size: 13px;">
                  <strong>Nội dung bình luận:</strong>
                  <p style="margin: 8px 0; font-style: italic; color: #1f2937;">"${updatedComment.content}"</p>
                </div>
                
                <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Bạn có thể xem trực tiếp bình luận của mình bằng cách nhấp vào nút dưới đây:</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${articleLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Xem bình luận công khai</a>
                </div>
              </div>
            `;

            await sendMail({
              to: updatedComment.authorEmail,
              subject: `[Lexi] Bình luận của bạn đã được phê duyệt thành công`,
              html: userHtml
            });
          }
        } catch (err) {
          console.error('Failed to execute approved comment email trigger:', err);
        }
      })();
    }

    const commentWithAvatar = {
      ...updatedComment,
      avatarUrl: getGravatarUrl(updatedComment.authorEmail)
    };

    return NextResponse.json({ success: true, comment: commentWithAvatar });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'moderate_comments');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý bình luận' }, { status: 403 });
    }

    const { id } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) }
    });

    if (!comment) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bình luận' }, { status: 404 });
    }

    // Cascade delete works automatically if parentId references Comment.id. 
    // In our model, children references Comment parentId on delete Cascade.
    await prisma.comment.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa bình luận thành công' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ success: false, error: 'Không thể xóa bình luận này' }, { status: 500 });
  }
}
