/**
 * Lexi CMS — Safe Mode Manager
 * 
 * Cơ chế tự động tắt plugin khi phát hiện lỗi critical.
 * 
 * Kích hoạt qua:
 * - Query param: ?safe_mode=1 (chỉ ADMIN)
 * - API: POST /api/system/safe-mode
 * - Auto-detect: Khi quá nhiều plugin errors liên tiếp
 */

import { hooks } from './hooks';
import { pluginLoader } from './pluginLoader';
import { prisma } from './prisma';

const SAFE_MODE_KEY = 'system_safe_mode';
const SAFE_MODE_REASON_KEY = 'system_safe_mode_reason';
const SAFE_MODE_TIMESTAMP_KEY = 'system_safe_mode_timestamp';
const ERROR_THRESHOLD = 5; // Số lỗi liên tiếp trước khi auto-activate safe mode

class SafeModeManager {
  private consecutiveErrors: number = 0;

  /**
   * Kiểm tra safe mode có đang bật không
   */
  async isActive(): Promise<boolean> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: SAFE_MODE_KEY }
      });
      return setting?.value === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Bật Safe Mode — tắt tất cả plugin không critical
   */
  async activate(reason: string): Promise<{ success: boolean; disabledPlugins: string[] }> {
    try {
      // Lưu trạng thái safe mode vào DB
      await prisma.setting.upsert({
        where: { key: SAFE_MODE_KEY },
        update: { value: 'true' },
        create: { key: SAFE_MODE_KEY, value: 'true' },
      });
      await prisma.setting.upsert({
        where: { key: SAFE_MODE_REASON_KEY },
        update: { value: reason },
        create: { key: SAFE_MODE_REASON_KEY, value: reason },
      });
      await prisma.setting.upsert({
        where: { key: SAFE_MODE_TIMESTAMP_KEY },
        update: { value: new Date().toISOString() },
        create: { key: SAFE_MODE_TIMESTAMP_KEY, value: new Date().toISOString() },
      });

      // Tắt hook system
      hooks.setEnabled(false);

      // Unload all non-critical plugins
      const disabledPlugins = await pluginLoader.enterSafeMode();

      console.warn(`[SafeMode] ACTIVATED. Reason: ${reason}. Disabled ${disabledPlugins.length} plugins.`);
      
      return { success: true, disabledPlugins };
    } catch (error: any) {
      console.error('[SafeMode] Failed to activate:', error);
      return { success: false, disabledPlugins: [] };
    }
  }

  /**
   * Tắt Safe Mode — bật lại hook system
   */
  async deactivate(): Promise<{ success: boolean }> {
    try {
      await prisma.setting.upsert({
        where: { key: SAFE_MODE_KEY },
        update: { value: 'false' },
        create: { key: SAFE_MODE_KEY, value: 'false' },
      });

      // Bật lại hook system
      hooks.setEnabled(true);
      
      // Reset error counter
      this.consecutiveErrors = 0;

      console.log('[SafeMode] DEACTIVATED. Hook system re-enabled.');
      
      return { success: true };
    } catch (error: any) {
      console.error('[SafeMode] Failed to deactivate:', error);
      return { success: false };
    }
  }

  /**
   * Lấy thông tin safe mode hiện tại
   */
  async getStatus(): Promise<{
    active: boolean;
    reason: string | null;
    activatedAt: string | null;
    consecutiveErrors: number;
  }> {
    try {
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [SAFE_MODE_KEY, SAFE_MODE_REASON_KEY, SAFE_MODE_TIMESTAMP_KEY]
          }
        }
      });

      const map: Record<string, string> = {};
      for (const s of settings) {
        map[s.key] = s.value;
      }

      return {
        active: map[SAFE_MODE_KEY] === 'true',
        reason: map[SAFE_MODE_REASON_KEY] || null,
        activatedAt: map[SAFE_MODE_TIMESTAMP_KEY] || null,
        consecutiveErrors: this.consecutiveErrors,
      };
    } catch {
      return {
        active: false,
        reason: null,
        activatedAt: null,
        consecutiveErrors: this.consecutiveErrors,
      };
    }
  }

  /**
   * Ghi nhận lỗi plugin — tự động bật safe mode nếu vượt ngưỡng
   */
  async recordError(pluginId: string, error: string): Promise<void> {
    this.consecutiveErrors++;
    
    if (this.consecutiveErrors >= ERROR_THRESHOLD) {
      const isAlreadyActive = await this.isActive();
      if (!isAlreadyActive) {
        await this.activate(
          `Auto-activated: ${this.consecutiveErrors} consecutive plugin errors. Last error from "${pluginId}": ${error}`
        );
      }
    }
  }

  /**
   * Reset error counter (gọi khi có thao tác thành công)
   */
  resetErrorCount(): void {
    this.consecutiveErrors = 0;
  }

  /**
   * Safe execution wrapper — chạy function trong try/catch, ghi nhận lỗi
   */
  async safeExecute<T>(
    pluginId: string,
    fn: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      const result = await fn();
      this.resetErrorCount(); // Thành công → reset counter
      return result;
    } catch (error: any) {
      await this.recordError(pluginId, error?.message || String(error));
      console.error(`[SafeMode] Plugin "${pluginId}" error:`, error?.message || error);
      return fallback;
    }
  }
}

// Singleton
export const safeMode = new SafeModeManager();
