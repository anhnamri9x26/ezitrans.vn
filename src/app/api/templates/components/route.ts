import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const templateType = searchParams.get('type');

    // 1. Get active theme
    const activeThemeSetting = await prisma.setting.findUnique({
      where: { key: 'active_theme' },
    });
    const activeThemeId = activeThemeSetting?.value || 'default';

    // 2. Scan theme directory
    const themeDir = path.join(process.cwd(), 'src', 'themes', activeThemeId);
    if (!fs.existsSync(themeDir)) {
      return NextResponse.json({
        success: true,
        themeId: activeThemeId,
        components: [],
        allComponents: [],
      });
    }

    const files = fs
      .readdirSync(themeDir)
      .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.d.ts'))
      .map((f) => f.replace(/\.(tsx|ts)$/, ''));

    // 3. Filter files by template type prefix if requested
    let filteredFiles = files;
    if (templateType) {
      const typeLower = templateType.toLowerCase();
      if (typeLower === 'header') {
        filteredFiles = files.filter((f) => f.toLowerCase().startsWith('header'));
      } else if (typeLower === 'footer') {
        filteredFiles = files.filter((f) => f.toLowerCase().startsWith('footer'));
      } else if (typeLower === 'single_post') {
        filteredFiles = files.filter(
          (f) =>
            f.toLowerCase().startsWith('postpage') ||
            f.toLowerCase().includes('single-post') ||
            f.toLowerCase().includes('post-page')
        );
      } else if (typeLower === 'single_page') {
        filteredFiles = files.filter(
          (f) =>
            (f.toLowerCase().startsWith('page') && !f.toLowerCase().startsWith('postpage')) ||
            f.toLowerCase().includes('single-page')
        );
      } else if (typeLower === 'archive') {
        filteredFiles = files.filter(
          (f) =>
            f.toLowerCase().startsWith('categorypage') ||
            f.toLowerCase().includes('archive') ||
            f.toLowerCase().includes('category-page')
        );
      } else if (typeLower === 'tag_archive') {
        filteredFiles = files.filter(
          (f) => f.toLowerCase().startsWith('tagpage') || f.toLowerCase().includes('tag-page')
        );
      } else if (typeLower === 'homepage') {
        filteredFiles = files.filter(
          (f) => f.toLowerCase().startsWith('homepage') || f.toLowerCase().includes('home-page')
        );
      } else if (typeLower === 'search') {
        filteredFiles = files.filter(
          (f) => f.toLowerCase().startsWith('search') || f.toLowerCase().includes('search-page')
        );
      } else if (typeLower === 'four_o_four') {
        filteredFiles = files.filter(
          (f) => f.toLowerCase().includes('404') || f.toLowerCase().includes('fourohfour')
        );
      } else if (typeLower === 'landing_page') {
        filteredFiles = files.filter(
          (f) =>
            f.toLowerCase().startsWith('landing') ||
            f.toLowerCase().includes('landing-page') ||
            f.toLowerCase().startsWith('page')
        );
      }
    }

    return NextResponse.json({
      success: true,
      themeId: activeThemeId,
      components: filteredFiles,
      allComponents: files,
    });
  } catch (error: any) {
    console.error('Error scanning theme components:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
