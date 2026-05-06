import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SlashCommandState {
  active: boolean;
  range: { from: number; to: number } | null;
  query: string;
  decorationPosition: { top: number; left: number } | null;
}

const slashCommandPluginKey = new PluginKey('slashCommand');

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: slashCommandPluginKey,
        state: {
          init(): SlashCommandState {
            return { active: false, range: null, query: '', decorationPosition: null };
          },
          apply(tr, prev): SlashCommandState {
            const meta = tr.getMeta(slashCommandPluginKey);
            if (meta) return meta;

            if (!prev.active) return prev;

            if (!tr.docChanged && !tr.selectionSet) return prev;

            const { $from } = tr.selection;
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
            const match = textBefore.match(/\/(\w*)$/);

            if (!match) {
              return { active: false, range: null, query: '', decorationPosition: null };
            }

            return {
              ...prev,
              query: match[1],
              range: {
                from: $from.pos - match[0].length,
                to: $from.pos,
              },
            };
          },
        },
        props: {
          handleKeyDown(view, event) {
            const state = slashCommandPluginKey.getState(view.state) as SlashCommandState;

            if (event.key === '/' && !state.active) {
              const { $from } = view.state.selection;
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

              if (textBefore === '' || textBefore.endsWith(' ')) {
                setTimeout(() => {
                  const coords = view.coordsAtPos(view.state.selection.from);
                  const tr = view.state.tr.setMeta(slashCommandPluginKey, {
                    active: true,
                    range: { from: view.state.selection.from, to: view.state.selection.from + 1 },
                    query: '',
                    decorationPosition: { top: coords.bottom + 4, left: coords.left },
                  });
                  view.dispatch(tr);
                }, 10);
              }
            }

            if (state.active && event.key === 'Escape') {
              const tr = view.state.tr.setMeta(slashCommandPluginKey, {
                active: false, range: null, query: '', decorationPosition: null,
              });
              view.dispatch(tr);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

export { slashCommandPluginKey };
