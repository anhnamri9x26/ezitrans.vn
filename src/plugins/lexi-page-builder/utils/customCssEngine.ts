export type CssValidationResult = {
  valid: boolean;
  error?: string;
};

export type CssClassesValidationResult = CssValidationResult & {
  classes: string[];
};

export type CustomCssGuardResult = {
  safe: boolean;
  sanitized: string;
  warnings: string[];
};

export type WidgetCssInput = {
  id: string;
  customCss?: string;
};

const ELEMENT_ID_PATTERN = /^[a-zA-Z][\w-]*$/;
const CSS_CLASS_PATTERN = /^[a-zA-Z_-][\w-]*$/;

const DANGEROUS_CSS_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /<\s*script/i, label: '<script' },
  { pattern: /javascript\s*:/i, label: 'javascript:' },
  { pattern: /@import\b/i, label: '@import' },
  { pattern: /expression\s*\(/i, label: 'expression(' },
  { pattern: /position\s*:\s*fixed\b/i, label: 'position: fixed' },
  { pattern: /position\s*:\s*sticky\b/i, label: 'position: sticky' },
];

export function validateElementId(value?: string): CssValidationResult {
  const id = (value || '').trim();
  if (!id) return { valid: true };
  if (!ELEMENT_ID_PATTERN.test(id)) {
    return {
      valid: false,
      error: 'Element ID phải bắt đầu bằng chữ cái và chỉ chứa chữ, số, gạch dưới hoặc gạch ngang.',
    };
  }
  return { valid: true };
}

export function validateCssClasses(value?: string | string[]): CssClassesValidationResult {
  const rawClasses = Array.isArray(value) ? value : String(value || '').split(/\s+/);
  const classes = rawClasses.map((item) => String(item).trim()).filter(Boolean);

  for (const className of classes) {
    if (!CSS_CLASS_PATTERN.test(className)) {
      return { valid: false, classes, error: `Class "${className}" không hợp lệ.` };
    }
    if (className.startsWith('lexi-')) {
      return { valid: false, classes, error: `Class "${className}" không được bắt đầu bằng "lexi-".` };
    }
  }

  return { valid: true, classes };
}

export function guardCustomCss(css?: string): CustomCssGuardResult {
  const sanitized = String(css || '').trim();
  if (!sanitized) return { safe: true, sanitized: '', warnings: [] };

  const warnings = DANGEROUS_CSS_PATTERNS
    .filter(({ pattern }) => pattern.test(sanitized))
    .map(({ label }) => `Custom CSS chứa pattern bị chặn: ${label}`);

  return { safe: warnings.length === 0, sanitized, warnings };
}

export function normalizePageScope(pageId?: string | number): string {
  const raw = String(pageId || 'unknown').trim();
  return raw.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function buildWidgetScopeSelector(widgetId: string, pageId?: string | number): string {
  return `[data-lexi-page-id="${normalizePageScope(pageId)}"] .lexi-element-${widgetId}`;
}

export function compileWidgetCss(customCss: string | undefined, widgetId: string, pageId?: string | number): string {
  const guard = guardCustomCss(customCss);
  if (!guard.safe || !guard.sanitized) return '';
  const scopeSelector = buildWidgetScopeSelector(widgetId, pageId);
  return guard.sanitized.replace(/\bselector\b/g, scopeSelector).trim();
}

export function generateWidgetCss(widget: WidgetCssInput, pageId?: string | number): string {
  if (!widget || !widget.id) return '';
  return compileWidgetCss(widget.customCss, widget.id, pageId);
}

export function generatePageCss(widgets: WidgetCssInput[], pageId?: string | number): string {
  return widgets.map((widget) => generateWidgetCss(widget, pageId)).filter(Boolean).join('\n\n');
}

export function formatCssClasses(value?: string | string[]): string {
  const result = validateCssClasses(value);
  return result.valid ? result.classes.join(' ') : '';
}
