import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PostStatus, PostType, Role, CommentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// In-memory status tracking for import progress
export interface ImportProgress {
  status: 'idle' | 'running' | 'completed' | 'failed';
  processedLines: number;
  totalLinesEstimated: number;
  usersImported: number;
  postsImported: number;
  categoriesImported: number;
  tagsImported: number;
  commentsImported: number;
  error?: string;
  logs: string[];
  startTime?: Date;
  endTime?: Date;
}

// SQL parser helper that splits a VALUES clause into individual rows,
// taking into account quotes, escape sequences, and parenthesis.
export function parseSqlInsertLine(line: string): any[][] {
  const result: any[][] = [];
  const valuesIndex = line.indexOf('VALUES');
  if (valuesIndex === -1) return [];

  // Get the string containing all the tuples, e.g. "(1, 'a'), (2, 'b')"
  // Slice off the "INSERT INTO `tbl` VALUES " part and the trailing semicolon ";"
  let dataStr = line.slice(valuesIndex + 6).trim();
  if (dataStr.endsWith(';')) {
    dataStr = dataStr.slice(0, -1);
  }

  let inString = false;
  let escaped = false;
  let currentTuple = '';
  let inTuple = false;
  let stringChar = '';

  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr[i];

    if (escaped) {
      currentTuple += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      currentTuple += char;
      escaped = true;
      continue;
    }

    if (inString) {
      currentTuple += char;
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      inString = true;
      stringChar = char;
      currentTuple += char;
      continue;
    }

    if (char === '(' && !inTuple) {
      inTuple = true;
      currentTuple = '';
      continue;
    }

    if (char === ')' && inTuple) {
      inTuple = false;
      // Parse currentTuple into values
      result.push(parseTupleValues(currentTuple));
      currentTuple = '';
      continue;
    }

    if (inTuple) {
      currentTuple += char;
    }
  }

  return result;
}

// Splits the comma-separated values inside a single tuple
function parseTupleValues(tupleStr: string): any[] {
  const result: any[] = [];
  let currentVal = '';
  let inString = false;
  let escaped = false;
  let stringChar = '';

  for (let i = 0; i < tupleStr.length; i++) {
    const char = tupleStr[i];

    if (escaped) {
      currentVal += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      currentVal += char;
      escaped = true;
      continue;
    }

    if (inString) {
      currentVal += char;
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
      currentVal += char;
      continue;
    }

    if (char === ',' && !inString) {
      result.push(cleanSqlValue(currentVal.trim()));
      currentVal = '';
      continue;
    }

    currentVal += char;
  }

  if (currentVal.trim()) {
    result.push(cleanSqlValue(currentVal.trim()));
  }

  return result;
}

// Cleans up a SQL value string: unescapes strings, converts numbers, handles NULL
function cleanSqlValue(val: string): any {
  if (val === 'NULL' || val === 'null' || val === '') return null;
  
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    // Unescape common characters
    return val.slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  if (!isNaN(val as any)) {
    return Number(val);
  }

  return val;
}

// Save dynamic progress inside database to allow API polling from different threads/processes safely
export async function updateImportProgressInDB(progress: ImportProgress) {
  try {
    await prisma.setting.upsert({
      where: { key: 'import_progress' },
      update: { value: JSON.stringify(progress) },
      create: { key: 'import_progress', value: JSON.stringify(progress) }
    });
  } catch (err) {
    console.error('Failed to update import progress in DB:', err);
  }
}

// Main WordPress SQL importer process
export async function runWordPressSQLMigration(
  filePath: string,
  fieldMapping: {
    wp_posts: Record<string, string>;
    wp_users: Record<string, string>;
  },
  options: {
    cleanElementorHtml?: boolean;
    onlyPublished?: boolean;
    defaultAuthorId: number;
    convertLinks?: boolean;
    downloadImages?: boolean;
    importPosts?: boolean;
    importPages?: boolean;
    importUsers?: boolean;
    importCategories?: boolean;
    strategy?: 'merge' | 'replace' | 'skip';
    skipBrokenMedia?: boolean;
    dryRun?: boolean;
    dryRunRows?: number;
  }
) {
  const logLimit = 150;
  const isDryRun = options.dryRun === true;
  const strategy = options.strategy ?? 'merge';
  const skipBrokenMedia = options.skipBrokenMedia ?? true;
  const dryRunRows = options.dryRunRows ?? 10;

  const progress: ImportProgress = {
    status: 'running',
    processedLines: 0,
    totalLinesEstimated: 600000, // Estimate for a 150MB file
    usersImported: 0,
    postsImported: 0,
    categoriesImported: 0,
    tagsImported: 0,
    commentsImported: 0,
    logs: [isDryRun ? '[Dry Run] Bắt đầu mô phỏng tiến trình import...' : 'Bắt đầu đọc file SQL...'],
    startTime: new Date()
  };

  await updateImportProgressInDB(progress);

  // Background migration
  (async () => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Không tìm thấy file SQL tại đường dẫn: ${filePath}`);
      }

      const fileStats = fs.statSync(filePath);
      const addLog = async (msg: string) => {
        console.log(msg);
        progress.logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
        if (progress.logs.length > logLimit) {
          progress.logs.shift(); // Keep logs memory usage low
        }
        await updateImportProgressInDB(progress);
      };

      await addLog(
        isDryRun 
          ? `[Dry Run] Đang chạy thử nghiệm từ file SQL (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB)...`
          : `Đang import từ file SQL (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB)...`
      );

      // 1. First parse Terms (wp_terms, wp_term_taxonomy, wp_term_relationships)
      const wpTerms: Record<number, { name: string; slug: string }> = {};
      const wpTaxonomies: Record<number, { termId: number; taxonomy: string; parent: number }> = {};
      const wpPostRelationships: { objectId: number; termTaxonomyId: number }[] = [];

      // Dictionaries to map WordPress column positions (indexes)
      let postsColumns: string[] = [];
      let usersColumns: string[] = [];
      let termsColumns: string[] = [];
      let termTaxonomyColumns: string[] = [];
      let termRelationshipsColumns: string[] = [];

      const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let currentInsertStatement = '';

      for await (const line of rl) {
        progress.processedLines++;
        
        // Show progress occasionally
        if (progress.processedLines % 5000 === 0) {
          await updateImportProgressInDB(progress);
        }

        // Detect CREATE TABLE to parse columns order
        if (line.startsWith('CREATE TABLE `wp_posts`')) {
          postsColumns = [];
          continue;
        }
        if (line.startsWith('CREATE TABLE `wp_users`')) {
          usersColumns = [];
          continue;
        }
        if (line.startsWith('CREATE TABLE `wp_terms`')) {
          termsColumns = [];
          continue;
        }
        if (line.startsWith('CREATE TABLE `wp_term_taxonomy`')) {
          termTaxonomyColumns = [];
          continue;
        }
        if (line.startsWith('CREATE TABLE `wp_term_relationships`')) {
          termRelationshipsColumns = [];
          continue;
        }

        // Accumulate columns if in CREATE TABLE block
        if (postsColumns && line.trim().startsWith('`')) {
          const colName = line.trim().split('`')[1];
          if (colName) postsColumns.push(colName);
        }
        if (usersColumns && line.trim().startsWith('`')) {
          const colName = line.trim().split('`')[1];
          if (colName) usersColumns.push(colName);
        }
        if (termsColumns && line.trim().startsWith('`')) {
          const colName = line.trim().split('`')[1];
          if (colName) termsColumns.push(colName);
        }
        if (termTaxonomyColumns && line.trim().startsWith('`')) {
          const colName = line.trim().split('`')[1];
          if (colName) termTaxonomyColumns.push(colName);
        }
        if (termRelationshipsColumns && line.trim().startsWith('`')) {
          const colName = line.trim().split('`')[1];
          if (colName) termRelationshipsColumns.push(colName);
        }

        // Stop accumulation on closing parenthesis
        if (line.startsWith(')')) {
          // Finished CREATE TABLE, let columns persist
          continue;
        }

        // Handle INSERT statements
        if (line.startsWith('INSERT INTO `wp_')) {
          currentInsertStatement = line;
        } else if (currentInsertStatement && !line.startsWith('INSERT INTO') && (line.includes('(') || line.trim())) {
          currentInsertStatement += '\n' + line;
        }

        if (currentInsertStatement && currentInsertStatement.trim().endsWith(';')) {
          const stmt = currentInsertStatement;
          currentInsertStatement = '';

          // PROCESS INSERT STATEMENT
          if (stmt.startsWith('INSERT INTO `wp_terms`')) {
            const rows = parseSqlInsertLine(stmt);
            for (const row of rows) {
              const termId = row[0];
              const name = row[1];
              const slug = row[2];
              wpTerms[termId] = { name, slug };
            }
          } 
          else if (stmt.startsWith('INSERT INTO `wp_term_taxonomy`')) {
            const rows = parseSqlInsertLine(stmt);
            for (const row of rows) {
              const termTaxonomyId = row[0];
              const termId = row[1];
              const taxonomy = row[2];
              const parent = row[4] || 0;
              wpTaxonomies[termTaxonomyId] = { termId, taxonomy, parent };
            }
          } 
          else if (stmt.startsWith('INSERT INTO `wp_term_relationships`')) {
            const rows = parseSqlInsertLine(stmt);
            for (const row of rows) {
              const objectId = row[0];
              const termTaxonomyId = row[1];
              wpPostRelationships.push({ objectId, termTaxonomyId });
            }
          }
        }
      }

      await addLog(`Đã tải xong Cây phân loại Terms: ${Object.keys(wpTerms).length} terms, ${Object.keys(wpTaxonomies).length} tax, ${wpPostRelationships.length} liên kết.`);

      // 2. Pre-create Categories and Tags in our database to map them correctly later
      const categoryMap: Record<number, number> = {}; // wp_term_id -> postgres_category_id
      const tagMap: Record<number, number> = {};      // wp_term_id -> postgres_tag_id

      if (options.importCategories !== false) {
        for (const taxIdStr of Object.keys(wpTaxonomies)) {
          const taxId = Number(taxIdStr);
          const tax = wpTaxonomies[taxId];
          const term = wpTerms[tax.termId];
          if (!term) continue;

          if (tax.taxonomy === 'category') {
            if (isDryRun) {
              categoryMap[tax.termId] = 999000 + tax.termId;
              progress.categoriesImported++;
            } else {
              const category = await prisma.category.upsert({
                where: { slug: term.slug },
                update: { name: term.name },
                create: { name: term.name, slug: term.slug }
              });
              categoryMap[tax.termId] = category.id;
              progress.categoriesImported++;
            }
          } else if (tax.taxonomy === 'post_tag') {
            if (isDryRun) {
              tagMap[tax.termId] = 888000 + tax.termId;
              progress.tagsImported++;
            } else {
              const tag = await prisma.tag.upsert({
                where: { slug: term.slug },
                update: { name: term.name },
                create: { name: term.name, slug: term.slug }
              });
              tagMap[tax.termId] = tag.id;
              progress.tagsImported++;
            }
          }
        }
        await addLog(
          isDryRun
            ? `[Dry Run] Đã mô phỏng đồng bộ Danh mục & Thẻ vào hệ thống: ${progress.categoriesImported} categories, ${progress.tagsImported} tags.`
            : `Đã đồng bộ hóa xong Danh mục & Thẻ vào Database Postgres hiện tại.`
        );
      } else {
        await addLog(`Bỏ qua đồng bộ hóa Danh mục & Thẻ theo cấu hình.`);
      }

      // 3. Second pass: Parse wp_users and insert them
      const defaultAuthor = await prisma.user.findFirst({
        where: { role: Role.ADMIN }
      });
      const fallbackAuthorId = defaultAuthor ? defaultAuthor.id : options.defaultAuthorId;

      const userStreamStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const userRl = readline.createInterface({
        input: userStreamStream,
        crlfDelay: Infinity
      });

      let currentInsertUser = '';
      const userMap: Record<number, number> = {}; // wp_user_id -> postgres_user_id
      let simulatedUserCount = 0;
      let stopUserImport = false;

      for await (const line of userRl) {
        if (stopUserImport) break;

        if (line.startsWith('INSERT INTO `wp_users`')) {
          currentInsertUser = line;
        } else if (currentInsertUser && !line.startsWith('INSERT INTO') && (line.includes('(') || line.trim())) {
          currentInsertUser += '\n' + line;
        }

        if (currentInsertUser && currentInsertUser.trim().endsWith(';')) {
          const stmt = currentInsertUser;
          currentInsertUser = '';

          const rows = parseSqlInsertLine(stmt);
          for (const row of rows) {
            if (isDryRun && simulatedUserCount >= dryRunRows) {
              await addLog(`[Dry Run] Đã đạt giới hạn mô phỏng ${dryRunRows} thành viên.`);
              stopUserImport = true;
              break;
            }

            const wpId = row[0];
            const userLogin = row[1];
            const userPass = row[2];
            const userEmail = row[4];
            const displayName = row[9] || userLogin;

            try {
              const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email: userEmail }, { username: userLogin }] }
              });

              if (existingUser) {
                userMap[wpId] = existingUser.id;
              } else if (options.importUsers !== false) {
                if (isDryRun) {
                  userMap[wpId] = 777000 + wpId;
                  progress.usersImported++;
                  simulatedUserCount++;
                  await addLog(`[Dry Run] Mô phỏng tạo thành viên mới: ${displayName} (${userLogin})`);
                } else {
                  const newUser = await prisma.user.create({
                    data: {
                      email: userEmail,
                      username: userLogin,
                      password: userPass,
                      name: displayName,
                      role: Role.SUBSCRIBER
                    }
                  });
                  userMap[wpId] = newUser.id;
                  progress.usersImported++;
                }
              } else {
                userMap[wpId] = fallbackAuthorId;
              }
            } catch (err) {
              console.error(`Lỗi import user ${userLogin}:`, err);
            }
          }
        }
      }

      await addLog(
        isDryRun
          ? `[Dry Run] Đã mô phỏng đồng bộ thành viên: ${progress.usersImported} người.`
          : `Đã đồng bộ hóa xong thành viên: ${progress.usersImported} người mới.`
      );

      // 4. Third pass: Parse posts and insert them
      const postStreamStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const postRl = readline.createInterface({
        input: postStreamStream,
        crlfDelay: Infinity
      });

      let currentInsertPost = '';
      let simulatedPostCount = 0;
      let stopPostImport = false;

      for await (const line of postRl) {
        if (stopPostImport) break;

        if (line.startsWith('INSERT INTO `wp_posts`')) {
          currentInsertPost = line;
        } else if (currentInsertPost && !line.startsWith('INSERT INTO') && (line.includes('(') || line.trim())) {
          currentInsertPost += '\n' + line;
        }

        if (currentInsertPost && currentInsertPost.trim().endsWith(';')) {
          const stmt = currentInsertPost;
          currentInsertPost = '';

          const rows = parseSqlInsertLine(stmt);
          for (const row of rows) {
            if (isDryRun && simulatedPostCount >= dryRunRows) {
              await addLog(`[Dry Run] Đã đạt giới hạn mô phỏng ${dryRunRows} bài viết.`);
              stopPostImport = true;
              break;
            }

            const wpId = row[0];
            const authorWpId = row[1];
            const postDate = new Date(row[2] || new Date());
            let postContent = row[4] || '';
            const postTitle = row[5] || '';
            const postExcerpt = row[6] || '';
            const postStatus = row[7] || 'publish';
            const postName = row[11] || ''; // slug
            const postType = row[20] || 'post';

            // 1. First, check filters & post type restrictions immediately so we don't process/download images for skipped records
            if (options.onlyPublished && postStatus !== 'publish') {
              continue;
            }

            if (postType === 'post' && options.importPosts === false) {
              continue;
            }
            if (postType === 'page' && options.importPages === false) {
              continue;
            }

            // Only import posts, pages, services, products
            if (postType !== 'post' && postType !== 'page' && postType !== 'service' && postType !== 'product') {
              continue;
            }

            // 2. Map PostStatus and PostType to prisma enums
            let mappedStatus: PostStatus = PostStatus.DRAFT;
            if (postStatus === 'publish') mappedStatus = PostStatus.PUBLISHED;
            else if (postStatus === 'trash') mappedStatus = PostStatus.TRASH;

            let mappedType: PostType = PostType.POST;
            if (postType === 'page') mappedType = PostType.PAGE;
            else if (postType === 'service') mappedType = PostType.SERVICE;
            else if (postType === 'product') mappedType = PostType.PRODUCT;

            // 3. Process post content (clean elementor, convert links, download images) ONLY for posts we actually import
            if (options.cleanElementorHtml) {
              postContent = postContent.replace(/<style>[\s\S]*?<\/style>/gi, '');
              postContent = postContent.replace(/\[\/?elementor-template.*?\]/gi, '');
            }

            if (options.convertLinks !== false) {
              postContent = postContent.replace(/https?:\/\/(www\.)?lexi\.vn\/?/gi, '/');
            }

            // Clean WordPress shortcodes (e.g. [caption], [gallery], loose shortcode brackets)
            postContent = cleanWordPressShortcodes(postContent);

            if (options.downloadImages !== false) {
              const imgRegex = /src=["'](?:https?:\/\/(?:www\.)?lexi\.vn)?(\/wp-content\/uploads\/[^"']+)["']/gi;
              let imgMatch;
              while ((imgMatch = imgRegex.exec(postContent)) !== null) {
                const relativeImagePath = imgMatch[1];
                try {
                  if (isDryRun) {
                    await addLog(`[Dry Run] Phát hiện ảnh WordPress: ${relativeImagePath}`);
                  } else {
                    const success = await downloadAndSyncImage(relativeImagePath);
                    if (!success && !skipBrokenMedia) {
                      throw new Error(`Không thể tải hình ảnh và cấu hình yêu cầu dừng lại khi lỗi ảnh: ${relativeImagePath}`);
                    } else if (!success && skipBrokenMedia) {
                      await addLog(`[Cảnh báo] Bỏ qua lỗi tải ảnh: ${relativeImagePath}`);
                    }
                  }
                } catch (e: any) {
                  console.error(`Lỗi tải ảnh: ${relativeImagePath}`, e);
                  if (!skipBrokenMedia) {
                    throw e;
                  }
                }
              }
            }

            const mappedAuthorId = userMap[authorWpId] || fallbackAuthorId;
            if (!mappedAuthorId) continue;

            try {
              // Get terms related to this post
              const relatedTermTaxIds = wpPostRelationships
                .filter(r => r.objectId === wpId)
                .map(r => r.termTaxonomyId);

              const postCategories: { id: number }[] = [];
              const postTags: { id: number }[] = [];

              relatedTermTaxIds.forEach(taxId => {
                const tax = wpTaxonomies[taxId];
                if (!tax) return;
                
                const catId = categoryMap[tax.termId];
                if (catId) postCategories.push({ id: catId });

                const tagId = tagMap[tax.termId];
                if (tagId) postTags.push({ id: tagId });
              });

              // Resolve duplicate/empty slug dynamically
              let finalSlug = postName || `post-${wpId}`;
              let slugCounter = 1;
              
              if (!isDryRun) {
                while (true) {
                  const existingPostWithSlug = await prisma.post.findUnique({
                    where: { slug: finalSlug }
                  });

                  if (!existingPostWithSlug) {
                    break;
                  }

                  if (existingPostWithSlug.legacyId === wpId) {
                    break;
                  }

                  slugCounter++;
                  finalSlug = `${postName || 'post'}-${slugCounter}`;
                }
              }

              // Check if post already exists via legacyId
              const existingPost = await prisma.post.findFirst({
                where: { legacyId: wpId }
              });

              if (existingPost) {
                if (strategy === 'skip') {
                  await addLog(`[Bỏ qua] Bài viết trùng ID cũ ${wpId} ("${postTitle}") theo chiến lược Skip`);
                  continue;
                }

                if (isDryRun) {
                  await addLog(`[Dry Run] Mô phỏng CẬP NHẬT bài viết ID cũ ${wpId}: "${postTitle}" (Chiến lược: ${strategy})`);
                } else {
                  await prisma.post.update({
                    where: { id: existingPost.id },
                    data: {
                      title: postTitle,
                      slug: finalSlug,
                      content: postContent,
                      excerpt: postExcerpt,
                      status: mappedStatus,
                      type: mappedType,
                      publishedAt: postDate,
                      categories: {
                        set: postCategories
                      },
                      tags: {
                        set: postTags
                      }
                    }
                  });
                }
                simulatedPostCount++;
                progress.postsImported++;
              } else {
                // If it does not exist by legacyId, check if slug is taken!
                let existingPostWithSlug = null;
                if (!isDryRun) {
                  existingPostWithSlug = await prisma.post.findUnique({
                    where: { slug: finalSlug }
                  });
                }

                if (existingPostWithSlug && strategy === 'replace') {
                  if (isDryRun) {
                    await addLog(`[Dry Run] Mô phỏng GHI ĐÈ bài viết có slug trùng "${finalSlug}": "${postTitle}" (Chiến lược: replace)`);
                  } else {
                    await prisma.post.update({
                      where: { id: existingPostWithSlug.id },
                      data: {
                        title: postTitle,
                        content: postContent,
                        excerpt: postExcerpt,
                        status: mappedStatus,
                        type: mappedType,
                        publishedAt: postDate,
                        legacyId: wpId,
                        categories: {
                          set: postCategories
                        },
                        tags: {
                          set: postTags
                        }
                      }
                    });
                  }
                  simulatedPostCount++;
                  progress.postsImported++;
                } else if (existingPostWithSlug && strategy === 'skip') {
                  await addLog(`[Bỏ qua] Bài viết trùng slug "${finalSlug}" ("${postTitle}") theo chiến lược Skip`);
                  continue;
                } else {
                  if (isDryRun) {
                    await addLog(`[Dry Run] Mô phỏng TẠO MỚI bài viết ID cũ ${wpId}: "${postTitle}" (Slug: ${finalSlug})`);
                  } else {
                    await prisma.post.create({
                      data: {
                        title: postTitle,
                        slug: finalSlug,
                        content: postContent,
                        excerpt: postExcerpt,
                        status: mappedStatus,
                        type: mappedType,
                        legacyId: wpId,
                        publishedAt: postDate,
                        authorId: mappedAuthorId,
                        categories: {
                          connect: postCategories
                        },
                        tags: {
                          connect: postTags
                        }
                      }
                    });
                  }
                  simulatedPostCount++;
                  progress.postsImported++;
                }
              }
            } catch (err: any) {
              console.error(`Lỗi import bài viết ${postTitle}:`, err);
              await addLog(`Lỗi bài viết "${postTitle.substring(0, 30)}": ${err.message}`);
            }
          }
        }
      }

      progress.status = 'completed';
      progress.endTime = new Date();
      await addLog(
        isDryRun
          ? `🔥 [Dry Run] MÔ PHỎNG HOÀN TẤT THÀNH CÔNG! Đã mô phỏng: ${progress.postsImported} bài viết/trang, ${progress.usersImported} thành viên, ${progress.categoriesImported} danh mục, ${progress.tagsImported} thẻ.`
          : `🔥 QUÁ TRÌNH IMPORT HOÀN TẤT THÀNH CÔNG! Đã nhập: ${progress.postsImported} bài viết/trang, ${progress.usersImported} thành viên, ${progress.categoriesImported} danh mục, ${progress.tagsImported} thẻ.`
      );
      await updateImportProgressInDB(progress);

    } catch (error: any) {
      console.error('Migration failed:', error);
      progress.status = 'failed';
      progress.error = error.message;
      progress.endTime = new Date();
      progress.logs.push(`[LỖI NGHIÊM TRỌNG]: ${error.message}`);
      await updateImportProgressInDB(progress);
    }
  })();

  return { success: true, message: isDryRun ? 'Tiến trình Dry Run đã được khởi chạy trong nền.' : 'Tiến trình import đã được khởi chạy trong nền.' };
}

// Download image from live server to Next.js public assets, and sync to Media library
export async function downloadAndSyncImage(relativePath: string): Promise<boolean> {
  try {
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    const destPath = path.join(process.cwd(), 'public', cleanPath);
    
    // If already downloaded and exists, skip
    if (fs.existsSync(destPath)) {
      return true;
    }
    
    // Ensure parent folder structure exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sourceUrl = `https://lexi.vn/${cleanPath}`;
    console.log(`Downloading WordPress image: ${sourceUrl} -> ${destPath}`);
    
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.error(`Failed to download image from ${sourceUrl}: Status ${response.status}`);
      return false;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);

    // Mime-type mapping
    const ext = path.extname(cleanPath).toLowerCase();
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.svg') mimeType = 'image/svg+xml';

    const filename = path.basename(cleanPath);
    const url = `/${cleanPath}`;

    // Sync to Postgres Media database
    const existingMedia = await prisma.media.findFirst({ where: { url } });
    if (!existingMedia) {
      await prisma.media.create({
        data: { filename, url, size: buffer.length, mimeType }
      });
    }

    return true;
  } catch (err) {
    console.error(`Error downloadAndSyncImage for ${relativePath}:`, err);
    return false;
  }
}

/**
 * Clean WordPress shortcodes from post content
 */
export function cleanWordPressShortcodes(content: string): string {
  if (!content) return '';

  let cleaned = content;

  // 1. Process [caption ...](inner)[/caption] and [wp_caption ...](inner)[/wp_caption]
  // We wrap them in a modern, centered container
  cleaned = cleaned.replace(
    /\[(?:wp_)?caption[^\]]*\]([\s\S]*?)\[\/(?:wp_)?caption\]/gi,
    '<div class="wp-caption flex flex-col items-center text-center my-4 p-2 bg-slate-50 border border-slate-100 rounded-lg">$1</div>'
  );

  // 2. Remove [gallery ids="..."] shortcodes to avoid rendering raw code on screen
  cleaned = cleaned.replace(/\[gallery[^\]]*\]/gi, '');

  // 3. Remove other standard single-tag shortcodes
  cleaned = cleaned.replace(/\[embed[^\]]*\]([\s\S]*?)\[\/embed\]/gi, '$1');

  // 4. Remove any loose visual composer / page builder shortcode tags but KEEP the inner content
  cleaned = cleaned.replace(/\[\/?(?:vc_|et_pb_|elementor-template)[^\]]*\]/gi, '');

  return cleaned;
}

// WordPress WXR/XML importer
export async function runWordPressWxrMigration(filePath: string, options: {
  onlyPublished?: boolean; defaultAuthorId: number; convertLinks?: boolean; downloadImages?: boolean;
  importPosts?: boolean; importPages?: boolean; importUsers?: boolean; importCategories?: boolean;
  importComments?: boolean; importMedia?: boolean; importSeoMeta?: boolean; cleanShortcodes?: boolean;
  strategy?: 'merge'|'replace'|'skip'; dryRun?: boolean; dryRunRows?: number;
}) {
  const { parseWxrFile } = await import('@/lib/wordpress-wxr');
  const isDryRun=options.dryRun===true, strategy=options.strategy??'merge', limit=isDryRun?(options.dryRunRows??10):Number.MAX_SAFE_INTEGER;
  const progress:ImportProgress={status:'running',processedLines:0,totalLinesEstimated:1,usersImported:0,postsImported:0,categoriesImported:0,tagsImported:0,commentsImported:0,logs:['Bắt đầu đọc WordPress WXR/XML...'],startTime:new Date()};
  await updateImportProgressInDB(progress);
  (async()=>{try{
    const doc=parseWxrFile(filePath);progress.totalLinesEstimated=Math.max(doc.items.length,1);
    const log=async(m:string)=>{progress.logs.push(`[${new Date().toLocaleTimeString()}] ${m}`);if(progress.logs.length>150)progress.logs.shift();await updateImportProgressInDB(progress)};
    await log(`Đã đọc WXR ${doc.version} từ ${doc.baseSiteUrl}: ${doc.items.length} items.`);
    const authorMap=new Map<string,number>();
    for(const a of doc.authors){let id=options.defaultAuthorId;if(options.importUsers&&!isDryRun){const existing=await prisma.user.findFirst({where:{OR:[{username:a.login||`wp-${a.id}`},...(a.email?[{email:a.email}]:[])]}});id=existing?.id??options.defaultAuthorId}authorMap.set(a.login,id);progress.usersImported++}
    const categoryMap=new Map<string,number>(),tagMap=new Map<string,number>();
    if(options.importCategories!==false){for(const c of doc.categories){if(isDryRun){progress.categoriesImported++;continue}const row=await prisma.category.upsert({where:{slug:c.nicename||`category-${c.id}`},update:{name:c.name},create:{name:c.name,slug:c.nicename||`category-${c.id}`}});categoryMap.set(c.nicename,row.id);progress.categoriesImported++}for(const t of doc.tags){if(isDryRun){progress.tagsImported++;continue}const row=await prisma.tag.upsert({where:{slug:t.slug||`tag-${t.id}`},update:{name:t.name},create:{name:t.name,slug:t.slug||`tag-${t.id}`}});tagMap.set(t.slug,row.id);progress.tagsImported++}}
    const attachments=new Map<number,{id:number;url:string}>();
    if(options.importMedia!==false){for(const item of doc.items.filter(i=>i.postType==='attachment')){const remote=item.attachmentUrl;if(!remote)continue;let localUrl=remote;try{if(options.downloadImages){const downloaded=await downloadWordPressMedia(remote,doc.baseSiteUrl);if(downloaded)localUrl=downloaded}}catch{}if(!isDryRun){const row=await prisma.media.findFirst({where:{url:localUrl}})??await prisma.media.create({data:{filename:path.basename(new URL(remote).pathname)||`attachment-${item.id}`,url:localUrl,mimeType:item.meta['_wp_attachment_metadata']?'image/jpeg':undefined}});attachments.set(item.id,{id:row.id,url:localUrl})}}}
    const imported=new Map<number,number>();let count=0;
    for(const item of doc.items){if(!['post','page'].includes(item.postType))continue;if(item.postType==='post'&&options.importPosts===false)continue;if(item.postType==='page'&&options.importPages===false)continue;if(options.onlyPublished&&item.status!=='publish')continue;if(count++>=limit)break;progress.processedLines++;
      let content=options.cleanShortcodes===false?item.content:cleanWordPressShortcodes(item.content);if(options.convertLinks!==false&&doc.baseSiteUrl)content=content.replaceAll(doc.baseSiteUrl.replace(/\/$/,''),'');
      const cats=item.terms.filter(t=>t.domain==='category').map(t=>categoryMap.get(t.nicename)).filter((x):x is number=>!!x).map(id=>({id}));const tags=item.terms.filter(t=>t.domain==='post_tag').map(t=>tagMap.get(t.nicename)).filter((x):x is number=>!!x).map(id=>({id}));
      const status:itemStatus=item.status==='publish'?'PUBLISHED':item.status==='trash'?'TRASH':'DRAFT';const slug=item.slug||`wp-${item.id}`;const thumb=attachments.get(Number(item.meta['_thumbnail_id']));
      if(isDryRun){progress.postsImported++;await log(`[Dry Run] ${item.postType}: ${item.title}`);continue}
      const data={title:item.title||'(Không tiêu đề)',slug,content,excerpt:item.excerpt||null,status,type:item.postType==='page'?'PAGE' as const:'POST' as const,seoTitle:options.importSeoMeta===false?null:(item.meta['_yoast_wpseo_title']||null),seoDescription:options.importSeoMeta===false?null:(item.meta['_yoast_wpseo_metadesc']||null),seoKeywords:options.importSeoMeta===false?null:(item.meta['_yoast_wpseo_focuskw']||null),authorId:authorMap.get(item.creator)||options.defaultAuthorId,legacyId:item.id,publishedAt:item.date,createdAt:item.date,updatedAt:item.modified,featuredImageId:thumb?.id,categories:{connect:cats},tags:{connect:tags}};
      const byLegacy=await prisma.post.findUnique({where:{legacyId:item.id}});const bySlug=await prisma.post.findUnique({where:{slug}});let post;
      if(byLegacy){if(strategy==='skip')continue;post=await prisma.post.update({where:{id:byLegacy.id},data})}else if(bySlug&&strategy==='replace'){post=await prisma.post.update({where:{id:bySlug.id},data})}else if(bySlug&&strategy==='skip')continue;else{if(bySlug)data.slug=`${slug}-wp-${item.id}`;post=await prisma.post.create({data})}imported.set(item.id,post.id);progress.postsImported++;
      if(options.importComments!==false){const commentMap=new Map<number,number>();for(const c of item.comments){const parentId=commentMap.get(c.parentId);const created=await prisma.comment.create({data:{postId:post.id,content:c.content,authorName:c.author||'Ẩn danh',authorEmail:c.email||'unknown@example.invalid',authorUrl:c.url||null,ipAddress:c.ip||null,status:c.approved==='1'?'APPROVED':c.approved==='spam'?'SPAM':c.approved==='trash'?'TRASH':'PENDING',createdAt:c.date,parentId}});commentMap.set(c.id,created.id);progress.commentsImported++}}
      if(progress.processedLines%10===0)await updateImportProgressInDB(progress);
    }
    for(const item of doc.items.filter(i=>i.postType==='page'&&i.parentId)){const id=imported.get(item.id),parentId=imported.get(item.parentId);if(id&&parentId&&!isDryRun)await prisma.post.update({where:{id},data:{parentId}})}
    progress.status='completed';progress.endTime=new Date();await log(`${isDryRun?'Dry Run':'Import WXR'} hoàn tất: ${progress.postsImported} nội dung, ${progress.commentsImported} bình luận.`);
  }catch(e:any){progress.status='failed';progress.error=e.message;progress.endTime=new Date();progress.logs.push(`[LỖI]: ${e.message}`);await updateImportProgressInDB(progress)}})();
  return{success:true,message:isDryRun?'Dry Run WXR đã khởi chạy.':'Import WXR đã khởi chạy.'};
}

type itemStatus = PostStatus;

export async function downloadWordPressMedia(remoteUrl:string,baseSiteUrl:string):Promise<string|null>{
 try{const url=new URL(remoteUrl,baseSiteUrl);if(!['http:','https:'].includes(url.protocol))return null;if(['localhost','127.0.0.1','::1'].includes(url.hostname)||/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname))return null;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);const response=await fetch(url,{signal:controller.signal,redirect:'follow'});clearTimeout(timer);if(!response.ok)return null;const length=Number(response.headers.get('content-length')||0);if(length>20*1024*1024)return null;const buffer=Buffer.from(await response.arrayBuffer());if(buffer.length>20*1024*1024)return null;const uploadsIndex=url.pathname.indexOf('/wp-content/uploads/');const relative=uploadsIndex>=0?url.pathname.slice(uploadsIndex+1):`uploads/wordpress/${Date.now()}-${path.basename(url.pathname)}`;const clean=relative.split('/').filter(s=>s&&s!=='.'&&s!=='..').join('/');const dest=path.join(process.cwd(),'public',clean);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,buffer);return`/${clean}`}catch{return null}
}
