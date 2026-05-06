'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  onClick: () => void;
}

export default function ToolbarButton({ icon: Icon, label, shortcut, isActive, onClick }: Props) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 transition-colors',
          isActive && 'bg-gray-200 text-blue-600',
        )}
      >
        <Icon size={18} />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
        {shortcut && <span className="ml-1.5 text-gray-400">{shortcut}</span>}
      </div>
    </div>
  );
}
