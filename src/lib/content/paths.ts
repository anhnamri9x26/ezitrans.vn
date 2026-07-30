import path from 'path';

export function getContentDir() {
  return process.env.CONTENT_DIR || path.join(process.cwd(), 'content');
}

export function getContentPath(...segments: string[]) {
  return path.join(getContentDir(), ...segments);
}

export const contentFolders = {
  uploads: () => getContentPath('uploads'),
  plugins: () => getContentPath('plugins'),
  themes: () => getContentPath('themes'),
  backups: () => getContentPath('backups'),
  upgradeTemp: () => getContentPath('upgrade-temp'),
  logs: () => getContentPath('logs'),
  updateLogs: () => getContentPath('logs', 'updates'),
};
