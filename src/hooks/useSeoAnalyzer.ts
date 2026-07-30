import { useMemo } from 'react';

export interface SeoCheckItem {
  id: string;
  label: string;
  status: 'good' | 'improvement' | 'bad';
  message: string;
}

export interface SeoAnalysisResult {
  seoScore: number;
  readabilityScore: number;
  seoChecks: SeoCheckItem[];
  readabilityChecks: SeoCheckItem[];
}

interface SeoAnalyzerProps {
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  slug?: string;
}

type ImageInfo = {
  tag: string;
  alt: string;
};

type SeoMetrics = {
  plainText: string;
  words: string[];
  totalWords: number;
  first100Words: string;
  last100Words: string;
  h2Texts: string[];
  h3Texts: string[];
  images: ImageInfo[];
  links: string[];
  internalLinks: string[];
  externalLinks: string[];
  keywordCount: number;
  density: number;
};

function escapeRegex(value: string) {
  return value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPlainText(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadingTexts(html: string, level: 2 | 3) {
  const matches = [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi'))];
  return matches.map(match => getPlainText(match[1] || '')).filter(Boolean);
}

function extractImages(html: string): ImageInfo[] {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => {
    const tag = match[0];
    const altMatch = tag.match(/alt=["']([^"'>]*)["']/i);
    return { tag, alt: altMatch?.[1]?.trim() || '' };
  });
  return images;
}

function extractLinks(html: string) {
  return [...html.matchAll(/<a[^>]+href=["']([^"'>]+)["']/gi)].map(match => match[1]);
}

function hasKeyword(value: string, keyword: string) {
  if (!keyword) return false;
  return normalizeText(value).includes(normalizeText(keyword));
}

function buildSeoMetrics(content: string, keyword: string): SeoMetrics {
  const plainText = getPlainText(content || '');
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  const first100Words = words.slice(0, 100).join(' ');
  const last100Words = words.slice(-100).join(' ');
  const images = extractImages(content || '');
  const links = extractLinks(content || '');
  const internalLinks = links.filter(href => href.startsWith('/') || href.includes('lexi.vn'));
  const externalLinks = links.filter(href => /^https?:\/\//i.test(href) && !href.includes('lexi.vn'));
  const keywordRegex = keyword ? new RegExp(escapeRegex(keyword), 'gi') : null;
  const keywordCount = keywordRegex ? (plainText.match(keywordRegex) || []).length : 0;
  const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;

  return {
    plainText,
    words,
    totalWords,
    first100Words,
    last100Words,
    h2Texts: extractHeadingTexts(content || '', 2),
    h3Texts: extractHeadingTexts(content || '', 3),
    images,
    links,
    internalLinks,
    externalLinks,
    keywordCount,
    density
  };
}

function computeReadability(cleanContentHtml: string, plainText: string, totalWords: number): { score: number; checks: SeoCheckItem[] } {
  const checks: SeoCheckItem[] = [];
  let goodReadCount = 0;
  let totalReadChecked = 0;

  // A. Độ dài bài viết (word count)
  totalReadChecked++;
  if (totalWords >= 300) {
    goodReadCount++;
    checks.push({ id: 'word-count', label: 'Độ dài bài viết', status: 'good', message: `Tuyệt vời! Độ dài bài viết đạt ${totalWords} từ (khuyên dùng: >300 từ).` });
  } else if (totalWords >= 150) {
    checks.push({ id: 'word-count', label: 'Độ dài bài viết', status: 'improvement', message: `Bài viết hơi ngắn (${totalWords} từ). Nên viết chi tiết hơn.` });
  } else {
    checks.push({ id: 'word-count', label: 'Độ dài bài viết', status: 'bad', message: `Nội dung quá ngắn (${totalWords} từ, yêu cầu tối thiểu 300 từ để chuẩn SEO).` });
  }

  // B. Độ dài câu (sentence length) - stricter threshold
  totalReadChecked++;
  const sentences = plainText.split(/[.!?。]+/).filter(s => s.trim().length > 5);
  let longSentencesCount = 0;
  sentences.forEach(s => {
    const sentenceWords = s.trim().split(/\s+/).length;
    if (sentenceWords > 25) longSentencesCount++;
  });
  const longSentenceRatio = sentences.length > 0 ? (longSentencesCount / sentences.length) * 100 : 0;
  if (longSentenceRatio <= 15) {
    goodReadCount++;
    checks.push({ id: 'sentence-len', label: 'Độ dài câu', status: 'good', message: `Tốt! Chỉ có ${longSentenceRatio.toFixed(1)}% số câu dài hơn 25 từ (khuyên dùng: <15%).` });
  } else {
    checks.push({ id: 'sentence-len', label: 'Độ dài câu', status: 'improvement', message: `Có đến ${longSentenceRatio.toFixed(1)}% số câu dài hơn 25 từ. Hãy tách nhỏ câu để dễ đọc.` });
  }

  // C. Sử dụng các thẻ Heading H2/H3 phân nhóm
  totalReadChecked++;
  const heading2And3 = (cleanContentHtml.match(/<h[23][^>]*>/gi) || []).length;
  if (totalWords > 300 && heading2And3 >= 2) {
    goodReadCount++;
    checks.push({ id: 'headings-dist', label: 'Phân nhóm tiêu đề', status: 'good', message: `Rất tốt! Bài viết có ${heading2And3} thẻ heading H2/H3 hỗ trợ điều hướng.` });
  } else if (totalWords <= 300) {
    goodReadCount++;
    checks.push({ id: 'headings-dist', label: 'Phân nhóm tiêu đề', status: 'good', message: 'Độ dài bài ngắn, chưa cần phân chia heading phụ.' });
  } else {
    checks.push({ id: 'headings-dist', label: 'Phân nhóm tiêu đề', status: 'improvement', message: 'Nội dung dài nhưng cần thêm ít nhất 2 thẻ Heading H2/H3 để chia nhỏ các ý.' });
  }

  // D. Độ dài đoạn văn (paragraph length) - fixed regex to support nested tags
  totalReadChecked++;
  const paragraphMatches = cleanContentHtml.match(/<p[\s>][^]*?<\/p>/gi) || [];
  let longParagraphsCount = 0;
  paragraphMatches.forEach(p => {
    const plainP = p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const pWords = plainP.split(/\s+/).filter(w => w.length > 0).length;
    if (pWords > 120) longParagraphsCount++;
  });
  if (paragraphMatches.length > 0 && longParagraphsCount === 0) {
    goodReadCount++;
    checks.push({ id: 'p-len', label: 'Độ dài đoạn văn', status: 'good', message: 'Tuyệt vời! Không có đoạn văn nào quá dài (>120 từ).' });
  } else if (longParagraphsCount > 0) {
    checks.push({ id: 'p-len', label: 'Độ dài đoạn văn', status: 'improvement', message: `Có ${longParagraphsCount} đoạn văn quá dài (>120 từ). Hãy ngắt dòng để thoáng mắt.` });
  } else {
    checks.push({ id: 'p-len', label: 'Độ dài đoạn văn', status: 'improvement', message: 'Không phát hiện đoạn văn nào có cấu trúc <p>. Hãy sử dụng các thẻ đoạn văn.' });
  }

  // E. Từ chuyển tiếp (transition words usage)
  totalReadChecked++;
  const transitionWords = [
    'tuy nhiên', 'ngoài ra', 'hơn nữa', 'bên cạnh đó', 'do đó', 'vì vậy',
    'mặt khác', 'trước hết', 'cuối cùng', 'tiếp theo', 'đặc biệt', 'chẳng hạn',
    'ví dụ', 'nói cách khác', 'tóm lại', 'kết luận', 'đầu tiên', 'thứ hai',
    'nhìn chung', 'cụ thể', 'thực tế', 'đáng chú ý', 'quan trọng hơn',
    'however', 'moreover', 'furthermore', 'therefore', 'additionally', 'finally',
    'in conclusion', 'for example', 'on the other hand', 'as a result'
  ];
  const lowerPlain = plainText.toLowerCase();
  let transitionCount = 0;
  transitionWords.forEach(tw => {
    const twRegex = new RegExp(tw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    transitionCount += (lowerPlain.match(twRegex) || []).length;
  });
  const transitionRatio = sentences.length > 0 ? (transitionCount / sentences.length) * 100 : 0;
  if (transitionRatio >= 20) {
    goodReadCount++;
    checks.push({ id: 'transition', label: 'Từ chuyển tiếp', status: 'good', message: `Tốt! ${transitionRatio.toFixed(1)}% câu có sử dụng từ chuyển tiếp.` });
  } else {
    checks.push({ id: 'transition', label: 'Từ chuyển tiếp', status: 'improvement', message: `Chỉ ${transitionRatio.toFixed(1)}% câu có từ chuyển tiếp. Hãy dùng thêm các từ như "tuy nhiên", "ngoài ra", "vì vậy"...` });
  }

  // F. Số lượng từ trung bình mỗi câu (content flow)
  totalReadChecked++;
  const avgWordsPerSentence = sentences.length > 0 ? totalWords / sentences.length : 0;
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    goodReadCount++;
    checks.push({ id: 'avg-sentence', label: 'Độ dài câu trung bình', status: 'good', message: `Tốt! Trung bình ${avgWordsPerSentence.toFixed(1)} từ/câu (lý tưởng: 10-20).` });
  } else {
    checks.push({ id: 'avg-sentence', label: 'Độ dài câu trung bình', status: 'improvement', message: `Trung bình ${avgWordsPerSentence.toFixed(1)} từ/câu. Lý tưởng là 10-20 từ/câu.` });
  }

  // G. Cấu trúc danh sách (list usage for scannability)
  totalReadChecked++;
  const listItems = (cleanContentHtml.match(/<li[\s>]/gi) || []).length;
  if (listItems >= 1 || totalWords < 200) {
    goodReadCount++;
    checks.push({ id: 'list-usage', label: 'Sử dụng danh sách', status: 'good', message: listItems > 0 ? `Tốt! Bài viết có ${listItems} mục danh sách giúp dễ quét nội dung.` : 'Bài viết ngắn, chưa cần danh sách.' });
  } else {
    checks.push({ id: 'list-usage', label: 'Sử dụng danh sách', status: 'improvement', message: 'Nên thêm danh sách (ul/ol) để nội dung dễ quét và trực quan hơn.' });
  }

  const score = totalReadChecked > 0 ? Math.round((goodReadCount / totalReadChecked) * 100) : 0;
  return { score, checks };
}

export function useSeoAnalyzer({
  title,
  content,
  seoTitle,
  seoDescription,
  seoKeywords,
  slug
}: SeoAnalyzerProps): SeoAnalysisResult {
  return useMemo(() => {
    const seoChecks: SeoCheckItem[] = [];

    const keyword = seoKeywords.trim().toLowerCase();
    const finalTitle = (seoTitle || title).trim();
    const cleanContentHtml = content || '';
    const metrics = buildSeoMetrics(cleanContentHtml, keyword);
    const { plainText, totalWords } = metrics;

    // ────────────────────────────────────────────────────────
    // 1. SEO ANALYSIS - Yoast Level 1 On-page Criteria
    // ────────────────────────────────────────────────────────
    if (!keyword) {
      // No keyword: SEO score is 0, but still compute readability independently
      const readResult = computeReadability(cleanContentHtml, plainText, totalWords);
      return {
        seoScore: 0,
        readabilityScore: readResult.score,
        seoChecks: [
          {
            id: 'no-keyword',
            label: 'Cụm từ khóa chính',
            status: 'bad',
            message: 'Vui lòng nhập cụm từ khóa chính để bắt đầu phân tích SEO.'
          }
        ],
        readabilityChecks: readResult.checks
      };
    }

    let goodSeoCount = 0;
    let totalSeoChecked = 0;
    const addSeoCheck = (check: SeoCheckItem, isGood: boolean) => {
      totalSeoChecked++;
      if (isGood) goodSeoCount++;
      seoChecks.push(check);
    };

    const currentSlug = slug || '';

    // 1. URL / Slug chứa từ khóa
    const slugHasKeyword = hasKeyword(currentSlug.replace(/-/g, ' '), keyword);
    addSeoCheck({
      id: 'kw-slug',
      label: 'Từ khóa trong URL/Slug',
      status: slugHasKeyword ? 'good' : 'improvement',
      message: slugHasKeyword
        ? 'Tốt! Slug/URL đã chứa cụm từ khóa chính.'
        : 'Slug/URL chưa chứa cụm từ khóa chính. Nên thêm từ khóa vào đường dẫn.'
    }, slugHasKeyword);

    // 2. H1 chứa từ khóa (tiêu đề bài viết)
    const h1HasKeyword = hasKeyword(title, keyword);
    addSeoCheck({
      id: 'kw-h1',
      label: 'Từ khóa trong H1',
      status: h1HasKeyword ? 'good' : 'bad',
      message: h1HasKeyword
        ? 'Tuyệt vời! Tiêu đề H1 chứa từ khóa chính.'
        : 'Tiêu đề bài viết (H1) chưa chứa từ khóa chính.'
    }, h1HasKeyword);

    // 3. H2 chứa từ khóa
    const h2HasKeyword = metrics.h2Texts.some(h2 => hasKeyword(h2, keyword));
    addSeoCheck({
      id: 'kw-h2',
      label: 'Từ khóa trong H2',
      status: h2HasKeyword ? 'good' : metrics.h2Texts.length > 0 ? 'improvement' : 'bad',
      message: h2HasKeyword
        ? 'Tốt! Ít nhất một tiêu đề H2 chứa từ khóa chính.'
        : metrics.h2Texts.length > 0
          ? 'Đã có H2 nhưng chưa có H2 nào chứa từ khóa chính.'
          : 'Bài viết chưa có thẻ H2. Hãy thêm H2 có chứa từ khóa chính.'
    }, h2HasKeyword);

    // 4. H3 chứa từ khóa
    const h3HasKeyword = metrics.h3Texts.some(h3 => hasKeyword(h3, keyword));
    addSeoCheck({
      id: 'kw-h3',
      label: 'Từ khóa trong H3',
      status: h3HasKeyword ? 'good' : metrics.h3Texts.length > 0 ? 'improvement' : 'bad',
      message: h3HasKeyword
        ? 'Tốt! Ít nhất một tiêu đề H3 chứa từ khóa chính.'
        : metrics.h3Texts.length > 0
          ? 'Đã có H3 nhưng chưa có H3 nào chứa từ khóa chính.'
          : 'Bài viết chưa có thẻ H3. Hãy thêm H3 phụ có chứa từ khóa nếu phù hợp.'
    }, h3HasKeyword);

    // 5. Từ khóa trong 100 từ đầu tiên
    const first100HasKeyword = hasKeyword(metrics.first100Words, keyword);
    addSeoCheck({
      id: 'kw-first-100',
      label: 'Từ khóa trong 100 từ đầu',
      status: first100HasKeyword ? 'good' : 'bad',
      message: first100HasKeyword
        ? 'Tốt! Từ khóa xuất hiện trong phần mở đầu.'
        : 'Từ khóa chưa xuất hiện trong 100 từ đầu tiên. Nên thêm vào đoạn mở đầu.'
    }, first100HasKeyword);

    // 6. Từ khóa trong 100 từ cuối
    const last100HasKeyword = hasKeyword(metrics.last100Words, keyword);
    addSeoCheck({
      id: 'kw-last-100',
      label: 'Từ khóa trong 100 từ cuối',
      status: last100HasKeyword ? 'good' : 'improvement',
      message: last100HasKeyword
        ? 'Tốt! Từ khóa xuất hiện ở phần kết luận/cuối bài.'
        : 'Từ khóa chưa xuất hiện trong 100 từ cuối. Nên nhắc lại tự nhiên ở phần kết luận.'
    }, last100HasKeyword);

    // 7. Độ dài nội dung tối thiểu
    const contentLengthGood = totalWords >= 600;
    addSeoCheck({
      id: 'content-len',
      label: 'Độ dài nội dung',
      status: contentLengthGood ? 'good' : totalWords >= 300 ? 'improvement' : 'bad',
      message: contentLengthGood
        ? `Tuyệt vời! Nội dung đạt ${totalWords} từ (chuẩn SEO: >=600 từ).`
        : totalWords >= 300
          ? `Nội dung có ${totalWords} từ. Nên mở rộng lên tối thiểu 600 từ để chuyên sâu hơn.`
          : `Nội dung quá ngắn (${totalWords} từ). Cần tối thiểu 300 từ, khuyến nghị >=600 từ.`
    }, contentLengthGood);

    // 8. Mật độ từ khóa
    const densityGood = metrics.keywordCount > 0 && metrics.density >= 0.5 && metrics.density <= 2.5;
    addSeoCheck({
      id: 'kw-density',
      label: 'Mật độ từ khóa',
      status: densityGood ? 'good' : metrics.keywordCount === 0 ? 'bad' : 'improvement',
      message: densityGood
        ? `Tuyệt vời! Mật độ từ khóa ${metrics.density.toFixed(2)}% (${metrics.keywordCount} lần).`
        : metrics.keywordCount === 0
          ? 'Mật độ từ khóa là 0% vì không tìm thấy từ khóa trong nội dung.'
          : metrics.density < 0.5
            ? `Mật độ hơi thấp (${metrics.density.toFixed(2)}%). Nên bổ sung từ khóa tự nhiên hơn.`
            : `Mật độ hơi cao (${metrics.density.toFixed(2)}%). Cẩn thận nhồi nhét từ khóa.`
    }, densityGood);

    // 9. Internal Link
    const hasInternalLink = metrics.internalLinks.length > 0;
    addSeoCheck({
      id: 'links-internal',
      label: 'Liên kết nội bộ',
      status: hasInternalLink ? 'good' : 'bad',
      message: hasInternalLink
        ? `Tốt! Có ${metrics.internalLinks.length} liên kết nội bộ.`
        : 'Chưa có liên kết nội bộ. Hãy thêm link tới bài viết/trang liên quan trên lexi.vn.'
    }, hasInternalLink);

    // 10. External Link
    const hasExternalLink = metrics.externalLinks.length > 0;
    addSeoCheck({
      id: 'links-external',
      label: 'Liên kết ngoài',
      status: hasExternalLink ? 'good' : 'improvement',
      message: hasExternalLink
        ? `Tốt! Có ${metrics.externalLinks.length} liên kết ngoài.`
        : 'Chưa có liên kết ngoài. Nên thêm ít nhất 1 nguồn tham khảo chất lượng nếu phù hợp.'
    }, hasExternalLink);

    // 11. Image ALT chứa từ khóa
    const imageAltKeyword = metrics.images.some(img => hasKeyword(img.alt, keyword));
    addSeoCheck({
      id: 'img-alt-kw',
      label: 'ALT ảnh chứa từ khóa',
      status: imageAltKeyword ? 'good' : metrics.images.length > 0 ? 'improvement' : 'bad',
      message: imageAltKeyword
        ? 'Tốt! Ít nhất một ảnh có ALT chứa từ khóa chính.'
        : metrics.images.length > 0
          ? 'Ảnh đã có trong bài nhưng chưa có ALT nào chứa từ khóa chính.'
          : 'Chưa có ảnh để tối ưu ALT chứa từ khóa.'
    }, imageAltKeyword);

    // 12. Số lượng ảnh trong bài
    const hasImage = metrics.images.length > 0;
    addSeoCheck({
      id: 'img-count',
      label: 'Số lượng ảnh trong bài',
      status: hasImage ? 'good' : 'improvement',
      message: hasImage
        ? `Tốt! Bài viết có ${metrics.images.length} ảnh minh họa.`
        : 'Bài viết chưa có hình ảnh. Nên thêm ít nhất 1 ảnh minh họa.'
    }, hasImage);

    // Giữ lại 2 tiêu chí snippet quan trọng hiện có để SEO box vẫn hữu ích cho Google Preview
    const descLen = seoDescription.length;
    const descGood = descLen >= 120 && descLen <= 160;
    addSeoCheck({
      id: 'desc-len',
      label: 'Độ dài thẻ mô tả (Meta)',
      status: descGood ? 'good' : descLen >= 50 && descLen < 120 ? 'improvement' : 'bad',
      message: descGood
        ? `Độ dài thẻ mô tả rất tốt (${descLen} ký tự, khuyên dùng: 120-160).`
        : descLen === 0
          ? 'Chưa có thẻ mô tả Meta. Google sẽ tự động lấy một đoạn ngẫu nhiên.'
          : `Độ dài mô tả chưa tối ưu (${descLen} ký tự, khuyên dùng: 120-160).`
    }, descGood);

    const titleLen = finalTitle.length;
    const titleLenGood = titleLen >= 40 && titleLen <= 60;
    addSeoCheck({
      id: 'title-len',
      label: 'Độ dài Tiêu đề SEO',
      status: titleLenGood ? 'good' : titleLen >= 25 && titleLen < 40 ? 'improvement' : 'bad',
      message: titleLenGood
        ? `Tiêu đề rất tối ưu (${titleLen} ký tự, khuyên dùng: 40-60).`
        : `Tiêu đề chưa tối ưu (${titleLen} ký tự, khuyên dùng: 40-60).`
    }, titleLenGood);

    const seoScore = Math.round((goodSeoCount / totalSeoChecked) * 100);

    const readResult = computeReadability(cleanContentHtml, plainText, totalWords);
    const readabilityScore = readResult.score;
    const readabilityChecksFinal = readResult.checks;

    return {
      seoScore,
      readabilityScore,
      seoChecks: seoChecks.sort((a, b) => {
        const order = { bad: 0, improvement: 1, good: 2 };
        return order[a.status] - order[b.status];
      }),
      readabilityChecks: readabilityChecksFinal.sort((a, b) => {
        const order = { bad: 0, improvement: 1, good: 2 };
        return order[a.status] - order[b.status];
      })
    };
  }, [title, content, seoTitle, seoDescription, seoKeywords, slug]);
}

export function calculateSeoScore({
  title,
  content,
  seoTitle,
  seoDescription,
  seoKeywords,
  slug = ''
}: {
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  slug?: string;
}): number {
  const keyword = (seoKeywords || '').trim().toLowerCase();
  if (!keyword) return 0;

  const finalTitle = (seoTitle || title || '').trim();
  const metrics = buildSeoMetrics(content || '', keyword);

  const checks = [
    hasKeyword(slug.replace(/-/g, ' '), keyword),
    hasKeyword(title || '', keyword),
    metrics.h2Texts.some(h2 => hasKeyword(h2, keyword)),
    metrics.h3Texts.some(h3 => hasKeyword(h3, keyword)),
    hasKeyword(metrics.first100Words, keyword),
    hasKeyword(metrics.last100Words, keyword),
    metrics.totalWords >= 600,
    metrics.keywordCount > 0 && metrics.density >= 0.5 && metrics.density <= 2.5,
    metrics.internalLinks.length > 0,
    metrics.externalLinks.length > 0,
    metrics.images.some(img => hasKeyword(img.alt, keyword)),
    metrics.images.length > 0,
    (seoDescription || '').length >= 120 && (seoDescription || '').length <= 160,
    finalTitle.length >= 40 && finalTitle.length <= 60
  ];

  const goodCount = checks.filter(Boolean).length;
  return Math.round((goodCount / checks.length) * 100);
}

export function calculateReadabilityScore({
  content
}: {
  content: string;
}): number {
  const cleanContentHtml = content || '';
  
  const getPlainText = (html: string) => {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  };

  const plainText = getPlainText(cleanContentHtml);
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  let goodReadCount = 0;
  let totalReadChecked = 0;

  // A. Độ dài bài viết (word count)
  totalReadChecked++;
  if (totalWords >= 300) {
    goodReadCount++;
  }

  // B. Độ dài câu (sentence length) - stricter threshold
  totalReadChecked++;
  const sentences = plainText.split(/[.!?。]+/).filter(s => s.trim().length > 5);
  let longSentencesCount = 0;
  sentences.forEach(s => {
    const sentenceWords = s.trim().split(/\s+/).length;
    if (sentenceWords > 25) longSentencesCount++;
  });
  const longSentenceRatio = sentences.length > 0 ? (longSentencesCount / sentences.length) * 100 : 0;
  if (longSentenceRatio <= 15) {
    goodReadCount++;
  }

  // C. Sử dụng các thẻ Heading H2/H3 phân nhóm
  totalReadChecked++;
  const heading2And3 = (cleanContentHtml.match(/<h[23][^>]*>/gi) || []).length;
  if (totalWords > 300 && heading2And3 >= 2) {
    goodReadCount++;
  } else if (totalWords <= 300) {
    goodReadCount++; // Short articles don't need headings
  }

  // D. Độ dài đoạn văn (paragraph length) - fixed regex to support nested tags
  totalReadChecked++;
  const paragraphMatches = cleanContentHtml.match(/<p[\s>][^]*?<\/p>/gi) || [];
  let longParagraphsCount = 0;
  paragraphMatches.forEach(p => {
    const plainP = p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const pWords = plainP.split(/\s+/).filter(w => w.length > 0).length;
    if (pWords > 120) longParagraphsCount++;
  });
  if (paragraphMatches.length > 0 && longParagraphsCount === 0) {
    goodReadCount++;
  }

  // E. Từ chuyển tiếp (transition words usage)
  totalReadChecked++;
  const transitionWords = [
    'tuy nhiên', 'ngoài ra', 'hơn nữa', 'bên cạnh đó', 'do đó', 'vì vậy',
    'mặt khác', 'trước hết', 'cuối cùng', 'tiếp theo', 'đặc biệt', 'chẳng hạn',
    'ví dụ', 'nói cách khác', 'tóm lại', 'kết luận', 'đầu tiên', 'thứ hai',
    'nhìn chung', 'cụ thể', 'thực tế', 'đáng chú ý', 'quan trọng hơn',
    'however', 'moreover', 'furthermore', 'therefore', 'additionally', 'finally',
    'in conclusion', 'for example', 'on the other hand', 'as a result'
  ];
  const lowerPlain = plainText.toLowerCase();
  let transitionCount = 0;
  transitionWords.forEach(tw => {
    const twRegex = new RegExp(tw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    transitionCount += (lowerPlain.match(twRegex) || []).length;
  });
  const transitionRatio = sentences.length > 0 ? (transitionCount / sentences.length) * 100 : 0;
  if (transitionRatio >= 20) {
    goodReadCount++;
  }

  // F. Số lượng câu trung bình mỗi đoạn (content flow)
  totalReadChecked++;
  const avgWordsPerSentence = sentences.length > 0 ? totalWords / sentences.length : 0;
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    goodReadCount++;
  }

  // G. Cấu trúc danh sách (list usage for scannability)
  totalReadChecked++;
  const listItems = (cleanContentHtml.match(/<li[\s>]/gi) || []).length;
  if (listItems >= 1 || totalWords < 200) {
    goodReadCount++;
  }

  return Math.round((goodReadCount / totalReadChecked) * 100);
}
