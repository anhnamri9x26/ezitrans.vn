import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { runWordPressSQLMigration, runWordPressWxrMigration, downloadAndSyncImage, parseSqlInsertLine, cleanWordPressShortcodes } from '@/lib/importer';
import { parseWxrFile, summarizeWxr } from '@/lib/wordpress-wxr';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

// Scan the /storage/imports/ directory for all .sql files
export async function getImportFiles() {
  const storageDir = path.join(process.cwd(), 'storage', 'imports');
  try {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    const files = fs.readdirSync(storageDir);
    const importFiles = files
      .filter(f => ['.sql', '.xml'].includes(path.extname(f).toLowerCase()))
      .map(f => {
        const fullPath = path.join(storageDir, f);
        const stats = fs.statSync(fullPath);
        return {
          name: f,
          path: fullPath.replace(/\\/g, '/'),
          sizeMb: parseFloat((stats.size / (1024 * 1024)).toFixed(2)),
          format: path.extname(f).toLowerCase() === '.xml' ? 'xml' : 'sql'
        };
      });
    return importFiles;
  } catch (e) {
    console.error('Failed to scan import files:', e);
    return [];
  }
}

// Generate pre-import statistics/summary from the SQL backup file
async function generateMigrationSummary(filePath: string) {
  const counts = {
    posts: 0,
    pages: 0,
    users: 0,
    categories: 0,
    tags: 0,
    images: 0,
    totalTerms: 0
  };

  if (!fs.existsSync(filePath)) {
    return counts;
  }

  try {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let currentInsert = '';

    for await (const line of rl) {
      try {
        const trimmed = line.trim();
        if (trimmed.startsWith('INSERT INTO `')) {
          currentInsert = trimmed;
        } else if (currentInsert && !trimmed.startsWith('INSERT INTO') && (trimmed.includes('(') || trimmed)) {
          currentInsert += '\n' + trimmed;
        }

        if (currentInsert && currentInsert.endsWith(';')) {
          const stmt = currentInsert;
          currentInsert = '';

          // Match: INSERT INTO `prefix_tablename`
          const match = stmt.match(/^INSERT\s+INTO\s+\`?([a-zA-Z0-9_]+)_(users|posts|terms|term_taxonomy)\`?/i);
          if (!match) continue;

          const tableType = match[2].toLowerCase();
          
          if (tableType === 'users') {
            const tuples = parseSqlInsertLine(stmt);
            counts.users += tuples.length;
          } else if (tableType === 'terms') {
            const tuples = parseSqlInsertLine(stmt);
            counts.totalTerms += tuples.length;
          } else if (tableType === 'term_taxonomy') {
            const tuples = parseSqlInsertLine(stmt);
            for (const row of tuples) {
              const taxonomy = row[2];
              if (taxonomy === 'category') counts.categories++;
              else if (taxonomy === 'post_tag') counts.tags++;
            }
          } else if (tableType === 'posts') {
            const tuples = parseSqlInsertLine(stmt);
            for (const row of tuples) {
              const postType = row[20] || 'post';
              const isPost = postType === 'post';
              const isPage = postType === 'page';
              const isService = postType === 'service';

              if (isPost) {
                counts.posts++;
              } else if (isPage) {
                counts.pages++;
              }

              if (isPost || isPage || isService) {
                const postContent = row[4] || '';
                const imgRegex = /src=["'](?:https?:\/\/(?:www\.)?lexi\.vn)?(\/wp-content\/uploads\/[^"']+)["']/gi;
                let imgMatch;
                while ((imgMatch = imgRegex.exec(postContent)) !== null) {
                  counts.images++;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error parsing line for summary:', err);
      }
    }
  } catch (err) {
    console.error('Failed to read SQL for summary:', err);
  }

  return counts;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const hasCap = await userCan(user, 'manage_tools');
  if (!hasCap) {
    return NextResponse.json({ success: false, error: 'Bạn không có quyền sử dụng công cụ' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const checkStatus = searchParams.get('status') === 'true';
  const scanImages = searchParams.get('scan-images') === 'true';
  const checkSummary = searchParams.get('summary') === 'true';
  const selectedFile = searchParams.get('file');

  // 1. Return migration summary counts if requested
  if (checkSummary && selectedFile) {
    try {
      const importFiles = await getImportFiles();
      const targetFile = importFiles.find(f => f.name === selectedFile);
      if (!targetFile || !fs.existsSync(targetFile.path)) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy file SQL' }, { status: 404 });
      }

      const summary = targetFile.format === 'xml'
        ? summarizeWxr(parseWxrFile(targetFile.path))
        : await generateMigrationSummary(targetFile.path);
      return NextResponse.json({ success: true, summary });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // 2. Scan for missing images in already imported posts
  if (scanImages) {
    try {
      const posts = await prisma.post.findMany({
        select: { id: true, content: true, title: true }
      });

      const missingImages = new Set<string>();
      let totalImagesFound = 0;

      const imgRegex = /src=["'](?:https?:\/\/(?:www\.)?lexi\.vn)?(\/wp-content\/uploads\/[^"']+)["']/gi;

      for (const post of posts) {
        if (!post.content) continue;
        let match;
        while ((match = imgRegex.exec(post.content)) !== null) {
          totalImagesFound++;
          const relativeImagePath = match[1];
          const cleanPath = relativeImagePath.startsWith('/') ? relativeImagePath.slice(1) : relativeImagePath;
          const destPath = path.join(process.cwd(), 'public', cleanPath);

          if (!fs.existsSync(destPath)) {
            missingImages.add(relativeImagePath);
          }
        }
      }

      return NextResponse.json({
        success: true,
        totalImagesFound,
        missingImagesCount: missingImages.size,
        missingImages: Array.from(missingImages)
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // 2. Return real-time progress if status is requested
  if (checkStatus) {
    try {
      const progressSetting = await prisma.setting.findUnique({
        where: { key: 'import_progress' }
      });

      if (!progressSetting) {
        return NextResponse.json({
          success: true,
          progress: { status: 'idle', logs: ['Chưa có tiến trình import nào chạy.'] }
        });
      }

      return NextResponse.json({
        success: true,
        progress: JSON.parse(progressSetting.value)
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // 2. Otherwise, scan all local SQL files and return metadata + schema definitions for drag & drop
  try {
    const importFiles = await getImportFiles();
    const hasFiles = importFiles.length > 0;
    const defaultFile = importFiles.find(f => f.name.endsWith('.xml')) || importFiles.find(f => f.name === 'lexi.sql') || importFiles[0] || null;

    // WordPress tables column definitions (derived from analysis)
    const wpPostsColumns = [
      { name: 'ID', type: 'bigint', desc: 'ID bài viết gốc (Khóa chính)' },
      { name: 'post_author', type: 'bigint', desc: 'ID tác giả' },
      { name: 'post_date', type: 'datetime', desc: 'Ngày đăng bài' },
      { name: 'post_content', type: 'longtext', desc: 'Nội dung bài viết' },
      { name: 'post_title', type: 'text', desc: 'Tiêu đề bài viết' },
      { name: 'post_excerpt', type: 'text', desc: 'Tóm tắt bài viết' },
      { name: 'post_status', type: 'varchar', desc: 'Trạng thái (publish, draft...)' },
      { name: 'post_name', type: 'varchar', desc: 'Slug URL bài viết' },
      { name: 'post_parent', type: 'bigint', desc: 'ID bài cha (cho Page)' },
      { name: 'post_type', type: 'varchar', desc: 'Loại bài viết (post, page, attachment...)' }
    ];

    const wpUsersColumns = [
      { name: 'ID', type: 'bigint', desc: 'ID thành viên' },
      { name: 'user_login', type: 'varchar', desc: 'Tên đăng nhập' },
      { name: 'user_pass', type: 'varchar', desc: 'Mật khẩu đã mã hóa' },
      { name: 'user_email', type: 'varchar', desc: 'Địa chỉ Email' },
      { name: 'user_registered', type: 'datetime', desc: 'Ngày đăng ký thành viên' },
      { name: 'display_name', type: 'varchar', desc: 'Tên hiển thị' }
    ];

    // Destination tables columns (our Prisma system)
    const systemPostFields = [
      { name: 'title', type: 'String', required: true, desc: 'Tiêu đề bài viết' },
      { name: 'slug', type: 'String', required: true, desc: 'Đường dẫn tĩnh URL (Slug)' },
      { name: 'content', type: 'String', required: false, desc: 'Nội dung chi tiết bài viết' },
      { name: 'excerpt', type: 'String', required: false, desc: 'Đoạn trích mô tả ngắn' },
      { name: 'status', type: 'PostStatus', required: true, desc: 'Trạng thái (PUBLISHED, DRAFT)' },
      { name: 'type', type: 'PostType', required: true, desc: 'Phân loại (POST, PAGE, SERVICE)' },
      { name: 'publishedAt', type: 'DateTime', required: true, desc: 'Ngày giờ xuất bản' },
      { name: 'authorId', type: 'Int', required: true, desc: 'ID Tác giả biên soạn' },
      { name: 'legacyId', type: 'Int', required: false, desc: 'ID bài viết cũ từ Wordpress' }
    ];

    const systemUserFields = [
      { name: 'username', type: 'String', required: true, desc: 'Tên tài khoản đăng nhập' },
      { name: 'email', type: 'String', required: true, desc: 'Địa chỉ Email duy nhất' },
      { name: 'password', type: 'String', required: true, desc: 'Mật khẩu mã hóa bảo mật' },
      { name: 'name', type: 'String', required: false, desc: 'Họ và tên hiển thị' },
      { name: 'role', type: 'Role', required: true, desc: 'Phân quyền (ADMIN, SUBSCRIBER...)' }
    ];

    return NextResponse.json({
      success: true,
      exists: hasFiles,
      sqlFiles: importFiles,
      defaultFile,
      schemas: {
        wordpress: {
          wp_posts: wpPostsColumns,
          wp_users: wpUsersColumns
        },
        system: {
          Post: systemPostFields,
          User: systemUserFields
        }
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_tools');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền sử dụng công cụ' }, { status: 403 });
    }
    const body = await req.json();
    const { fieldMapping, options } = body;

    const importFiles = await getImportFiles();
    const targetFile = importFiles.find(f => f.name === options?.selectedSqlFile) || 
                       importFiles.find(f => f.name === 'lexi.sql') ||
                       importFiles[0] || 
                       null;

    if (!targetFile || !fs.existsSync(targetFile.path)) {
      return NextResponse.json({
        success: false,
        error: `Không tìm thấy file SQL nào để xử lý. Vui lòng đặt tệp tin SQL vào thư mục gốc của trang web.`
      }, { status: 404 });
    }

    // Trigger migration in the background
    const result = targetFile.format === 'xml'
      ? await runWordPressWxrMigration(targetFile.path, {
          onlyPublished: options?.onlyPublished ?? false, defaultAuthorId: options?.defaultAuthorId ?? 1,
          convertLinks: options?.convertLinks ?? true, downloadImages: options?.downloadImages ?? true,
          importPosts: options?.importPosts ?? true, importPages: options?.importPages ?? true,
          importUsers: options?.importUsers ?? true, importCategories: options?.importCategories ?? true,
          importComments: options?.importComments ?? true, importMedia: options?.importMedia ?? true,
          importSeoMeta: options?.importSeoMeta ?? true, cleanShortcodes: options?.cleanShortcodes ?? true,
          strategy: options?.strategy ?? 'merge', dryRun: options?.dryRun ?? false, dryRunRows: options?.dryRunRows ?? 10
        })
      : await runWordPressSQLMigration(
      targetFile.path,
      fieldMapping || {
        wp_posts: {
          title: 'post_title',
          content: 'post_content',
          excerpt: 'post_excerpt',
          status: 'post_status',
          slug: 'post_name',
          type: 'post_type',
          legacyId: 'ID',
          publishedAt: 'post_date'
        },
        wp_users: {
          username: 'user_login',
          email: 'user_email',
          name: 'display_name',
          password: 'user_pass',
          createdAt: 'user_registered'
        }
      },
      {
        cleanElementorHtml: options?.cleanElementorHtml ?? true,
        onlyPublished: options?.onlyPublished ?? false,
        defaultAuthorId: options?.defaultAuthorId ?? 1,
        convertLinks: options?.convertLinks ?? true,
        downloadImages: options?.downloadImages ?? true,
        importPosts: options?.importPosts ?? true,
        importPages: options?.importPages ?? true,
        importUsers: options?.importUsers ?? true,
        importCategories: options?.importCategories ?? true,
        strategy: options?.strategy ?? 'merge',
        skipBrokenMedia: options?.skipBrokenMedia ?? true,
        dryRun: options?.dryRun ?? false,
        dryRunRows: options?.dryRunRows ?? 10
      }
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_tools');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền sử dụng công cụ' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const cleanAbsoluteLinks = body.cleanAbsoluteLinks !== false;
    const cleanShortcodes = body.cleanShortcodes !== false;
    const downloadImages = body.downloadImages !== false;

    const posts = await prisma.post.findMany({
      select: { id: true, content: true, title: true }
    });

    let updatedCount = 0;

    for (const post of posts) {
      if (!post.content) continue;

      let isModified = false;
      let cleanedContent = post.content;

      if (cleanAbsoluteLinks) {
        if (/https?:\/\/(www\.)?lexi\.vn/gi.test(cleanedContent)) {
          cleanedContent = cleanedContent.replace(/https?:\/\/(www\.)?lexi\.vn\/?/gi, '/');
          isModified = true;
        }
      }

      if (cleanShortcodes) {
        const originalBeforeShortcodes = cleanedContent;
        cleanedContent = cleanWordPressShortcodes(cleanedContent);
        if (cleanedContent !== originalBeforeShortcodes) {
          isModified = true;
        }
      }

      if (downloadImages) {
        // Check and download any WordPress images in this post
        const imgRegex = /src=["'](?:https?:\/\/(?:www\.)?lexi\.vn)?(\/wp-content\/uploads\/[^"']+)["']/gi;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(cleanedContent)) !== null) {
          const relativeImagePath = imgMatch[1];
          try {
            await downloadAndSyncImage(relativeImagePath);
          } catch (e) {
            console.error(`Lỗi tải ảnh trong dọn dẹp bài viết cũ: ${relativeImagePath}`, e);
          }
        }
      }

      if (isModified) {
        await prisma.post.update({
          where: { id: post.id },
          data: { content: cleanedContent }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã xử lý thành công cho ${updatedCount} bài viết!`,
      updatedCount
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Reset/clear import progress
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_tools');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền sử dụng công cụ' }, { status: 403 });
    }
    await prisma.setting.deleteMany({
      where: { key: 'import_progress' }
    });
    return NextResponse.json({ success: true, message: 'Đã reset tiến trình import.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 550 });
  }
}
