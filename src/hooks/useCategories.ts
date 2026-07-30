import { useState, useEffect, useCallback } from 'react';

interface CategoryItem {
  id: number;
  name: string;
  checked: boolean;
  parentId: number | null;
}

interface UseCategoriesProps {
  type?: string;
  setHasUnsavedChanges?: (hasUnsavedChanges: boolean) => void;
}

export function useCategories({ type = 'POST', setHasUnsavedChanges }: UseCategoriesProps = {}) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'most-used'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from DB
  const loadCategories = useCallback(async (selectedIds?: number[]) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/categories?type=${type}`);
      const data = await response.json();
      if (data.success) {
        const dbCategories = (data.categories || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          checked: selectedIds ? selectedIds.includes(c.id) : false,
          parentId: c.parentId
        }));
        setCategories(dbCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newCategoryName,
          parentId: newCategoryParentId ? Number(newCategoryParentId) : null,
          type
        })
      });
      const data = await response.json();
      if (data.success && data.category) {
        const newCat = { 
          id: data.category.id, 
          name: data.category.name, 
          checked: true,
          parentId: data.category.parentId
        };
        setCategories(prev => [newCat, ...prev]);
        setNewCategoryName('');
        setNewCategoryParentId('');
        setShowCategoryInput(false);
        if (setHasUnsavedChanges) setHasUnsavedChanges(true);
      } else {
        alert('Lỗi tạo danh mục: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    }
  };

  const toggleCategory = useCallback((id: number) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [setHasUnsavedChanges]);

  const getHierarchicalCategoriesWithDepth = useCallback((cats: CategoryItem[]) => {
    const list: (CategoryItem & { depth: number })[] = [];
    const parents = cats.filter(c => !c.parentId);
    const children = cats.filter(c => c.parentId);

    const appendChildren = (parentId: number, currentDepth: number) => {
      const directChildren = children.filter(c => c.parentId === parentId);
      directChildren.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      
      directChildren.forEach(child => {
        list.push({ ...child, depth: currentDepth });
        appendChildren(child.id, currentDepth + 1);
      });
    };

    parents.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    parents.forEach(p => {
      list.push({ ...p, depth: 0 });
      appendChildren(p.id, 1);
    });

    cats.forEach(c => {
      if (!list.some(item => item.id === c.id)) {
        list.push({ ...c, depth: 0 });
      }
    });

    return list;
  }, []);

  return {
    categories,
    setCategories,
    showCategoryInput,
    setShowCategoryInput,
    newCategoryName,
    setNewCategoryName,
    newCategoryParentId,
    setNewCategoryParentId,
    activeCategoryTab,
    setActiveCategoryTab,
    isLoading,
    loadCategories,
    handleAddCategory,
    toggleCategory,
    getHierarchicalCategoriesWithDepth
  };
}
