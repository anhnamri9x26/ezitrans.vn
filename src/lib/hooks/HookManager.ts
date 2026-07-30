import { HookCallback, ActionCallback, FilterCallback, RegisteredHook } from './types';

export class HookManager {
  private actions: Map<string, HookCallback[]> = new Map();
  private filters: Map<string, HookCallback[]> = new Map();
  private errorLog: Array<{ hookName: string; pluginId: string; error: string; timestamp: Date }> = [];
  private _enabled: boolean = true;

  async ensureInitialized(): Promise<void> {
    try {
      const { pluginLoader } = await import('../pluginLoader');
      await pluginLoader.ensureInitialized();
    } catch(err) {
      console.warn("[HookManager] Error initializing pluginLoader", err);
    }
  }

  clearAll(): void {
    this.actions.clear();
    this.filters.clear();
    this.errorLog = [];
  }

  // ─── Registration ───────────────────────────────────────────────

  addAction(
    hookName: string,
    callback: ActionCallback,
    priority: number = 10,
    pluginId: string = 'core'
  ): void {
    if (!this.actions.has(hookName)) {
      this.actions.set(hookName, []);
    }
    const hooks = this.actions.get(hookName)!;
    hooks.push({ callback, priority, pluginId });
    hooks.sort((a, b) => a.priority - b.priority);
  }

  addFilter(
    hookName: string,
    callback: FilterCallback,
    priority: number = 10,
    pluginId: string = 'core'
  ): void {
    if (!this.filters.has(hookName)) {
      this.filters.set(hookName, []);
    }
    const hooks = this.filters.get(hookName)!;
    hooks.push({ callback, priority, pluginId });
    hooks.sort((a, b) => a.priority - b.priority);
  }

  // ─── Execution ──────────────────────────────────────────────────

  async doAction(hookName: string, ...args: any[]): Promise<void> {
    await this.ensureInitialized();
    if (!this._enabled) return;

    const hooks = this.actions.get(hookName);
    if (!hooks || hooks.length === 0) return;

    for (const hook of hooks) {
      try {
        hook.lastRun = new Date();
        await (hook.callback as ActionCallback)(...args);
      } catch (error: any) {
        hook.lastError = error?.message || String(error);
        this.logError(hookName, hook.pluginId, error);
        console.error(
          `[HookManager] Action "${hookName}" failed for plugin "${hook.pluginId}":`,
          error?.message || error
        );
      }
    }
  }

  async applyFilters(hookName: string, value: any, ...args: any[]): Promise<any> {
    await this.ensureInitialized();
    if (!this._enabled) return value;

    const hooks = this.filters.get(hookName);
    if (!hooks || hooks.length === 0) return value;

    let currentValue = value;
    for (const hook of hooks) {
      try {
        hook.lastRun = new Date();
        const result = await (hook.callback as FilterCallback)(currentValue, ...args);
        if (result !== undefined) {
          currentValue = result;
        }
      } catch (error: any) {
        hook.lastError = error?.message || String(error);
        this.logError(hookName, hook.pluginId, error);
        console.error(
          `[HookManager] Filter "${hookName}" failed for plugin "${hook.pluginId}":`,
          error?.message || error
        );
      }
    }

    return currentValue;
  }

  // ─── Management ─────────────────────────────────────────────────

  removeAllHooks(pluginId: string): void {
    for (const [hookName, hooks] of this.actions) {
      this.actions.set(hookName, hooks.filter(h => h.pluginId !== pluginId));
    }
    for (const [hookName, hooks] of this.filters) {
      this.filters.set(hookName, hooks.filter(h => h.pluginId !== pluginId));
    }
  }

  removeAction(hookName: string, pluginId: string): void {
    const hooks = this.actions.get(hookName);
    if (hooks) {
      this.actions.set(hookName, hooks.filter(h => h.pluginId !== pluginId));
    }
  }

  removeFilter(hookName: string, pluginId: string): void {
    const hooks = this.filters.get(hookName);
    if (hooks) {
      this.filters.set(hookName, hooks.filter(h => h.pluginId !== pluginId));
    }
  }

  // ─── Introspection ──────────────────────────────────────────────

  getRegisteredHooks(): {
    actions: { name: string; callbacks: number; plugins: string[] }[];
    filters: { name: string; callbacks: number; plugins: string[] }[];
  } {
    const actionsList = Array.from(this.actions.entries())
      .filter(([, hooks]) => hooks.length > 0)
      .map(([name, hooks]) => ({
        name,
        callbacks: hooks.length,
        plugins: [...new Set(hooks.map(h => h.pluginId))],
      }));

    const filtersList = Array.from(this.filters.entries())
      .filter(([, hooks]) => hooks.length > 0)
      .map(([name, hooks]) => ({
        name,
        callbacks: hooks.length,
        plugins: [...new Set(hooks.map(h => h.pluginId))],
      }));

    return { actions: actionsList, filters: filtersList };
  }

  getPluginHooks(pluginId: string): RegisteredHook[] {
    const result: RegisteredHook[] = [];

    for (const [hookName, hooks] of this.actions) {
      for (const hook of hooks) {
        if (hook.pluginId === pluginId) {
          result.push({ hookName, type: 'action', pluginId, priority: hook.priority });
        }
      }
    }
    for (const [hookName, hooks] of this.filters) {
      for (const hook of hooks) {
        if (hook.pluginId === pluginId) {
          result.push({ hookName, type: 'filter', pluginId, priority: hook.priority });
        }
      }
    }

    return result;
  }

  getAllHooksDetails(): RegisteredHook[] {
    const result: RegisteredHook[] = [];

    for (const [hookName, hooks] of this.actions) {
      for (const hook of hooks) {
        result.push({ 
          hookName, 
          type: 'action', 
          pluginId: hook.pluginId, 
          priority: hook.priority,
          lastRun: hook.lastRun,
          lastError: hook.lastError
        });
      }
    }
    for (const [hookName, hooks] of this.filters) {
      for (const hook of hooks) {
        result.push({ 
          hookName, 
          type: 'filter', 
          pluginId: hook.pluginId, 
          priority: hook.priority,
          lastRun: hook.lastRun,
          lastError: hook.lastError
        });
      }
    }

    return result;
  }

  getErrorLog(limit: number = 50): typeof this.errorLog {
    return this.errorLog.slice(-limit);
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  // ─── Control ────────────────────────────────────────────────────

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  reset(): void {
    this.actions.clear();
    this.filters.clear();
    this.errorLog = [];
    this._enabled = true;
  }

  // ─── Private ────────────────────────────────────────────────────

  private logError(hookName: string, pluginId: string, error: any): void {
    this.errorLog.push({
      hookName,
      pluginId,
      error: error?.message || String(error),
      timestamp: new Date(),
    });
    if (this.errorLog.length > 200) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }
}
