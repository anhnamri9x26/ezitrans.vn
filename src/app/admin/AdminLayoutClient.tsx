"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AccessDenied from '@/components/AccessDenied';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/AdminI18nProvider';
import { LayoutDashboard, FileText, Files, Image as ImageIcon, MessageSquare, Users, Settings, Database, ChevronDown, LogOut, Palette, Puzzle, Wrench, Sparkles, Cpu, Wand2, Shield, ShoppingBag, CloudDownload, Sun, Moon, Languages, ExternalLink, Menu, X } from 'lucide-react';

interface SubMenuItem {
  name: string;
  path: string;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  submenu?: SubMenuItem[];
  isSystemGroup?: boolean;
  badge?: string;
  requiredCapability?: string;
}

interface ExtraSidebarItem {
  label: string;
  href: string;
  iconName?: string;
  requiredCapability?: string;
  pluginId: string;
}

interface AdminLayoutClientProps {
  children: React.ReactNode;
  extraSidebarItems?: ExtraSidebarItem[];
}

export default function AdminLayoutClient({ children, extraSidebarItems = [] }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; username: string; avatarUrl?: string; capabilities?: string[]; role?: string } | null>(null);
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [siteTitle, setSiteTitle] = useState<string>('Lexi CMS');
  const [isEmailSmtpActive, setIsEmailSmtpActive] = useState<boolean>(true);
  const [isContactActive, setIsContactActive] = useState<boolean>(true);
  const [isSeoActive, setIsSeoActive] = useState<boolean>(true);
  const [isPageBuilderActive, setIsPageBuilderActive] = useState<boolean>(true);
  const [isLexiShieldActive, setIsLexiShieldActive] = useState<boolean>(true);
  const [isTocActive, setIsTocActive] = useState<boolean>(true);
  const [activeThemeName, setActiveThemeName] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const setTheme = (nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : preferredTheme);
    setMounted(true);
  }, []);

  const fetchJson = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`${url} returned ${res.status} ${res.statusText}: ${text.slice(0, 120)}`);
    }

    return res.json();
  };

  useEffect(() => {
    setMounted(true);
    const fetchProfileAndSettings = async () => {
      try {
        const data = await fetchJson('/api/admin/bootstrap');
        if (data.success) {
          if (data.user) setUserProfile(data.user);
          
          if (data.settings) {
            const s = data.settings;
            if (s.site_logo) setSiteLogo(s.site_logo);
            if (s.site_title) setSiteTitle(s.site_title);
            setIsEmailSmtpActive(s.plugin_email_smtp_enabled !== 'false');
            setIsContactActive(s.plugin_contact_enabled !== 'false');
            setIsSeoActive(s.plugin_seo_enabled !== 'false');
            setIsPageBuilderActive(
              s.plugin_lexi_page_builder_enabled !== 'false' &&
              s.plugin_grapesjs_enabled !== 'false'
            );
            setIsLexiShieldActive(s.plugin_lexi_shield_enabled !== 'false');
            setIsTocActive(s.plugin_table_of_contents_enabled !== 'false');
          }

          if (data.theme) {
            setActiveThemeName(data.theme);
          }
        }
      } catch (err) {
        console.error('Failed to load admin bootstrap data:', err);
      }
    };
    fetchProfileAndSettings();
  }, []);

  const handleLogout = async () => {
    try {
      const data = await fetchJson('/api/auth/logout', { method: 'POST' });
      if (data.success) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
      router.refresh();
    }
  };

  const menuItems: MenuItem[] = [
    {
      name: 'Tổng quan',
      path: '/admin/dashboard',
      icon: <LayoutDashboard size={16} />,
    },
    {
      name: 'Bài viết',
      path: '/admin/posts',
      icon: <FileText size={16} />,
      submenu: [
        { name: 'Tất cả bài viết', path: '/admin/posts' },
        { name: 'Thêm Bài Viết', path: '/admin/posts/create' },
        { name: 'Danh mục', path: '/admin/posts/categories' },
        { name: 'Thẻ', path: '/admin/posts/tags' },
      ],
    },
    {
      name: 'Trang',
      path: '/admin/pages',
      icon: <Files size={16} />,
      submenu: [
        { name: 'Tất cả trang', path: '/admin/pages' },
        { name: 'Thêm trang mới', path: '/admin/pages/create' },
      ],
    },
    ...(extraSidebarItems.some(item => item.pluginId === 'lexi-commerce') ? [{
      name: 'Products',
      path: '/admin/products',
      icon: <ShoppingBag size={16} />,
      requiredCapability: 'edit_products',
      submenu: [
        { name: 'All Products', path: '/admin/products' },
        { name: 'Add New', path: '/admin/products/create' },
        { name: 'Categories', path: '/admin/products/categories' },
        { name: 'Tags', path: '/admin/products/tags' },
      ],
    }] : []),
    {
      name: 'Thư viện',
      path: '/admin/media',
      icon: <ImageIcon size={16} />,
    },
    {
      name: 'Bình luận',
      path: '/admin/comments',
      icon: <MessageSquare size={16} />,
    },
    ...(isPageBuilderActive ? [{
      name: 'Page Builder',
      path: '/admin/templates',
      icon: <Wand2 size={16} />,
      submenu: [
        { name: 'Theme Builder', path: '/admin/templates' },
        { name: 'Phản hồi Form', path: '/admin/submissions' },
        { name: 'Cấu hình AI', path: '/admin/settings/page-builder' },
      ],
    }] : []),
    {
      name: 'Giao diện',
      path: '/admin/settings/themes',
      icon: <Palette size={16} />,
      submenu: [
        { name: 'Customize', path: '/admin/customize' },
        { name: 'Giao diện', path: '/admin/settings/themes' },
        { name: 'Thanh Menu', path: '/admin/settings/navigation' },
        { name: 'Chân trang', path: '/admin/settings/footer' },
        ...(isContactActive ? [{ name: 'Nút liên hệ', path: '/admin/settings/contact' }] : []),
      ],
    },
    {
      name: 'Tài khoản',
      path: '/admin/users',
      icon: <Users size={16} />,
      isSystemGroup: true,
      submenu: [
        { name: 'Tất cả người dùng', path: '/admin/users' },
        { name: 'Thêm người dùng', path: '/admin/users/create' },
        { name: 'Hồ sơ', path: '/admin/users/profile' },
      ],
    },
    {
      name: 'Tính năng',
      path: '/admin/settings/plugins',
      icon: <Puzzle size={16} />,
      isSystemGroup: true,
    },
    {
      name: 'Extensions',
      path: '/admin/extensions',
      icon: <Cpu size={16} />,
      isSystemGroup: true,
    },
    {
      name: 'Updates',
      path: '/admin/updates',
      icon: <CloudDownload size={16} />,
      isSystemGroup: true,
      requiredCapability: 'update_core',
    },
    ...(isSeoActive ? [{
      name: 'SEO',
      path: '/admin/settings/seo',
      icon: <Sparkles size={16} />,
      isSystemGroup: true,
    }] : []),
    ...(isLexiShieldActive ? [{
      name: 'Bảo mật',
      path: '/admin/settings/security',
      icon: <Shield size={16} />,
      isSystemGroup: true,
    }] : []),
    {
      name: 'Cài đặt',
      path: '/admin/settings',
      icon: <Settings size={16} />,
      isSystemGroup: true,
      submenu: [
        { name: 'Tổng quan', path: '/admin/settings' },
        { name: 'Đường dẫn tĩnh', path: '/admin/settings/permalink' },
        { name: 'Bình luận', path: '/admin/settings/discussion' },
        ...(isEmailSmtpActive ? [{ name: 'Cấu hình Email', path: '/admin/settings/email' }] : []),
        ...(isTocActive ? [{ name: 'Mục lục bài viết', path: '/admin/settings/table-of-contents' }] : []),
        { name: 'Phân quyền', path: '/admin/settings/roles' },
      ],
    },
    ...extraSidebarItems.filter(item => item.pluginId !== 'lexi-commerce').map(item => ({
      name: item.label,
      path: item.href,
      icon: <Puzzle size={16} />, // Generic icon for plugin items, can be improved later
      isSystemGroup: false,
      badge: undefined,
      requiredCapability: item.requiredCapability
    })) as MenuItem[],
    {
      name: 'Công cụ',
      path: '/admin/tools/import',
      icon: <Wrench size={16} />,
      isSystemGroup: true,
      submenu: [
        { name: 'Nhập dữ liệu', path: '/admin/tools/import' },
        { name: 'Trình soạn thảo', path: '/admin/tools/editor' }
      ]
    },
  ];


  const userCan = (cap: string) => {
    if (!userProfile) return false;
    if (userProfile.role === 'ADMIN') return true;
    return userProfile.capabilities?.includes(cap) ?? false;
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.name === 'Tổng quan') return userCan('view_dashboard');
    if ((item as any).requiredCapability) return userCan((item as any).requiredCapability);
    
    if (item.name === 'Bài viết') return userCan('edit_posts');
    if (item.name === 'Trang') return userCan('edit_pages');
    if (item.name === 'Thư viện') return userCan('upload_media') || userCan('manage_media');
    if (item.name === 'Bình luận') return userCan('moderate_comments');
    if (item.name === 'Page Builder') return userCan('manage_templates');
    if (item.name === 'Giao diện') return userCan('manage_themes');
    if (item.name === 'Tính năng') return userCan('manage_plugins');
    if (item.name === 'Extensions') return userCan('manage_plugins');
    if (item.name === 'SEO') return userCan('manage_seo');
    if (item.name === 'Cài đặt') return userCan('manage_settings') || userCan('manage_roles');
    if (item.name === 'Công cụ') return userCan('manage_tools');
    if (item.name === 'Tài khoản') return userCan('manage_users') || userCan('edit_profile');
    return true;
  }).map(item => {
    if (item.submenu) {
      const filteredSubmenu = item.submenu.filter(sub => {
        if (sub.name === 'Tất cả người dùng' || sub.name === 'Thêm người dùng') return userCan('manage_users');
        if (sub.name === 'Hồ sơ') return userCan('edit_profile');
        if (sub.name === 'Danh mục') return userCan('manage_categories');
        if (sub.name === 'Thẻ') return userCan('manage_tags');
        if (sub.name === 'Phản hồi Form') return userCan('view_form_submissions');
        if (sub.name === 'Phân quyền') return userCan('manage_roles');
        if (sub.name === 'Tổng quan' && item.name === 'Cài đặt') return userCan('manage_settings');
        if (sub.name === 'Đường dẫn tĩnh') return userCan('manage_settings');
        if (sub.name === 'Bình luận_submenu') return userCan('manage_settings');
        if (sub.name === 'Cấu hình Email') return userCan('manage_settings');
        return true;
      });
      return { ...item, submenu: filteredSubmenu };
    }
    return item;
  });

  const checkPathPermission = () => {
    if (!userProfile) return false;
    if (userProfile.role === 'ADMIN') return true;

    // Allow root admin route to redirect to dashboard
    if (pathname === '/admin' || pathname === '/admin/') return true;

    if (pathname.startsWith('/admin/settings/roles')) return userCan('manage_roles');
    if (pathname.startsWith('/admin/settings/permalink')) return userCan('manage_settings');
    if (pathname.startsWith('/admin/settings/discussion')) return userCan('manage_settings');
    if (pathname.startsWith('/admin/settings/email')) return userCan('manage_settings');
    if (pathname.startsWith('/admin/settings/plugins')) return userCan('manage_plugins');
    if (pathname.startsWith('/admin/customize')) return userCan('manage_themes');
    if (pathname.startsWith('/admin/settings/themes')) return userCan('manage_themes');
    if (pathname.startsWith('/admin/settings/navigation')) return userCan('manage_themes');
    if (pathname.startsWith('/admin/settings/footer')) return userCan('manage_themes');
    if (pathname.startsWith('/admin/settings/contact')) return userCan('manage_themes');
    if (pathname.startsWith('/admin/settings/seo')) return userCan('manage_seo');
    if (pathname.startsWith('/admin/settings/page-builder')) return userCan('manage_templates');
    if (pathname === '/admin/settings') return userCan('manage_settings');
    
    if (pathname.startsWith('/admin/posts/categories')) return userCan('manage_categories');
    if (pathname.startsWith('/admin/posts/tags')) return userCan('manage_tags');
    if (pathname.startsWith('/admin/posts')) return userCan('edit_posts');
    if (pathname.startsWith('/admin/pages')) return userCan('edit_pages');
    if (pathname.startsWith('/admin/media')) return userCan('upload_media') || userCan('manage_media');
    if (pathname.startsWith('/admin/comments')) return userCan('moderate_comments');
    if (pathname.startsWith('/admin/templates')) return userCan('manage_templates');
    if (pathname.startsWith('/admin/submissions')) return userCan('view_form_submissions');
    
    if (pathname.startsWith('/admin/users/profile')) return userCan('edit_profile');
    if (pathname.startsWith('/admin/users')) return userCan('manage_users');
    
    if (pathname.startsWith('/admin/extensions')) return userCan('manage_plugins');
    if (pathname.startsWith('/admin/tools')) return userCan('manage_tools');
    if (pathname.startsWith('/admin/dashboard')) return userCan('view_dashboard');
    
    return true; // Default fallback
  };

  const hasPermission = userProfile ? checkPathPermission() : false;

  return (
    <div className="flex h-screen overflow-hidden text-slate-800 dark:text-slate-200 font-sans text-[13px] bg-slate-50 dark:bg-slate-950 transition-colors" suppressHydrationWarning>
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - White glassmorphism style, Compact */}
      <aside className={`w-56 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 flex flex-col fixed inset-y-0 left-0 md:relative z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] overflow-visible transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 h-14 shrink-0 transition-colors">
          {siteLogo ? (
            <img src={siteLogo} alt="Logo" className="h-7 max-w-[140px] object-contain" />
          ) : (
            <span className="text-base font-extrabold text-brand-600 dark:text-brand-400 tracking-tight line-clamp-1">{siteTitle}</span>
          )}
          <button 
            className="md:hidden text-slate-500"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto admin-sidebar-nav pb-20">
          {filteredMenuItems.map((item, idx) => {
            const isActive = (() => {
              if (item.path === '/admin/dashboard') {
                return pathname === '/admin/dashboard';
              }
              if (item.path === '/admin/settings') {
                return pathname === '/admin/settings' || 
                       pathname.startsWith('/admin/settings/permalink') || 
                       pathname.startsWith('/admin/settings/discussion') || 
                       pathname.startsWith('/admin/settings/email') ||
                       pathname.startsWith('/admin/settings/roles');
              }
              if (item.path === '/admin/settings/themes') {
                return pathname.startsWith('/admin/customize') ||
                       pathname.startsWith('/admin/settings/themes') ||
                       pathname.startsWith('/admin/settings/navigation') ||
                       pathname.startsWith('/admin/settings/footer') ||
                       pathname.startsWith('/admin/settings/contact');
              }
              if (pathname === item.path || pathname.startsWith(item.path + '/')) {
                return true;
              }
              if (item.submenu) {
                return item.submenu.some(sub => pathname === sub.path || pathname.startsWith(sub.path + '/'));
              }
              return false;
            })();

            // Define categories dynamically
            const contentGroup = ['Bài viết', 'Trang', 'Thư viện', 'Bình luận'];
            const designGroup = ['Page Builder', 'Giao diện'];
            
            let headerText = '';
            
            const isFirstOfGroup = (name: string, group: string[]) => {
              const activeGroupItems = filteredMenuItems.filter(i => group.includes(i.name));
              return activeGroupItems.length > 0 && activeGroupItems[0].name === name;
            };

            if (isFirstOfGroup(item.name, contentGroup)) {
              headerText = t('Nội dung');
            } else if (isFirstOfGroup(item.name, designGroup)) {
              headerText = t('Thiết kế');
            } else if (item.isSystemGroup) {
              const activeSystemItems = filteredMenuItems.filter(i => i.isSystemGroup);
              if (activeSystemItems.length > 0 && activeSystemItems[0].name === item.name) {
                headerText = t('Hệ thống');
              }
            }

            return (
              <React.Fragment key={item.name}>
                {headerText && (
                  <div className="pt-3 pb-1.5 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {headerText}
                  </div>
                )}
                
                <div 
                  className="relative group overflow-visible"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link 
                    href={item.path} 
                    className={`flex items-center justify-between px-3 py-2 rounded-md font-medium transition-all duration-200 relative ${
                      isActive 
                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-slate-800/50 hover:text-brand-600 dark:hover:text-brand-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{t(item.name)}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-100 text-brand-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.submenu && (
                      <ChevronDown size={14} className={`text-current opacity-70 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                    )}
                    
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-[#fafbfe] z-20 pointer-events-none" />
                    )}
                  </Link>

                  {/* Active Sub Menu - Inline slide down */}
                  {isActive && item.submenu && (
                    <div className="mt-1 ml-4 pl-3.5 border-l border-slate-200/80 dark:border-slate-700/80 space-y-1 py-1.5">
                      {item.submenu.map((sub) => {
                        const isSubActive = pathname === sub.path;
                        const displayName = sub.path === '/settings/discussion' ? t('Bình luận_submenu') : t(sub.name);
                        return (
                          <Link
                            key={sub.name}
                            href={sub.path}
                            className={`block py-1.5 px-3 rounded-md text-[11px] font-semibold transition-colors ${
                              isSubActive
                                ? 'text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-500/10'
                                : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/30 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            {displayName}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative dark:bg-slate-950">
        <header className="h-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-6 justify-between shrink-0 z-20 transition-colors">
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mr-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="w-6 h-6 rounded flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-500/10 text-[11px] hidden sm:flex">E</div>
            <h1 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{t('Workspace')}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-2 sm:pr-4 mr-1">
              <Link 
                href="/" 
                target="_blank"
                title={t('Trang chủ')}
                className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center justify-center font-bold text-[10px] uppercase"
              >
                <ExternalLink size={15} />
              </Link>
              <button
                onClick={() => {
                  const newLocale = locale === 'vi' ? 'en' : 'vi';
                  fetch('/api/admin/preferences/locale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locale: newLocale })
                  }).then(() => {
                    window.location.reload();
                  });
                }}
                title={t('Đổi ngôn ngữ')}
                className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center justify-center font-bold text-[10px] uppercase"
              >
                <Languages size={15} className="mr-1" />
                {locale}
              </button>
              
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={t('Đổi giao diện')}
                className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center justify-center"
              >
                {mounted && theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden sm:block">
                {userProfile ? (userProfile.name || userProfile.username) : t('common.loading')}
              </span>
              {userProfile?.avatarUrl ? (
                <img 
                  src={userProfile.avatarUrl} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-400 to-indigo-500 shadow-sm border border-white dark:border-slate-800" />
              )}
            </div>
            <button
              onClick={handleLogout}
              title={t('Đăng xuất')}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer flex items-center justify-center border-none bg-transparent"
            >
              <LogOut size={15} />
            </button>
          </div>

        </header>
        <div className="flex-1 min-h-0 p-3 sm:p-6 overflow-auto relative">
          {!userProfile ? (
            <div className="w-full min-h-[300px] flex flex-col justify-center items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-600/25 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-[11px] text-slate-400 font-semibold tracking-wider">{t('Đang tải...')}</span>
            </div>
          ) : hasPermission ? (
            children
          ) : (
            <AccessDenied />
          )}
        </div>
      </main>
    </div>
  );
}
