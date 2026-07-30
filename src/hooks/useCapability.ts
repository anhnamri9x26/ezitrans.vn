import { useState, useEffect } from 'react';

export interface UserProfile {
  name?: string;
  username: string;
  avatarUrl?: string;
  capabilities: string[];
  role: string;
}

// Module-level cache for profile promise to prevent duplicate fetches
let cachedProfilePromise: Promise<UserProfile | null> | null = null;
let cachedProfileData: UserProfile | null = null;

export function clearCapabilityCache() {
  cachedProfilePromise = null;
  cachedProfileData = null;
}

export function fetchUserProfileSingleton(): Promise<UserProfile | null> {
  if (cachedProfileData) return Promise.resolve(cachedProfileData);
  if (cachedProfilePromise) return cachedProfilePromise;

  cachedProfilePromise = fetch('/api/users/profile')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch user profile');
      return res.json();
    })
    .then((data) => {
      if (data.success && data.user) {
        cachedProfileData = {
          name: data.user.name || '',
          username: data.user.username,
          avatarUrl: data.user.avatarUrl || '',
          capabilities: data.user.capabilities || [],
          role: data.user.role || 'SUBSCRIBER',
        };
        return cachedProfileData;
      }
      return null;
    })
    .catch((err) => {
      console.error('Error fetching capabilities:', err);
      cachedProfilePromise = null; // Reset on error to allow retry
      return null;
    });

  return cachedProfilePromise;
}

export function useCapability(requiredCapability?: string | string[]) {
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    fetchUserProfileSingleton().then((profile) => {
      if (!active) return;
      if (profile) {
        setCapabilities(profile.capabilities);
        setRole(profile.role);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const userCan = (cap: string): boolean => {
    if (role === 'ADMIN') return true;
    return capabilities.includes(cap);
  };

  let hasPermission = false;
  if (!isLoading) {
    if (role === 'ADMIN') {
      hasPermission = true;
    } else if (requiredCapability) {
      const caps = Array.isArray(requiredCapability) ? requiredCapability : [requiredCapability];
      hasPermission = caps.some((c) => capabilities.includes(c));
    } else {
      hasPermission = true;
    }
  }

  return {
    hasPermission,
    isLoading,
    capabilities,
    role,
    userCan,
  };
}
