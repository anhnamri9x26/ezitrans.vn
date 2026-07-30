import { useState, useEffect, useCallback } from 'react';

interface UseTagsProps {
  type?: string;
  setHasUnsavedChanges?: (hasUnsavedChanges: boolean) => void;
}

export function useTags({ type = 'POST', setHasUnsavedChanges }: UseTagsProps = {}) {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  // Load existing tags from DB on mount for autocomplete suggestions
  const loadAllTags = useCallback(async () => {
    try {
      const response = await fetch(`/api/tags?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setAllTags(data.tags || []);
      }
    } catch (error) {
      console.error("Failed to load tags for autocomplete:", error);
    }
  }, []);

  // Update suggestions dynamically when tagInput is updated
  useEffect(() => {
    const lastWord = tagInput.split(',').pop()?.trim() || '';
    if (!lastWord) {
      setTagSuggestions([]);
      return;
    }

    const filtered = allTags
      .map(t => t.name)
      .filter(name => 
        name.toLowerCase().includes(lastWord.toLowerCase()) && 
        !tags.some(attached => attached.toLowerCase() === name.toLowerCase())
      );
    setTagSuggestions(filtered);
    setActiveSuggestionIdx(0);
  }, [tagInput, allTags, tags]);

  const handleAddTags = useCallback(() => {
    if (!tagInput.trim()) return;
    const inputTags = tagInput.split(',').map(t => t.trim()).filter(t => t !== '');
    const newTags = [...tags];
    let changed = false;
    for (const t of inputTags) {
      if (!newTags.some(existing => existing.toLowerCase() === t.toLowerCase())) {
        newTags.push(t);
        changed = true;
      }
    }
    if (changed) {
      setTags(newTags);
      if (setHasUnsavedChanges) setHasUnsavedChanges(true);
    }
    setTagInput('');
    setTagSuggestions([]);
  }, [tagInput, tags, setHasUnsavedChanges]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    const newTags = [...tags];
    if (!newTags.some(t => t.toLowerCase() === suggestion.toLowerCase())) {
      newTags.push(suggestion);
      setTags(newTags);
      if (setHasUnsavedChanges) setHasUnsavedChanges(true);
    }
    setTagInput('');
    setTagSuggestions([]);
  }, [tags, setHasUnsavedChanges]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [setHasUnsavedChanges]);

  return {
    tagInput,
    setTagInput,
    tags,
    setTags,
    allTags,
    tagSuggestions,
    activeSuggestionIdx,
    setActiveSuggestionIdx,
    loadAllTags,
    handleAddTags,
    handleSelectSuggestion,
    handleRemoveTag
  };
}
