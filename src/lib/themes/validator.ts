import fs from 'fs';
import path from 'path';
import { ThemeManifest } from './manifest.schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: ThemeManifest;
}

export function validateThemeManifest(params: {
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
    'id', 'name', 'version', 'author', 'description', 
    'previewImage', 'supports', 'templates'
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
    errors.push('id phải đúng định dạng lowercase-kebab-case (ví dụ: my-theme)');
  }
  if (manifest.id !== folderName) {
    errors.push(`id ("${manifest.id}") phải trùng khớp hoàn toàn với tên thư mục ("${folderName}").`);
  }

  // 5. Version semver basic check
  const semverRegex = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  if (!semverRegex.test(manifest.version)) {
    errors.push('version phải đúng chuẩn semver (ví dụ: 1.0.0)');
  }

  // 6. supports check
  if (!Array.isArray(manifest.supports)) {
    errors.push('supports phải là mảng (array).');
  } else {
    const uniqueCaps = new Set(manifest.supports);
    if (uniqueCaps.size !== manifest.supports.length) {
      warnings.push('supports chứa các tính năng trùng lặp.');
    }
  }

  // 7. previewImage check
  if (typeof manifest.previewImage !== 'string') {
    errors.push('previewImage phải là string.');
  } else if (manifest.previewImage.startsWith('http')) {
    errors.push('previewImage không được là đường dẫn ngoài (external URL).');
  } else if (params.manifestPath) {
    const previewImagePath = path.join(path.dirname(params.manifestPath), manifest.previewImage);
    if (!fs.existsSync(previewImagePath)) {
      warnings.push(`File ảnh preview "${manifest.previewImage}" không tồn tại.`);
    } else {
      const stats = fs.statSync(previewImagePath);
      if (stats.size === 0) {
        warnings.push(`File ảnh preview "${manifest.previewImage}" có dung lượng 0 bytes.`);
      }
    }
  }

  // 8. templates check
  if (typeof manifest.templates !== 'object' || manifest.templates === null || Array.isArray(manifest.templates)) {
    errors.push('templates phải là object.');
  } else {
    // 8.1. Fallback template
    if (!manifest.templates.fallback) {
      errors.push('Bắt buộc phải có templates.fallback');
    }

    // 8.2. Template path checks
    for (const [key, tplPath] of Object.entries(manifest.templates)) {
      if (typeof tplPath !== 'string') {
        errors.push(`Template path cho "${key}" phải là string.`);
      } else if (tplPath.startsWith('http')) {
        errors.push(`Template path cho "${key}" không được bắt đầu bằng http.`);
      } else if (tplPath.includes('../')) {
        errors.push(`Template path cho "${key}" không được trỏ ra ngoài thư mục theme.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    manifest: errors.length === 0 ? manifest as ThemeManifest : undefined
  };
}
