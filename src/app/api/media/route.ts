import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { hashPassword } from '@/lib/auth';
import sharp from 'sharp'; // Sử dụng thư viện Sharp để xử lý ảnh hiệu năng cao
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { hooks } from '@/lib/hooks';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';

export async function POST(req: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const hasCap = await userCan(sessionUser, 'upload_media');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền tải lên media' }, { status: 403 });
    }
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tệp tải lên' }, { status: 400 });
    }

    // ─── Hook: Validate File ────────────────────────────────────────
    const originalExtIndex = file.name.lastIndexOf('.');
    const fileExt = originalExtIndex !== -1 ? file.name.substring(originalExtIndex) : '';
    
    const validationResult = await hooks.applyFilters(CORE_HOOKS.MEDIA_VALIDATE_FILE, {
      allowed: true,
      reason: ''
    }, {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      extension: fileExt
    });

    if (validationResult && validationResult.allowed === false) {
      return NextResponse.json({ success: false, error: validationResult.reason || 'Tệp bị từ chối bởi tiện ích mở rộng.' }, { status: 400 });
    }

    // ─── Security: Strict MIME & Size check ───────────────────────
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Tệp tải lên quá lớn. Kích thước tối đa là 10MB.' }, { status: 400 });
    }

    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: `Định dạng tệp không được hỗ trợ: ${file.type}` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Đảm bảo thư mục uploads tồn tại trong content để hoạt động ổn định trên Docker/VPS
    const contentDir = process.env.CONTENT_DIR || path.join(process.cwd(), 'content');
    const uploadDir = path.join(contentDir, 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Phân loại tệp tin: Kiểm tra xem tệp tải lên có phải là ảnh nén được không (loại trừ SVG)
    const isImage = file.type.startsWith('image/') && !file.type.includes('svg');
    let finalFilename = file.name;
    let finalBuffer = buffer;
    let finalMimeType = file.type;

    let thumbnailBuffer: Buffer | null = null;
    let mediumBuffer: Buffer | null = null;
    let largeBuffer: Buffer | null = null;

    if (isImage) {
      // Chuẩn hóa tên file nhưng giữ nguyên đuôi/mime gốc thay vì ép sang WebP.
      const originalExtIndex = file.name.lastIndexOf('.');
      const rawBaseName = originalExtIndex !== -1 ? file.name.substring(0, originalExtIndex) : file.name;
      const cleanBaseName = rawBaseName.replace(/[^a-zA-Z0-9\-_]/g, '');
      const fallbackExt = fileExt || '.jpg';
      const safeFilename = `${cleanBaseName || 'image'}${fallbackExt}`.replace(/[^a-zA-Z0-9.\-_]/g, '');
      finalFilename = safeFilename || `image${fallbackExt}`;

      const isOptimizableRaster = file.type === 'image/jpeg' || file.type === 'image/png';

      if (isOptimizableRaster) {
        try {
          const baseSharp = sharp(buffer).resize({
            width: 1600,
            withoutEnlargement: true // Không phóng to nếu ảnh gốc nhỏ hơn 1600px
          });

          const compressed = file.type === 'image/png'
            ? await baseSharp.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
            : await baseSharp.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
          
          finalBuffer = Buffer.from(compressed);
          finalMimeType = file.type;

          // Tạo các buffer phụ cho các kích thước khác nhau, giữ đúng định dạng gốc
          const outputVariant = async (pipeline: sharp.Sharp) => {
            if (file.type === 'image/png') {
              return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
            }
            return pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
          };

          try {
            const thumb = await outputVariant(sharp(buffer).resize(150, 150, { fit: 'cover' }));
            thumbnailBuffer = Buffer.from(thumb);
          } catch (err) {
            console.error('Error generating thumbnail:', err);
          }

          try {
            const med = await outputVariant(sharp(buffer).resize({ width: 300, withoutEnlargement: true }));
            mediumBuffer = Buffer.from(med);
          } catch (err) {
            console.error('Error generating medium image:', err);
          }

          try {
            const lrg = await outputVariant(sharp(buffer).resize({ width: 1024, withoutEnlargement: true }));
            largeBuffer = Buffer.from(lrg);
          } catch (err) {
            console.error('Error generating large image:', err);
          }
        } catch (err) {
          console.error('Error optimizing image, falling back to original file:', err);
          finalFilename = safeFilename || `image${fallbackExt}`;
          finalBuffer = buffer;
          finalMimeType = file.type;
        }
      }
    } else {
      // Chuẩn hóa tên file cho các tài liệu phi hình ảnh
      finalFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    }

    // ─── Hook: Before Upload ───────────────────────────────────────
    const beforeUploadData = await hooks.applyFilters(CORE_HOOKS.MEDIA_BEFORE_UPLOAD, {
      finalFilename,
      finalMimeType,
      finalBuffer
    }, file);
    
    if (beforeUploadData) {
      if (beforeUploadData.finalFilename) finalFilename = beforeUploadData.finalFilename;
      if (beforeUploadData.finalMimeType) finalMimeType = beforeUploadData.finalMimeType;
      if (beforeUploadData.finalBuffer) finalBuffer = beforeUploadData.finalBuffer;
    }

    // Tạo tên tệp độc nhất để tránh bị ghi đè
    const uniqueFilename = `${Date.now()}-${finalFilename}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Lưu tệp đã tối ưu hóa xuống đĩa cứng
    await fs.writeFile(filePath, finalBuffer);

    // Lưu các file độ phân giải phụ
    const dotIndex = uniqueFilename.lastIndexOf('.');
    const baseUnique = dotIndex !== -1 ? uniqueFilename.substring(0, dotIndex) : uniqueFilename;
    const extUnique = dotIndex !== -1 ? uniqueFilename.substring(dotIndex) : '';

    if (thumbnailBuffer) {
      await fs.writeFile(path.join(uploadDir, `${baseUnique}-150x150${extUnique}`), thumbnailBuffer);
    }
    if (mediumBuffer) {
      await fs.writeFile(path.join(uploadDir, `${baseUnique}-300x300${extUnique}`), mediumBuffer);
    }
    if (largeBuffer) {
      await fs.writeFile(path.join(uploadDir, `${baseUnique}-1024x1024${extUnique}`), largeBuffer);
    }

    // Lưu siêu dữ liệu vào cơ sở dữ liệu
    const relativeUrl = `/uploads/${uniqueFilename}`;
    
    const media = await prisma.media.create({
      data: {
        filename: file.name, // Giữ tên gốc để đối chiếu khi cần
        url: relativeUrl,
        mimeType: finalMimeType,
        size: finalBuffer.length, // Lưu kích thước thực tế sau khi đã tối ưu hóa
        uploaderId: sessionUser.id
      }
    });

    // ─── Hook: After Upload ───────────────────────────────────────
    hooks.doAction(CORE_HOOKS.MEDIA_AFTER_UPLOAD, media).catch(err => {
      console.error('Error in MEDIA_AFTER_UPLOAD hook:', err);
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error('Error uploading media:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rawMediaList = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Transform URLs
    const mediaList = await Promise.all(
      rawMediaList.map(async (media: (typeof rawMediaList)[number]) => {
        const transformedUrl = await hooks.applyFilters(CORE_HOOKS.MEDIA_TRANSFORM_URL, media.url, media);
        return {
          ...media,
          url: transformedUrl
        };
      })
    );

    // Fetch library actions
    const rawActions = await hooks.applyFilters(CORE_HOOKS.MEDIA_LIBRARY_ACTIONS, []);
    let libraryActions: any[] = [];
    if (Array.isArray(rawActions)) {
      libraryActions = rawActions.filter(item => 
        item && typeof item === 'object' && typeof item.actionId === 'string' && typeof item.label === 'string'
      );
    }

    return NextResponse.json({ success: true, mediaList, libraryActions });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
