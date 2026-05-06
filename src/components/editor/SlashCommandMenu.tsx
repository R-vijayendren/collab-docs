'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor, Range } from '@tiptap/react';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks,
  Quote, CodeSquare, Minus, Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  title: string;
  icon: typeof Heading1;
  description: string;
  command: (editor: Editor, range: Range) => void;
}

const COMMANDS: CommandItem[] = [
  {
    title: 'Paragraph',
    icon: Type,
    description: 'Plain text',
    command: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Heading 1',
    icon: Heading1,
    description: 'Large heading',
    command: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    icon: Heading2,
    description: 'Medium heading',
    command: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    icon: Heading3,
    description: 'Small heading',
    command: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    icon: List,
    description: 'Unordered list',
    command: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Ordered List',
    icon: ListOrdered,
    description: 'Numbered list',
    command: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Task List',
    icon: ListChecks,
    description: 'Checklist',
    command: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Blockquote',
    icon: Quote,
    description: 'Quote block',
    command: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    icon: CodeSquare,
    description: 'Code snippet',
    command: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    icon: Minus,
    description: 'Horizontal rule',
    command: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

interface Props {
  editor: Editor;
  range: Range;
  query: string;
  onClose: () => void;
}

export default function SlashCommandMenu({ editor, range, query, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const selectItem = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (item) {
        item.command(editor, range);
        onClose();
      }
    },
    [filtered, editor, range, onClose],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectItem(selectedIndex);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filtered.length, selectedIndex, selectItem, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-64 max-h-80 overflow-y-auto z-50"
    >
      {filtered.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            onClick={() => selectItem(index)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 text-left transition-colors',
              index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50',
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded flex items-center justify-center',
              index === selectedIndex ? 'bg-blue-100' : 'bg-gray-100',
            )}>
              <Icon size={16} />
            </div>
            <div>
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { COMMANDS };
export type { CommandItem };
