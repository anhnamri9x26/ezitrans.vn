"use client";

import { useState, useEffect } from 'react';

/**
 * Hook cho live preview trong Customizer.
 * 
 * Dùng BroadcastChannel API — hoạt động giữa tất cả tabs/iframes cùng origin
 * mà không cần reference đến window khác.
 */
const CHANNEL_NAME = 'lexi_theme_customizer';

export function useThemeCustomizer(initialSettings: Record<string, string>) {
  const [liveSettings, setLiveSettings] = useState<Record<string, string>>(initialSettings || {});

  useEffect(() => {
    setLiveSettings(initialSettings || {});

    // Dùng BroadcastChannel để nhận settings từ Customizer
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'SETTINGS_UPDATE' && event.data.settings) {
          setLiveSettings(prev => ({ ...prev, ...event.data.settings }));
        }
      };
    } catch {
      // BroadcastChannel not supported (fallback: do nothing)
    }

    return () => {
      try { channel?.close(); } catch { /* ignore */ }
    };
  }, [initialSettings]);

  return liveSettings;
}

/**
 * Gửi settings từ Customizer sang tất cả iframes/tabs cùng origin.
 */
export function broadcastSettings(settings: Record<string, string>) {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'SETTINGS_UPDATE', settings });
    channel.close();
  } catch {
    // BroadcastChannel not supported
  }
}
