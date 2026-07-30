export function resolveMetaTemplate(template: string, vars: Record<string, string>): string {
  if (!template) return '';

  let result = template;

  // Add default dynamic variables if not present in vars
  const defaultVars: Record<string, string> = {
    currentyear: new Date().getFullYear().toString(),
    currentmonth: String(new Date().getMonth() + 1).padStart(2, '0'),
    ...vars,
  };

  // Replace %key% placeholders (case-insensitive)
  for (const [key, value] of Object.entries(defaultVars)) {
    const val = value !== undefined && value !== null ? String(value) : '';
    result = result.replace(new RegExp(`%${key}%`, 'gi'), val);
  }

  // Remove any remaining unresolved placeholders (e.g., %unresolved%)
  result = result.replace(/%[a-zA-Z0-9_]+%/g, '');

  // Normalize separators and white spaces
  // 1. Multiple spaces to single space
  result = result.replace(/\s+/g, ' ');

  // 2. Remove leading/trailing separator if it got left behind (e.g. "| Site Title" or "Post Title |")
  const sep = defaultVars.sep || '|';
  const escapedSep = sep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  // Clean up repeated separators like "Title | | Site" or trailing/leading
  result = result.replace(new RegExp(`\\s*${escapedSep}\\s*(?=\\s*${escapedSep})`, 'g'), '');
  result = result.replace(new RegExp(`^\\s*${escapedSep}\\s*`), '');
  result = result.replace(new RegExp(`\\s*${escapedSep}\\s*$`), '');

  return result.trim();
}
