import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export function getEditorExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false,
      undoRedo: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: 'Start typing, or press / for commands...',
    }),
    Typography,
    CodeBlockLowlight.configure({ lowlight }),
  ];
}
