import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getGravatarUrl } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { hooks, HOOK_NAMES } from '@/lib/hooks';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const postIdParam = searchParams.get('postId');
    const isPublicParam = searchParams.get('public') === 'true';

    // 1. Fetch Discussion Settings for sorting & pagination
    const dbSettings = await prisma.setting.findMany();
    const settings: { [key: string]: string } = dbSettings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const commentOrder = settings['comment_order'] || 'asc';
    const commentPagination = settings['comment_pagination'] === 'true';
    const commentPerPage = settings['comment_per_page'] ? Number(settings['comment_per_page']) : 50;

    // 2. Build query conditions
    const where: any = {};

    if (isPublicParam) {
      where.status = 'APPROVED'; // Frontend only sees approved comments
    } else if (statusParam && statusParam !== 'all') {
      where.status = statusParam.toUpperCase();
    }

    if (postIdParam) {
      where.postId = Number(postIdParam);
    }

    if (searchParam && searchParam.trim() !== '') {
      const q = searchParam.trim();
      where.OR = [
        { content: { contains: q, mode: 'insensitive' } },
        { authorName: { contains: q, mode: 'insensitive' } },
        { authorEmail: { contains: q, mode: 'insensitive' } },
      ];
    }

    const postTypeParam = searchParams.get('postType');
    if (postTypeParam) {
      where.post = { type: postTypeParam };
    }

    let comments = [];
    let totalPages = 1;
    let currentPage = 1;

    // 3. Handle Pagination & Tree Query
    if (isPublicParam && commentPagination) {
      currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
      
      // We only paginate top-level comments so threaded replies are not broken across pages
      const topLevelWhere = { ...where, parentId: null };
      const totalTopLevel = await prisma.comment.count({ where: topLevelWhere });
      totalPages = Math.ceil(totalTopLevel / commentPerPage) || 1;

      const topLevelComments = await prisma.comment.findMany({
        where: topLevelWhere,
        orderBy: { createdAt: commentOrder as 'asc' | 'desc' },
        skip: (currentPage - 1) * commentPerPage,
        take: commentPerPage,
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

      // Fetch all approved child replies for the active post to stitch the tree on client
      const childComments = where.postId ? await prisma.comment.findMany({
        where: {
          postId: where.postId,
          status: 'APPROVED',
          parentId: { not: null }
        },
        orderBy: { createdAt: commentOrder as 'asc' | 'desc' },
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
      }) : [];

      comments = [...topLevelComments, ...childComments];
    } else {
      // Direct query without pagination (for Admin panel or fallback)
      comments = await prisma.comment.findMany({
        where,
        orderBy: { createdAt: commentOrder as 'asc' | 'desc' },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
              createdAt: true,
              legacyId: true,
              _count: {
                select: { comments: true }
              }
            }
          },
          parent: {
            select: {
              id: true,
              authorName: true,
              content: true
            }
          }
        }
      });
    }

    // 4. Append Gravatar avatars
    const commentsWithAvatar = comments.map((c: { authorEmail?: string | null }) => ({
      ...c,
      avatarUrl: getGravatarUrl(c.authorEmail || '')
    }));

    return NextResponse.json({ 
      success: true, 
      comments: commentsWithAvatar,
      pagination: {
        enabled: isPublicParam && commentPagination,
        currentPage,
        totalPages,
        perPage: commentPerPage
      }
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, authorName, authorEmail, authorUrl, postId, parentId, rating } = body;

    if (!postId) {
      return NextResponse.json({ success: false, error: 'Thiếu ID bài viết liên kết' }, { status: 400 });
    }
    if (!content || content.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nội dung bình luận không được để trống' }, { status: 400 });
    }

    // 1. Fetch Discussion Settings
    const dbSettings = await prisma.setting.findMany();
    const settings: { [key: string]: string } = dbSettings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const commentGlobalEnabled = settings['comment_global_enabled'] !== 'false';
    const commentRequireNameEmail = settings['comment_require_name_email'] !== 'false';
    const commentRequireLogin = settings['comment_require_login'] === 'true';
    const commentThreadDepth = settings['comment_thread_depth'] ? Number(settings['comment_thread_depth']) : 5;
    const commentModerationManually = settings['comment_moderation_manually'] !== 'false';
    const commentPreviouslyApproved = settings['comment_previously_approved'] !== 'false';

    // Check if comments are disabled globally
    if (!commentGlobalEnabled) {
      return NextResponse.json({ success: false, error: 'Chức năng bình luận đã bị khóa cho toàn trang web.' }, { status: 403 });
    }

    // 2. Validate session & user details
    const user = await getCurrentUser();

    let finalAuthorName = authorName ? authorName.trim() : '';
    let finalAuthorEmail = authorEmail ? authorEmail.trim() : '';
    let finalAuthorUrl = authorUrl ? authorUrl.trim() : null;
    let finalUserId: number | null = null;
    let isElevatedUser = false;

    if (user) {
      finalUserId = user.id;
      finalAuthorName = user.name || user.username;
      finalAuthorEmail = user.email;
      if (user.role === 'ADMIN' || user.role === 'EDITOR') {
        isElevatedUser = true;
      }
    }

    // If login is required but user is a guest
    if (commentRequireLogin && !finalUserId) {
      return NextResponse.json({ success: false, error: 'Bạn phải đăng nhập tài khoản mới được gửi bình luận.' }, { status: 401 });
    }

    // Validate Guest info if not logged in
    if (!finalUserId) {
      if (commentRequireNameEmail) {
        if (!finalAuthorName || !finalAuthorEmail) {
          return NextResponse.json({ success: false, error: 'Vui lòng cung cấp Tên hiển thị và địa chỉ Email!' }, { status: 400 });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(finalAuthorEmail)) {
          return NextResponse.json({ success: false, error: 'Địa chỉ Email không hợp lệ!' }, { status: 400 });
        }
      } else {
        // Fallback for optional guest info
        if (!finalAuthorName) {
          finalAuthorName = 'Khách vãng lai';
        }
        if (!finalAuthorEmail) {
          finalAuthorEmail = 'anonymous@lexi.vn';
        }
      }
    }

    // 3. Threaded Comments & Depth validation
    let finalParentId = parentId ? Number(parentId) : null;
    if (finalParentId) {
      // Calculate depth of parent to check if it exceeds settings
      let depth = 1;
      let currentParentId = finalParentId;
      
      while (currentParentId) {
        const parentNode = await prisma.comment.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        });
        if (parentNode && parentNode.parentId) {
          depth++;
          currentParentId = parentNode.parentId;
        } else {
          break;
        }
      }

      // If depth exceeds the limit, flatten the reply by moving it up to share parent's parent
      if (depth >= commentThreadDepth) {
        const parentNode = await prisma.comment.findUnique({
          where: { id: finalParentId },
          select: { parentId: true }
        });
        finalParentId = parentNode ? parentNode.parentId : null;
      }
    }

    // 4. Determine Approval Status
    let status: 'APPROVED' | 'PENDING' = 'PENDING';
    if (isElevatedUser) {
      status = 'APPROVED'; // Admins/Editors are always auto-approved
    } else {
      if (!commentModerationManually) {
        if (commentPreviouslyApproved) {
          // Check if authorEmail has any APPROVED comment in the database
          const approvedCount = await prisma.comment.count({
            where: {
              authorEmail: finalAuthorEmail,
              status: 'APPROVED'
            }
          });
          status = approvedCount > 0 ? 'APPROVED' : 'PENDING';
        } else {
          status = 'APPROVED'; // Auto approve everyone
        }
      } else {
        status = 'PENDING'; // Force manual moderation
      }
    }

    // 5. Gather client metadata
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Parse rating safely
    const parsedRating = rating ? parseInt(rating, 10) : null;
    const finalRating = (parsedRating && parsedRating >= 1 && parsedRating <= 5) ? parsedRating : null;

    // Insert comment
    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        status,
        rating: finalRating,
        ipAddress,
        userAgent,
        authorName: finalAuthorName,
        authorEmail: finalAuthorEmail,
        authorUrl: finalAuthorUrl || null,
        userId: finalUserId,
        postId: Number(postId),
        parentId: finalParentId
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    // Hook: comment.afterSave
    await hooks.doAction(HOOK_NAMES.COMMENT_BEFORE_SAVE, newComment);

    // If an Admin/Editor responds to a pending comment, auto-approve that parent comment
    if (finalParentId && isElevatedUser) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: finalParentId }
      });
      if (parentComment && parentComment.status === 'PENDING') {
        await prisma.comment.update({
          where: { id: parentComment.id },
          data: { status: 'APPROVED' }
        });
      }
    }

    // --- BACKGROUND EMAIL TRIGGER ---
    (async () => {
      try {
        // Lấy lại cấu hình email từ db
        const settingsList = await prisma.setting.findMany();
        const s = settingsList.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => { acc[cur.key] = cur.value; return acc; }, {});

        const notifyAdmin = s.email_notify_admin_comment !== 'false';
        const notifyUserReply = s.email_notify_user_reply !== 'false';

        const adminEmail = (s.site_email || s.mail_from_email || '').trim();
        if (notifyAdmin && !isElevatedUser && adminEmail) {
          const moderationText = newComment.status === 'APPROVED' ? 'Đã duyệt tự động' : 'Đang chờ phê duyệt';
          const hostUrl = process.env.NEXTAUTH_URL || 'http://localhost:3005';
          const commentLink = `${hostUrl}/comments`;
          
          const adminHtml = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; margin-top: 0;">Bình luận mới trên website</h2>
              <p>Xin chào quản trị viên,</p>
              <p>Có một bình luận mới được gửi trên bài viết: <strong>${newComment.post?.title || 'Không rõ tiêu đề'}</strong></p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                <p style="margin: 4px 0;"><strong>Tác giả:</strong> ${newComment.authorName} (${newComment.authorEmail})</p>
                <p style="margin: 4px 0;"><strong>Nội dung:</strong></p>
                <p style="margin: 8px 0; font-style: italic; color: #4b5563;">"${newComment.content}"</p>
                <p style="margin: 4px 0;"><strong>Trạng thái:</strong> <span style="font-weight: bold; color: ${newComment.status === 'APPROVED' ? '#10b981' : '#f59e0b'};">${moderationText}</span></p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="${commentLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Quản lý bình luận trong Admin</a>
              </div>
            </div>
          `;
          
          await sendMail({
            to: adminEmail,
            subject: `[Bình luận mới] ${newComment.authorName} trên "${newComment.post?.title || 'Lexi'}"`,
            html: adminHtml
          });
        }

        // 2. Notify Parent Comment Author on Reply
        if (notifyUserReply && finalParentId) {
          const parentComment = await prisma.comment.findUnique({
            where: { id: finalParentId }
          });
          
          // Không gửi mail nếu bình luận cha là của chính mình và đảm bảo có email người nhận hợp lệ
          if (parentComment && parentComment.authorEmail && parentComment.authorEmail !== finalAuthorEmail && parentComment.authorEmail !== 'anonymous@lexi.vn') {
            const hostUrl = process.env.NEXTAUTH_URL || 'http://localhost:3005';
            
            // Link bài viết
            const post = await prisma.post.findUnique({
              where: { id: Number(postId) }
            });
            
            // Tạo link trỏ trực tiếp đến bài viết ngoài frontend
            let articleLink = hostUrl;
            if (post) {
              const permalink = s.permalink_structure || '/%postname%.html';
              if (permalink.includes('%postname%')) {
                articleLink = `${hostUrl}/${post.slug}.html`;
              } else {
                articleLink = `${hostUrl}/?p=${post.id}`;
              }
            }

            const userHtml = `
              <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; margin-top: 0;">Bình luận của bạn đã nhận được phản hồi</h2>
                <p>Xin chào ${parentComment.authorName},</p>
                <p><strong>${newComment.authorName}</strong> vừa phản hồi bình luận của bạn trên bài viết <strong>"${post?.title || 'Lexi'}"</strong>:</p>
                
                <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #9ca3af; font-size: 12px; color: #4b5563;">
                  <strong>Bình luận của bạn:</strong>
                  <p style="margin: 6px 0; font-style: italic;">"${parentComment.content}"</p>
                </div>

                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4f46e5; font-size: 13px;">
                  <strong>Phản hồi từ ${newComment.authorName}:</strong>
                  <p style="margin: 6px 0; font-style: italic; color: #1f2937;">"${newComment.content}"</p>
                </div>
                
                <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Bạn có thể xem phản hồi chi tiết hoặc tiếp tục thảo luận bằng cách nhấp vào nút dưới đây:</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${articleLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Xem thảo luận</a>
                </div>
              </div>
            `;

            await sendMail({
              to: parentComment.authorEmail,
              subject: `[Lexi] Phản hồi mới từ ${newComment.authorName} cho bình luận của bạn`,
              html: userHtml
            });
          }
        }
      } catch (err) {
        console.error('Failed to execute background email trigger:', err);
      }
    })();

    return NextResponse.json({ 
      success: true, 
      comment: {
        ...newComment,
        avatarUrl: getGravatarUrl(newComment.authorEmail)
      } 
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
