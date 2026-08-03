const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
const windows1252Decoder = new TextDecoder('windows-1252');

const windows1252Bytes = new Map<string, number>();
for (let byte = 0; byte <= 0xff; byte += 1) {
  const decoded = windows1252Decoder.decode(Uint8Array.of(byte));
  const character = decoded === '\uFFFD' ? String.fromCharCode(byte) : decoded;
  windows1252Bytes.set(character, byte);
}

const ENCODABLE_RUN = /[\u0000-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018\u2019\u201a\u201c\u201d\u201e\u2020\u2021\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]+/gu;
const STRONG_MARKERS = /(?:Ã[\u0080-\u00bf\u0192\u201a-\u203a\u20ac\u2122]|Â[\u0080-\u00bf]|Ä[\u0080-\u00bf\u2018-\u201e]|Æ[\u0080-\u00bf\u01a0-\u01b0]|â[\u0080-\u2122]|á[º»]|ðŸ|ï¸|ï»)/gu;
const CONTROL_MARKERS = /[\u0080-\u009f\uFFFD]/gu;

export function mojibakeScore(value: string): number {
  return (value.match(STRONG_MARKERS)?.length ?? 0) * 3
    + (value.match(CONTROL_MARKERS)?.length ?? 0) * 5;
}

export function hasMojibake(value: string): boolean {
  return mojibakeScore(value) > 0;
}

function encodeWindows1252(value: string): Uint8Array | null {
  const bytes: number[] = [];
  for (const character of value) {
    const byte = windows1252Bytes.get(character);
    if (byte === undefined) return null;
    bytes.push(byte);
  }
  return Uint8Array.from(bytes);
}

function collapseHybridLead(value: string): string {
  return value.replace(/Ã(?=[\u00c0-\u00ef][\u0080-\u00bf\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013-\u203a\u20ac\u2122])/gu, '');
}

function repairRun(value: string): string {
  const collapsed = collapseHybridLead(value);
  const source = mojibakeScore(collapsed) < mojibakeScore(value) ? collapsed : value;
  const encoded = encodeWindows1252(source);
  if (!encoded) return source;

  let candidate = '';
  let changed = source !== value;
  for (let index = 0; index < encoded.length;) {
    let decoded: string | null = null;
    let consumed = 1;
    for (const length of [4, 3, 2]) {
      if (index + length > encoded.length) continue;
      try {
        const attempt = utf8Decoder.decode(encoded.slice(index, index + length));
        if ([...attempt].length === 1 && attempt.codePointAt(0)! > 0x7f) {
          decoded = attempt;
          consumed = length;
          break;
        }
      } catch {
        // Try a shorter UTF-8 sequence.
      }
    }
    if (decoded) {
      candidate += decoded;
      changed = true;
    } else {
      candidate += source[index];
    }
    index += consumed;
  }

  return changed && mojibakeScore(candidate) < mojibakeScore(value) ? candidate : value;
}

export function repairMojibake(value: string, maxPasses = 4): string {
  let current = value;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const candidate = current.replace(ENCODABLE_RUN, repairRun);
    if (candidate === current || mojibakeScore(candidate) >= mojibakeScore(current)) break;
    current = candidate;
  }
  return current;
}

export function repairJsonValue<T>(value: T): T {
  if (typeof value === 'string') return repairMojibake(value) as T;
  if (Array.isArray(value)) return value.map(item => repairJsonValue(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, repairJsonValue(item)])) as T;
  }
  return value;
}

export function repairSerializedText(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.stringify(repairJsonValue(JSON.parse(value)));
    } catch {
      // Non-JSON text is repaired below.
    }
  }
  return repairMojibake(value);
}
