import { PluginManifest, VALID_PLUGIN_CATEGORIES } from './manifest.schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: PluginManifest;
}

export function validatePluginManifest(params: {
  folderName: string;
  manifestRaw: string;
  manifestPath?: string;
}): ValidationResult {
  const { folderName, manifestRaw } = params;
  const errors: string[] = [];
  const warnings: string[] = [];
  let manifest: any;

  // 1. Check BOM
  if (manifestRaw.charCodeAt(0) === 0xFEFF) {
    errors.push('File chứa ký tự BOM ở đầu file. Vui lòng lưu dưới dạng UTF-8 without BOM.');
  }

  // 2. JSON Parse
  try {
    manifest = JSON.parse(manifestRaw.replace(/^\uFEFF/, ''));
  } catch (err: any) {
    errors.push(`Lỗi cú pháp JSON: ${err.message}`);
    return { valid: false, errors, warnings };
  }

  // 3. Required fields
  const requiredFields = [
    'id', 'name', 'description', 'version', 'author', 'settingKey', 
    'category', 'requires', 'capabilities', 'changelog'
  ];
  
  for (const field of requiredFields) {
    if (manifest[field] === undefined) {
      errors.push(`Thiếu trường bắt buộc: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, manifest };
  }

  // 4. ID validation
  const idRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!idRegex.test(manifest.id)) {
    errors.push('id phải đúng định dạng lowercase-kebab-case (ví dụ: my-plugin)');
  }
  if (manifest.id !== folderName) {
    errors.push(`id ("${manifest.id}") phải trùng khớp hoàn toàn với tên thư mục ("${folderName}").`);
  }

  // 5. Version semver basic check (x.y.z)
  const semverRegex = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  if (!semverRegex.test(manifest.version)) {
    errors.push('version phải đúng chuẩn semver (ví dụ: 1.0.0)');
  }

  // 6. settingKey check
  if (typeof manifest.settingKey === 'string') {
    if (!manifest.settingKey.startsWith('plugin_') || !manifest.settingKey.endsWith('_enabled')) {
      errors.push('settingKey phải bắt đầu bằng "plugin_" và kết thúc bằng "_enabled" (ví dụ: plugin_myplugin_enabled).');
    }
  } else {
    errors.push('settingKey phải là chuỗi (string).');
  }

  // 7. category check
  if (!VALID_PLUGIN_CATEGORIES.includes(manifest.category)) {
    errors.push(`category không hợp lệ. Phải là một trong: ${VALID_PLUGIN_CATEGORIES.join(', ')}`);
  }

  // 8. requires check
  if (!Array.isArray(manifest.requires)) {
    errors.push('requires phải là mảng (array).');
  } else if (manifest.requires.includes(manifest.id)) {
    errors.push('requires không được chứa chính plugin hiện tại.');
  }

  // 9. capabilities check
  if (!Array.isArray(manifest.capabilities)) {
    errors.push('capabilities phải là mảng (array).');
  } else {
    const uniqueCaps = new Set(manifest.capabilities);
    if (uniqueCaps.size !== manifest.capabilities.length) {
      warnings.push('capabilities chứa các quyền trùng lặp.');
    }
  }

  // 10. changelog check
  if (!Array.isArray(manifest.changelog)) {
    errors.push('changelog phải là mảng (array).');
  }

  // 11. adminRoute check
  if (manifest.adminRoute !== null && typeof manifest.adminRoute === 'string') {
    if (!manifest.adminRoute.startsWith('/')) {
      errors.push('adminRoute phải bắt đầu bằng dấu gạch chéo ("/") hoặc để null.');
    }
  } else if (manifest.adminRoute !== null && manifest.adminRoute !== undefined) {
      errors.push('adminRoute phải là string hoặc null.');
  }

  // 12. entry check
  if (manifest.entry) {
     if (typeof manifest.entry !== 'string') {
       errors.push('entry phải là string.');
     } else if (manifest.entry.startsWith('http')) {
       errors.push('entry không được là đường dẫn ngoài (external URL).');
     }
  }

  // 13. componentPath check
  if (manifest.componentPath) {
    if (typeof manifest.componentPath !== 'string') {
       errors.push('componentPath phải là string.');
    } else if (!manifest.componentPath.startsWith('@/plugins/') && !manifest.componentPath.startsWith('./') && !manifest.componentPath.startsWith('../')) {
       warnings.push('componentPath nên bắt đầu bằng "@/plugins/" hoặc dùng relative path ("./", "../").');
    }
  }

  // 14. iconColor check
  if (manifest.iconColor) {
    const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/i;
    if (!hexRegex.test(manifest.iconColor)) {
      errors.push('iconColor phải là mã màu hex hợp lệ (ví dụ: #ffffff).');
    }
  }

  // 15. hooks check
  if (manifest.hooks !== undefined && manifest.hooks !== null) {
    if (typeof manifest.hooks !== 'string') {
      errors.push('hooks phải là string hoặc null.');
    } else if (manifest.hooks.startsWith('http')) {
      errors.push('hooks không được là đường dẫn ngoài (external URL).');
    } else if (manifest.hooks.includes('../')) {
      errors.push('hooks không được trỏ ra ngoài thư mục plugin.');
    } else if (!manifest.hooks.endsWith('.ts') && !manifest.hooks.endsWith('.tsx')) {
      warnings.push('hooks nên kết thúc bằng .ts hoặc .tsx.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    manifest: errors.length === 0 ? manifest as PluginManifest : undefined
  };
}
