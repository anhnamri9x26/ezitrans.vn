export type ActionCallback = (...args: any[]) => void | Promise<void>;
export type FilterCallback = (value: any, ...args: any[]) => any | Promise<any>;

export interface HookCallback {
  callback: ActionCallback | FilterCallback;
  priority: number;
  pluginId: string;
  lastRun?: Date;
  lastError?: string;
}

export interface RegisteredHook {
  hookName: string;
  type: 'action' | 'filter';
  pluginId: string;
  priority: number;
  lastRun?: Date;
  lastError?: string;
}
