import { useState, useEffect } from 'react';
import { calculateSeoScore, calculateReadabilityScore } from '@/hooks/useSeoAnalyzer';

export interface Author {
  name: string | null;
}

export interface Category {
  id: number;
  name: string;
}

export interface TagItem {
  id: number;
  name: string;
}

export interface ParentItem {
  id: number;
  title: string;
}

export interface PostItem {
  id: number;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  publishedAt: string;
  author: Author | null;
  categories?: Category[];
  tags?: TagItem[];
  parent?: ParentItem | null;
  seoKeywords?: string | null;
  seoDescription?: string | null;
  content?: string | null;
  seoTitle?: string | null;
}

interface UseAdminContentProps {
  type: 'POST' | 'PAGE' | 'SERVICE' | 'PRODUCT';
}

export function useAdminContent({ type }: UseAdminContentProps) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(10);

  // Screen Options state
  const [isScreenOptionsOpen, setIsScreenOptionsOpen] = useState(false);
  const [showAuthorCol, setShowAuthorCol] = useState(true);
  const [showCategoryCol, setShowCategoryCol] = useState(true);
  const [showSeoCol, setShowSeoCol] = useState(true);
  const [showReadabilityCol, setShowReadabilityCol] = useState(true);
  const [showDateCol, setShowDateCol] = useState(true);

  // Load postsPerPage and Screen Options from Cache (localStorage) on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`lexi_per_page_${type}`);
      if (cached) {
        setPostsPerPage(Number(cached));
      }
      const author = localStorage.getItem(`lexi_show_col_author_${type}`);
      if (author !== null) setShowAuthorCol(author === 'true');
      const category = localStorage.getItem(`lexi_show_col_category_${type}`);
      if (category !== null) setShowCategoryCol(category === 'true');
      const seo = localStorage.getItem(`lexi_show_col_seo_${type}`);
      if (seo !== null) setShowSeoCol(seo === 'true');
      const readability = localStorage.getItem(`lexi_show_col_readability_${type}`);
      if (readability !== null) setShowReadabilityCol(readability === 'true');
      const date = localStorage.getItem(`lexi_show_col_date_${type}`);
      if (date !== null) setShowDateCol(date === 'true');
    }
  }, [type]);

  const handleToggleCol = (colName: 'author' | 'category' | 'seo' | 'readability' | 'date', val: boolean) => {
    if (typeof window === 'undefined') return;
    if (colName === 'author') {
      setShowAuthorCol(val);
      localStorage.setItem(`lexi_show_col_author_${type}`, String(val));
    } else if (colName === 'category') {
      setShowCategoryCol(val);
      localStorage.setItem(`lexi_show_col_category_${type}`, String(val));
    } else if (colName === 'seo') {
      setShowSeoCol(val);
      localStorage.setItem(`lexi_show_col_seo_${type}`, String(val));
    } else if (colName === 'readability') {
      setShowReadabilityCol(val);
      localStorage.setItem(`lexi_show_col_readability_${type}`, String(val));
    } else if (colName === 'date') {
      setShowDateCol(val);
      localStorage.setItem(`lexi_show_col_date_${type}`, String(val));
    }
  };

  const handlePostsPerPageChange = (val: number) => {
    setPostsPerPage(val);
    setCurrentPage(1); // Reset to first page
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lexi_per_page_${type}`, String(val));
    }
  };
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // format: 'YYYY-MM'
  const [seoFilter, setSeoFilter] = useState<'all' | 'good' | 'ok' | 'bad' | 'none'>('all');
  const [readabilityFilter, setReadabilityFilter] = useState<'all' | 'good' | 'ok' | 'bad' | 'none'>('all');
  
  // Bulk Actions
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  const [isSeoPluginEnabled, setIsSeoPluginEnabled] = useState(true);
  const [permalinkStructure, setPermalinkStructure] = useState('/%postname%.html');
  const [permalinkProductBase, setPermalinkProductBase] = useState('/san-pham');

  // Parse query parameters from URL on mount to pre-filter posts/pages from the SEO dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const seo = params.get('seoScore');
      if (seo === 'good' || seo === 'ok' || seo === 'bad' || seo === 'none') {
        setSeoFilter(seo as any);
      }
      const readability = params.get('readabilityScore');
      if (readability === 'good' || readability === 'ok' || readability === 'bad' || readability === 'none') {
        setReadabilityFilter(readability as any);
      }
      const cat = params.get('category');
      if (cat && cat !== 'all') {
        setCategoryFilter(cat);
      }
    }
  }, []);

  // Reset to first page when any filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, tagFilter, dateFilter, seoFilter, readabilityFilter]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/posts?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        console.error("Failed to load posts:", data.error);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    if (type !== 'POST' && type !== 'PRODUCT') return; // Posts/products have separate categories/tags filters
    try {
      const catRes = await fetch(`/api/categories?type=${type}`);
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories || []);
      }

      const tagRes = await fetch(`/api/tags?type=${type}`);
      const tagData = await tagRes.json();
      if (tagData.success) {
        setAllTags(tagData.tags || []);
      }
    } catch (error) {
      console.error("Error loading filter data:", error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchPosts();
    fetchFiltersData();

    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          setIsSeoPluginEnabled(data.settings.plugin_seo_enabled !== 'false');
          if (data.settings.permalink_structure) {
            setPermalinkStructure(data.settings.permalink_structure);
          }
          if (data.settings.permalink_product_base) {
            setPermalinkProductBase(data.settings.permalink_product_base);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, [type]);

  const getPostTypeName = () => type === 'PAGE' ? 'trang' : type === 'PRODUCT' ? 'sản phẩm' : type === 'SERVICE' ? 'dịch vụ' : 'bài viết';

  const handleDeletePost = async (id: number, postTitle: string) => {
    const postTypeName = getPostTypeName();
    const isTrashView = statusFilter === 'trash';
    const actionLabel = isTrashView ? 'xóa vĩnh viễn' : 'chuyển vào thùng rác';
    const warning = isTrashView ? 'Thao tác này không thể hoàn tác!' : 'Bạn có thể khôi phục lại từ Thùng rác.';
    if (!confirm(`Bạn có chắc chắn muốn ${actionLabel} ${postTypeName} "${postTitle}"? ${warning}`)) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${id}${isTrashView ? '?force=true' : ''}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        setPosts(prev => prev.filter(post => post.id !== id));
        setSelectedPostIds(prev => prev.filter(selectedId => selectedId !== id));
        alert(isTrashView ? `Đã xoá vĩnh viễn ${postTypeName}!` : `Đã chuyển ${postTypeName} vào thùng rác!`);
      } else {
        alert(`Không thể ${actionLabel} ${postTypeName}: ${data.error}`);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error("Error deleting post:", error);
    }
  };

  // Generate unique Month-Years for Date Filter from all posts
  const getAvailableMonths = () => {
    const monthsMap = new Map<string, string>();
    posts.forEach(post => {
      const date = new Date(post.publishedAt || post.createdAt);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        const label = `Tháng ${date.getMonth() + 1}, ${year}`;
        monthsMap.set(key, label);
      }
    });
    return Array.from(monthsMap.entries()).map(([key, label]) => ({ key, label }));
  };

  // Bulk action handler
  const handleBulkActionApply = async () => {
    if (selectedPostIds.length === 0) {
      alert('Vui lòng chọn ít nhất một mục để áp dụng thao tác!');
      return;
    }

    const postTypeName = getPostTypeName();
    const isTrashView = statusFilter === 'trash';

    if (bulkAction === 'delete') {
      const actionLabel = isTrashView ? 'xóa vĩnh viễn' : 'chuyển vào thùng rác';
      const warning = isTrashView ? 'Thao tác này không thể hoàn tác!' : 'Các mục có thể khôi phục lại từ Thùng rác.';
      if (!confirm(`Bạn có chắc chắn muốn ${actionLabel} ${selectedPostIds.length} ${postTypeName} đã chọn? ${warning}`)) {
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const id of selectedPostIds) {
        try {
          const response = await fetch(`/api/posts/${id}${isTrashView ? '?force=true' : ''}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }

      await fetchPosts();
      setSelectedPostIds([]);
      setBulkAction('');
      alert(`Đã hoàn tất thao tác hàng loạt: ${isTrashView ? 'Xóa vĩnh viễn' : 'Chuyển vào thùng rác'} thành công ${successCount} ${postTypeName}${failCount > 0 ? `, thất bại ${failCount} mục` : ''}.`);
    } else {
      alert('Vui lòng chọn một hành động hợp lệ!');
    }
  };

  const handleToggleSelectAll = (filteredPostsList: PostItem[]) => {
    if (selectedPostIds.length === filteredPostsList.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filteredPostsList.map(p => p.id));
    }
  };

  const handleToggleSelectPost = (id: number) => {
    if (selectedPostIds.includes(id)) {
      setSelectedPostIds(prev => prev.filter(selectedId => selectedId !== id));
    } else {
      setSelectedPostIds(prev => [...prev, id]);
    }
  };

  // Real-time local filtering
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (post.slug && post.slug.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all'
      ? post.status !== 'TRASH'
      : (statusFilter === 'published' && post.status === 'PUBLISHED') ||
        (statusFilter === 'draft' && post.status === 'DRAFT') ||
        (statusFilter === 'trash' && post.status === 'TRASH');
    
    const matchesCategory = (type !== 'POST' && type !== 'PRODUCT') || categoryFilter === 'all' || 
                             (post.categories && post.categories.some(c => c.id === Number(categoryFilter)));

    const matchesTag = (type !== 'POST' && type !== 'PRODUCT') || tagFilter === 'all' ||
                       (post.tags && post.tags.some(t => t.id === Number(tagFilter)));

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const date = new Date(post.publishedAt || post.createdAt);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const formatted = `${year}-${month}`;
        matchesDate = formatted === dateFilter;
      } else {
        matchesDate = false;
      }
    }

    let matchesSeo = true;
    if (isSeoPluginEnabled && seoFilter !== 'all') {
      const score = calculateSeoScore({
        title: post.title,
        content: post.content || '',
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        seoKeywords: post.seoKeywords || '',
        slug: post.slug || ''
      });
      if (seoFilter === 'good') matchesSeo = score >= 80;
      else if (seoFilter === 'ok') matchesSeo = score >= 50 && score < 80;
      else if (seoFilter === 'bad') matchesSeo = score > 0 && score < 50;
      else if (seoFilter === 'none') matchesSeo = score === 0;
    }

    let matchesReadability = true;
    if (isSeoPluginEnabled && readabilityFilter !== 'all') {
      const score = calculateReadabilityScore({ content: post.content || '' });
      if (readabilityFilter === 'good') matchesReadability = score >= 80;
      else if (readabilityFilter === 'ok') matchesReadability = score >= 50 && score < 80;
      else if (readabilityFilter === 'bad') matchesReadability = score > 0 && score < 50;
      else if (readabilityFilter === 'none') matchesReadability = score === 0;
    }
                          
    return matchesSearch && matchesStatus && matchesCategory && matchesTag && matchesDate && matchesSeo && matchesReadability;
  });

  // Pagination Calculations
  const totalItems = filteredPosts.length;
  const totalPages = Math.ceil(totalItems / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = Math.min(startIndex + postsPerPage, totalItems);
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pageNumbers.push(-1);
      }
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      if (end < totalPages - 1) {
        pageNumbers.push(-1);
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Calculate status counts
  const totalCount = posts.filter(p => p.status !== 'TRASH').length;
  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter(p => p.status === 'DRAFT').length;
  const trashCount = posts.filter(p => p.status === 'TRASH').length;

  return {
    posts,
    categories,
    allTags,
    isLoading,
    currentPage,
    postsPerPage,
    isScreenOptionsOpen,
    setIsScreenOptionsOpen,
    showAuthorCol,
    showCategoryCol,
    showSeoCol,
    showReadabilityCol,
    showDateCol,
    handleToggleCol,
    handlePostsPerPageChange,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    tagFilter,
    setTagFilter,
    dateFilter,
    setDateFilter,
    seoFilter,
    setSeoFilter,
    readabilityFilter,
    setReadabilityFilter,
    selectedPostIds,
    setSelectedPostIds,
    bulkAction,
    setBulkAction,
    isSeoPluginEnabled,
    permalinkStructure,
    filteredPosts,
    paginatedPosts,
    totalPages,
    totalItems,
    permalinkProductBase,
    startIndex,
    endIndex,
    totalCount,
    publishedCount,
    draftCount,
    trashCount,
    handleDeletePost,
    getAvailableMonths,
    handleBulkActionApply,
    handleToggleSelectAll,
    handleToggleSelectPost,
    handlePageChange,
    getPageNumbers,
  };
}
