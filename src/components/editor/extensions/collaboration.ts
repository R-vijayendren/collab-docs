import { Extension } from '@tiptap/core';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror';
import { undo, redo } from 'y-prosemirror';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface CollabOptions {
  document: Y.Doc;
  provider: WebsocketProvider;
  user: { name: string; color: string };
  field?: string;
}

export const CollabExtension = Extension.create<CollabOptions>({
  name: 'yjsCollab',

  addProseMirrorPlugins() {
    const fragment = this.options.document.getXmlFragment(this.options.field || 'default');
    return [
      ySyncPlugin(fragment),
      yCursorPlugin(this.options.provider.awareness),
      yUndoPlugin(),
    ];
  },

  addCommands() {
    return {
      undo: () => ({ state, dispatch }) => {
        return undo(state);
      },
      redo: () => ({ state, dispatch }) => {
        return redo(state);
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo(),
      'Mod-y': () => this.editor.commands.redo(),
      'Shift-Mod-z': () => this.editor.commands.redo(),
    };
  },
});
