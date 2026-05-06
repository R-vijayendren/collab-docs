'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Quote, CodeSquare, Minus, Link2, Undo2, Redo2,
} from 'lucide-react';
import ToolbarButton from './ToolbarButton';
import { useCallback, useState } from 'react';

interface Props {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-200 bg-white flex-wrap">
      <ToolbarButton icon={Undo2} label="Undo" shortcut="Ctrl+Z" onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton icon={Redo2} label="Redo" shortcut="Ctrl+Y" onClick={() => editor.chain().focus().redo().run()} />

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton icon={Bold} label="Bold" shortcut="Ctrl+B" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Italic" shortcut="Ctrl+I" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton icon={Underline} label="Underline" shortcut="Ctrl+U" isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton icon={Strikethrough} label="Strikethrough" isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <ToolbarButton icon={Code} label="Inline Code" isActive={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton icon={Heading1} label="Heading 1" isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton icon={Heading2} label="Heading 2" isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={Heading3} label="Heading 3" isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton icon={List} label="Bullet List" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="Ordered List" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton icon={ListChecks} label="Task List" isActive={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton icon={Quote} label="Blockquote" isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton icon={CodeSquare} label="Code Block" isActive={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      <ToolbarButton icon={Minus} label="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      <ToolbarButton icon={Link2} label="Link" shortcut="Ctrl+K" isActive={editor.isActive('link')} onClick={addLink} />
    </div>
  );
}
