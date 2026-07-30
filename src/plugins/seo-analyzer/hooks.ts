import { HookManager } from '@/lib/hooks/HookManager';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';

export function registerHooks(hooks: HookManager) {
  // 1. Add [SEO] to metadata title (TESTING ONLY)
  hooks.addFilter(CORE_HOOKS.SEO_META, (metaObject: any) => {
    if (metaObject && metaObject.title) {
      // NOTE: This is just a test hook to demonstrate the capability.
      metaObject.title.default = `[SEO] ${metaObject.title.default}`;
    }
    return metaObject;
  }, 10, 'seo-analyzer');

  // 2. Add a Dashboard Card
  hooks.addFilter(CORE_HOOKS.ADMIN_DASHBOARD_CARDS, (cards: any[]) => {
    cards.push({
      title: 'Điểm SEO Trung Bình',
      value: '95/100',
      description: 'Tất cả bài viết đã được tối ưu.',
      href: '/admin/settings/seo',
      pluginId: 'seo-analyzer',
    });
    return cards;
  }, 10, 'seo-analyzer');

  // 3. Add a Settings Panel Link
  hooks.addFilter(CORE_HOOKS.SETTINGS_PANELS, (panels: any[]) => {
    panels.push({
      title: 'Cài đặt SEO (Test Hook)',
      description: 'Cấu hình meta templates, Webmaster Tools, và Technical SEO.',
      href: '/admin/settings/seo',
      pluginId: 'seo-analyzer',
    });
    return panels;
  }, 10, 'seo-analyzer');

  // 4. Test MEDIA_VALIDATE_FILE: Chặn .exe
  hooks.addFilter(CORE_HOOKS.MEDIA_VALIDATE_FILE, (result: any, fileInfo: any) => {
    if (fileInfo?.extension?.toLowerCase() === '.exe') {
      result.allowed = false;
      result.reason = '[Test Plugin] Không được phép tải lên tập tin thực thi (.exe).';
    }
    // Cảnh báo dung lượng lớn (chỉ log, không chặn)
    if (fileInfo?.size > 5 * 1024 * 1024) { // 5MB
      console.warn(`[SEO Analyzer] Tệp ${fileInfo.fileName} có kích thước > 5MB, có thể ảnh hưởng tốc độ tải trang.`);
    }
    return result;
  }, 10, 'seo-analyzer');

  // 5. Test MEDIA_LIBRARY_ACTIONS: Thêm action "Optimize Image"
  hooks.addFilter(CORE_HOOKS.MEDIA_LIBRARY_ACTIONS, (actions: any[]) => {
    actions.push({
      label: 'Tối ưu hóa SEO (Test)',
      actionId: 'seo-optimize-image',
      pluginId: 'seo-analyzer'
    });
    return actions;
  }, 10, 'seo-analyzer');

  // 6. Test MEDIA_TRANSFORM_URL: Thêm param ?seo=1
  hooks.addFilter(CORE_HOOKS.MEDIA_TRANSFORM_URL, (url: string, mediaObj: any) => {
    if (url && typeof url === 'string' && !url.includes('?')) {
      return `${url}?seo=1`;
    }
    return url;
  }, 10, 'seo-analyzer');

  // 7. Test CONTENT_VALIDATE: Cảnh báo thiếu excerpt
  hooks.addFilter(CORE_HOOKS.CONTENT_VALIDATE, (result: any, payload: any) => {
    if (!payload.excerpt || payload.excerpt.trim() === '') {
      console.warn(`[SEO Analyzer] Bài viết '${payload.title}' thiếu mô tả ngắn (excerpt). SEO có thể bị ảnh hưởng.`);
    }
    return result;
  }, 10, 'seo-analyzer');

  // 8. Test CONTENT_TRANSFORM_EXCERPT: Auto generate excerpt
  hooks.addFilter(CORE_HOOKS.CONTENT_TRANSFORM_EXCERPT, (excerpt: string, payload: any) => {
    if ((!excerpt || excerpt.trim() === '') && payload.content) {
      // Lấy 50 ký tự đầu tiên
      const strippedContent = payload.content.replace(/<[^>]+>/g, '').trim();
      return strippedContent.substring(0, 50) + (strippedContent.length > 50 ? '...' : '');
    }
    return excerpt;
  }, 10, 'seo-analyzer');


  // 10. Test CONTENT_AFTER_PUBLISH: Log
  hooks.addAction(CORE_HOOKS.CONTENT_AFTER_PUBLISH, (post: any) => {
    console.log(`[SEO Analyzer] Bài viết '${post.title}' đã được xuất bản! Bắt đầu ping sitemap...`);
  }, 10, 'seo-analyzer');
}
