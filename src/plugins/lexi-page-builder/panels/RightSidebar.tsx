"use client";

import dynamic from 'next/dynamic';

const RightSidebar = dynamic(() => import('./right-sidebar/RightSidebarLegacy'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white/80 backdrop-blur-md animate-pulse" />
  ),
});

export default RightSidebar;
