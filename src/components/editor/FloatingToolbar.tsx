'use client';

import { Editor } from '@tiptap/react';
import { useEffect, useState, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, Code, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  editor: Editor;
}

function FloatButton({
  icon: Icon,
  isActive,
  onClick,
}: {
  icon: typeof Bold;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        'p-1.5 rounded hover:bg-gray-700 transition-colors',
        isActive && 'bg-gray-700 text-blue-400',
      )}
    >
      <Icon size={16} />
    </button>
  );
}

export default function FloatingToolbar({ editor }: Props) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) {
        setShow(false);
        return;
      }

      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setShow(false);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPosition({
        top: rect.top - 48 + window.scrollY,
        left: rect.left + rect.width / 2 - 100,
      });
      setShow(true);
    };

    editor.on('selectionUpdate', update);
    editor.on('blur', () => setShow(false));

    return () => {
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  if (!show) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 bg-gray-800 text-white rounded-lg shadow-xl px-1 py-0.5"
      style={{ top: position.top, left: position.left }}
    >
      <FloatButton icon={Bold} isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <FloatButton icon={Italic} isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <FloatButton icon={Underline} isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <FloatButton icon={Strikethrough} isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <FloatButton icon={Code} isActive={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
      <div className="w-px h-4 bg-gray-600 mx-0.5" />
      <FloatButton icon={Link2} isActive={editor.isActive('link')} onClick={addLink} />
    </div>
  );
}
