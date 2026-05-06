'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { PanelLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const { sidebarOpen, toggleSidebar } = useDocumentStore();

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-3 left-3 z-10 p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <PanelLeft size={16} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
