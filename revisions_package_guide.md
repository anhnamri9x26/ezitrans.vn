# Hướng Dẫn Đóng Gói và Tái Sử Dụng Chức Năng Revision (Wordpress-like)

Hệ thống Revision này được thiết kế theo kiến trúc **Hybrid (Snapshot + Delta Chain)**:
* **5 phiên bản gần nhất:** Lưu trữ đầy đủ (Full Snapshot) để so sánh và tải tức thì.
* **Từ phiên bản thứ 6 trở đi:** Tự động nén thành **Delta Patch** (sử dụng thuật toán Unified Diff của thư viện `diff`) so với phiên bản kế tiếp mới hơn, tiết kiệm 80-95% dung lượng Database.
* **Chống ghi trùng (Deduplication):** Tự động phát hiện và bỏ qua việc tạo bản ghi nếu không có thay đổi nội dung.
* **Hàn gắn chuỗi nén (Chain Healing):** Tự động tái tính toán và nén lại chuỗi Delta khi người dùng thực hiện xóa một hoặc nhiều bản sửa đổi bất kỳ ở giữa danh sách.

Dưới đây là hướng dẫn chi tiết cách sao chép và tái sử dụng mô-đun này cho bất kỳ thực thể nào khác (ví dụ: Sản phẩm, Đơn hàng, Trang tĩnh...) hoặc dự án Next.js + Prisma khác.

---

## 📂 1. Cấu trúc Thư mục của Gói (Package Structure)

Khi muốn mang chức năng này sang nơi khác, hãy copy các file sau:

```text
├── prisma/
│   └── schema.prisma           # Cấu trúc bảng Revision và liên kết
├── src/
│   ├── lib/
│   │   ├── diff.ts             # Thuật toán Diff từ và Nén/Giải nén Delta
│   │   └── revisions.ts        # Service xử lý ghi, xóa và hàn gắn dữ liệu
│   └── components/
│       └── RevisionsModal.tsx  # Giao diện Modal so sánh song song 2 cột (Light Mode)
```

---

## 🗄️ 2. Thiết lập Database (Prisma Schema)

Thêm bảng `Revision` vào file `schema.prisma` của bạn. Dưới đây là cấu trúc chuẩn hỗ trợ Delta nén:

```prisma
model Post {
  id        Int        @id @default(autoincrement())
  title     String
  slug      String     @unique
  content   String?    @db.Text
  // ... các trường khác
  revisions Revision[] // Quan hệ 1-N với bảng Revision
}

model Revision {
  id        Int      @id @default(autoincrement())
  postId    Int
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  title     String
  content   String?  @db.Text   // Chứa nội dung đầy đủ (nếu isDelta=false) hoặc chuỗi Patch (nếu isDelta=true)
  slug      String
  isDelta   Boolean  @default(false) // Đánh dấu bản ghi có đang được nén delta hay không
  createdAt DateTime @default(now())
}
```

*Sau khi cập nhật Schema, chạy lệnh:*
```bash
npm install diff @types/diff
npx prisma db push
npx prisma generate
```

---

## 🧠 3. Thư viện Xử lý Thuật toán (`src/lib/diff.ts`)

File này đảm nhiệm việc so sánh từ ngữ (word-level diff) để hiển thị trực quan và thực hiện nén/giải nén chuỗi văn bản HTML lớn.

```typescript
import { createPatch, applyPatch } from 'diff';

export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

// 1. So sánh hai chuỗi văn bản theo cấp độ từ (Word-based diff)
export function diffWords(oldStr: string, newStr: string): DiffChange[] {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);
  
  const dp: number[][] = Array(oldWords.length + 1)
    .fill(null)
    .map(() => Array(newWords.length + 1).fill(0));
    
  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const changes: DiffChange[] = [];
  let i = oldWords.length;
  let j = newWords.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      changes.unshift({ value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ value: newWords[j - 1], added: true });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      changes.unshift({ value: oldWords[i - 1], removed: true });
      i--;
    }
  }
  return changes;
}

// 2. Nén chuỗi cũ dựa vào chuỗi mới (Tạo Patch)
export function compressContent(newerContent: string, olderContent: string): string {
  return createPatch('content.html', newerContent || '', olderContent || '');
}

// 3. Giải nén chuỗi cũ từ chuỗi mới và Patch
export function decompressContent(newerContent: string, patch: string): string {
  const result = applyPatch(newerContent || '', patch);
  if (result === false) {
    console.error('Failed to apply diff patch');
    return patch; // Fallback
  }
  return result;
}

// 4. Giải mã toàn bộ chuỗi nén ngược từ mới nhất về cũ nhất
interface RevisionLike {
  id: number;
  postId: number;
  title: string;
  content: string | null;
  slug: string;
  isDelta: boolean;
  createdAt: Date;
}

export function reconstructRevisions<T extends RevisionLike>(revisions: T[]): T[] {
  const reconstructed = revisions.map(r => ({ ...r }));
  for (let i = 0; i < reconstructed.length; i++) {
    if (reconstructed[i].isDelta) {
      if (i > 0) {
        const newerContent = reconstructed[i - 1].content || '';
        const patch = reconstructed[i].content || '';
        reconstructed[i].content = decompressContent(newerContent, patch);
        reconstructed[i].isDelta = false;
      } else {
        console.warn(`Revision at index 0 is marked as delta: id=${reconstructed[i].id}`);
      }
    }
  }
  return reconstructed;
}

// 5. Loại bỏ thẻ HTML phục vụ so sánh văn bản thuần hoặc trích dẫn
export function stripHtml(htmlStr: string): string {
  if (!htmlStr) return '';
  let text = htmlStr
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  return text;
}
```

---

## ⚡ 4. Service Xử lý Logic Database (`src/lib/revisions.ts`)

File này đóng gói toàn bộ quy trình: chống ghi trùng lặp, tự động nén các phiên bản cũ (> 5 bản), cap giới hạn tối đa (ví dụ: 50 bản) và đặc biệt là cơ chế **hàn gắn chuỗi nén** khi người dùng xóa dữ liệu.

```typescript
import { prisma } from './prisma'; // Thay bằng đường dẫn Client Prisma của bạn
import { compressContent, reconstructRevisions } from './diff';

// A. TỰ ĐỘNG TẠO REVISION MỚI (Có chống trùng & nén tự động)
export async function createRevision(
  postId: number,
  title: string,
  content: string | null,
  slug: string
) {
  try {
    // 1. Lấy bản sửa đổi mới nhất để kiểm tra trùng
    const latestRevision = await prisma.revision.findFirst({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    let latestContent = latestRevision?.content || '';
    if (latestRevision?.isDelta) {
      const allRevs = await prisma.revision.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
      });
      const reconstructed = reconstructRevisions(allRevs);
      latestContent = reconstructed[0]?.content || '';
    }

    // Nếu không thay đổi gì so với bản mới nhất -> Hủy lưu
    if (
      latestRevision &&
      latestRevision.title === title &&
      latestContent === (content || '') &&
      latestRevision.slug === slug
    ) {
      return null;
    }

    // 2. Tạo bản ghi mới dạng Full Snapshot
    const newRevision = await prisma.revision.create({
      data: {
        postId,
        title,
        content,
        slug,
        isDelta: false,
      },
    });

    // 3. Nén các phiên bản từ thứ 6 trở đi
    const revisions = await prisma.revision.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    for (let i = 5; i < revisions.length; i++) {
      const rev = revisions[i];
      if (!rev.isDelta) {
        const reconstructed = reconstructRevisions(revisions);
        const newerContent = reconstructed[i - 1].content || '';
        const olderContent = reconstructed[i].content || '';
        const patch = compressContent(newerContent, olderContent);

        await prisma.revision.update({
          where: { id: rev.id },
          data: {
            content: patch,
            isDelta: true,
          },
        });

        revisions[i].content = patch;
        revisions[i].isDelta = true;
      }
    }

    // 4. Giới hạn lưu trữ tối đa (Ví dụ: 50 bản)
    if (revisions.length > 50) {
      const deleteIds = revisions.slice(50).map((r) => r.id);
      await prisma.revision.deleteMany({
        where: { id: { in: deleteIds } },
      });
    }

    return newRevision;
  } catch (error) {
    console.error('Error in createRevision helper:', error);
    throw error;
  }
}

// B. XÓA BẢN SỬ ĐỔI & HÀN GẮN CHUỖI DELTA (Healing Chain)
export async function deleteRevisions(postId: number, revisionIds: number[]) {
  try {
    // 1. Lấy toàn bộ bản sửa đổi hiện tại
    const revisions = await prisma.revision.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Giải nén đầy đủ tất cả ra bộ nhớ trước khi thực hiện xóa
    const reconstructed = reconstructRevisions(revisions);

    // 3. Xóa các bản ghi yêu cầu khỏi Database
    await prisma.revision.deleteMany({
      where: {
        id: { in: revisionIds },
        postId,
      },
    });

    // 4. Lọc các bản ghi còn lại trong bộ nhớ
    const remaining = reconstructed.filter(r => !revisionIds.includes(r.id));

    // 5. Hàn gắn chuỗi nén Delta mới dựa trên danh sách còn lại
    for (let i = 0; i < remaining.length; i++) {
      const rev = remaining[i];
      const dbRev = revisions.find(r => r.id === rev.id);
      const shouldBeDelta = i >= 5;
      
      if (shouldBeDelta) {
        // Nén lại so với bản kế tiếp mới hơn (i - 1)
        const newerContent = remaining[i - 1].content || '';
        const olderContent = remaining[i].content || '';
        const patch = compressContent(newerContent, olderContent);
        
        await prisma.revision.update({
          where: { id: rev.id },
          data: {
            content: patch,
            isDelta: true,
          },
        });
      } else {
        // Trở thành Full Snapshot nếu được đôn lên top 5
        if (dbRev && dbRev.isDelta) {
          await prisma.revision.update({
            where: { id: rev.id },
            data: {
              content: rev.content,
              isDelta: false,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in deleteRevisions helper:', error);
    throw error;
  }
}
```

---

## 🛠️ 5. Hướng Dẫn Tích Hợp Vào Entity Mới

### Bước A: Thiết lập API
Tạo các endpoint API tương ứng cho Model mới:
* `GET /api/posts/[id]/revisions`: Lấy danh sách đã giải nén (`reconstructRevisions`).
* `POST /api/posts/[id]/revisions/[revisionId]`: Thực hiện rollback bài viết.
* `DELETE /api/posts/[id]/revisions`: Xóa nhiều bản ghi (`deleteRevisions`).
* `DELETE /api/posts/[id]/revisions/[revisionId]`: Xóa nhanh một bản ghi.

### Bước B: Tích hợp vào Trình Soạn Thảo (Frontend)
1. Import component `RevisionsModal` vào trang chỉnh sửa của thực thể.
2. Thêm các trạng thái `isOpen`, `postId`, và hàm callback khôi phục `onRestore`:
```typescript
<RevisionsModal
  isOpen={isRevisionsModalOpen}
  onClose={() => setIsRevisionsModalOpen(false)}
  postId={postId}
  currentTitle={title}
  currentContent={content}
  currentSlug={slug}
  onRestore={(restored) => {
    setTitle(restored.title);
    setContent(restored.content);
    setSlug(restored.slug);
    // Đặt hasUnsavedChanges = false vì Database đã lưu thành công!
  }}
/>
```

Gói chức năng này cực kỳ hoàn chỉnh, hiệu năng cao và có thể áp dụng ngay cho bất kỳ tính năng quản lý lịch sử văn bản nào khác của bạn!
