'use client';

import { cn } from '@/lib/utils';

interface Props {
  connected: boolean;
}

export default function ConnectionStatus({ connected }: Props) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse',
        )}
      />
      <span>{connected ? 'Connected' : 'Connecting...'}</span>
    </div>
  );
}
